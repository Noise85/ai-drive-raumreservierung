import {
  convertToModelMessages,
  streamText,
  tool,
  UIMessage,
  validateUIMessages,
  stepCountIs,
} from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"
import { roomService } from "@/lib/services/room-service"
import { bookingService } from "@/lib/services/booking-service"
import { pricingService } from "@/lib/services/pricing-service"
import { userService } from "@/lib/services/user-service"

export const maxDuration = 30

const searchRoomsTool = tool({
  description:
    "Search for available rooms matching the user's requirements. Returns top-scored rooms with justification.",
  inputSchema: z.object({
    capacity: z.number().describe("Number of attendees"),
    equipment: z
      .array(z.string())
      .describe(
        "Required equipment items like projector, whiteboard, video_conferencing, microphone, recording, standing_desk"
      ),
    date: z
      .string()
      .describe("Date in YYYY-MM-DD format"),
    startTime: z
      .string()
      .describe("Start time in HH:MM format (24h)"),
    endTime: z
      .string()
      .describe("End time in HH:MM format (24h)"),
    building: z
      .string()
      .nullable()
      .describe("Preferred building name or null"),
    tier: z
      .string()
      .nullable()
      .describe("Preferred tier: standard, premium, or executive, or null"),
  }),
  execute: async ({ capacity, equipment, date, startTime, endTime, building, tier }) => {
    const start = `${date}T${startTime}:00+01:00`
    const end = `${date}T${endTime}:00+01:00`

    const results = await roomService.searchAndScore({
      requiredCapacity: capacity,
      requiredEquipment: equipment,
      preferredBuilding: building || undefined,
      preferredTier: tier || undefined,
      startTime: start,
      endTime: end,
    })

    if (results.length === 0) {
      return { rooms: [], message: "No rooms available for the requested time and criteria." }
    }

    return {
      rooms: results.map((r) => ({
        id: r.room.id,
        name: r.room.name,
        building: r.room.building_name,
        floor: r.room.floor_name,
        capacity: r.room.capacity,
        tier: r.room.tier,
        equipment: r.room.equipment,
        hourlyRate: Number(r.room.base_hourly_rate),
        score: r.score,
        justification: r.justification.join(". "),
      })),
      message: `Found ${results.length} matching room(s).`,
    }
  },
})

const createBookingTool = tool({
  description:
    "Create a booking for a specific room. Use this ONLY after the user has confirmed they want to book.",
  inputSchema: z.object({
    roomId: z.string().describe("The UUID of the room to book"),
    title: z.string().describe("Meeting title"),
    date: z.string().describe("Date in YYYY-MM-DD format"),
    startTime: z.string().describe("Start time in HH:MM format"),
    endTime: z.string().describe("End time in HH:MM format"),
    attendeeCount: z.number().describe("Number of attendees"),
    userId: z.string().describe("The UUID of the user making the booking"),
  }),
  execute: async ({ roomId, title, date, startTime, endTime, attendeeCount, userId }) => {
    const start = `${date}T${startTime}:00+01:00`
    const end = `${date}T${endTime}:00+01:00`

    // Get room info and user cost center
    const room = await roomService.findById(roomId)
    const user = await userService.findById(userId)
    
    if (!room) {
      return { success: false, message: "Room not found." }
    }

    const result = await bookingService.createBooking({
      room_id: roomId,
      user_id: userId,
      title,
      start_time: start,
      end_time: end,
      attendee_count: attendeeCount,
      cost_center_id: user?.cost_center_id ?? null,
    })

    if (!result.success) {
      return { success: false, message: result.error || "Booking failed." }
    }

    const pricing = await pricingService.calculateCost(roomId, start, end)

    return {
      success: true,
      bookingId: result.booking?.id,
      roomName: room.name,
      message: `Booking "${title}" confirmed in ${room.name} on ${date} from ${startTime} to ${endTime}. Estimated cost: CHF ${pricing.totalCost.toFixed(2)}.`,
    }
  },
})

const cancelBookingTool = tool({
  description: "Cancel an existing booking by its ID or by searching for it by title.",
  inputSchema: z.object({
    bookingId: z
      .string()
      .nullable()
      .describe("The UUID of the booking to cancel, or null to search by title"),
    title: z
      .string()
      .nullable()
      .describe("Partial title to search for, used if bookingId is null"),
    userId: z.string().describe("The UUID of the user"),
  }),
  execute: async ({ bookingId, title, userId }) => {
    let booking
    if (bookingId) {
      const found = await bookingService.findByIdWithDetails(bookingId)
      if (found && found.user_id === userId && found.status === "confirmed") {
        booking = found
      }
    } else if (title) {
      const { upcoming, all } = await bookingService.getUserBookings(userId)
      booking = [...upcoming, ...all].find(b => 
        b.status === "confirmed" && 
        b.title.toLowerCase().includes(title.toLowerCase())
      )
    }

    if (!booking) {
      return { success: false, message: "Booking not found or already cancelled." }
    }

    await bookingService.cancelBooking(booking.id, userId, "ai_chat")

    return {
      success: true,
      message: `Booking "${booking.title}" in ${booking.room_name} has been cancelled.`,
    }
  },
})

const listMyBookingsTool = tool({
  description: "List upcoming bookings for the current user.",
  inputSchema: z.object({
    userId: z.string().describe("The UUID of the user"),
  }),
  execute: async ({ userId }) => {
    const { upcoming } = await bookingService.getUserBookings(userId)
    const bookings = upcoming.slice(0, 10)

    if (bookings.length === 0) {
      return { bookings: [], message: "You have no upcoming bookings." }
    }

    return {
      bookings: bookings.map((b) => ({
        id: b.id,
        title: b.title,
        room: b.room_name,
        building: b.building_name,
        start: b.start_time,
        end: b.end_time,
        attendees: b.attendee_count,
        estimatedCost: b.estimated_cost,
      })),
      message: `Found ${bookings.length} upcoming booking(s).`,
    }
  },
})

// App action tool for triggering UI navigation and actions
const appActionTool = tool({
  description: `Execute an app action to help the user. Use this to navigate pages or show results. Available actions:
- "navigate_rooms": Show rooms page with optional filters (capacity, equipment, tier, building, query)
- "navigate_bookings": Show user's bookings page
- "navigate_new_booking": Open new booking form with optional room pre-selected
- "navigate_room_detail": Show a specific room's detail page
- "show_search_results": Display room search results inline (after searchRooms)
- "confirm_action": Show a confirmation message with result details
Always use this after completing an action so the user can see the results.`,
  inputSchema: z.object({
    action: z.enum([
      "navigate_rooms",
      "navigate_bookings", 
      "navigate_new_booking",
      "navigate_room_detail",
      "show_search_results",
      "confirm_action"
    ]).describe("The app action to execute"),
    params: z.object({
      // For navigate_rooms
      capacity: z.number().optional(),
      equipment: z.array(z.string()).optional(),
      tier: z.string().optional(),
      building: z.string().optional(),
      query: z.string().optional(),
      // For navigate_room_detail and navigate_new_booking
      roomId: z.string().optional(),
      roomName: z.string().optional(),
      // For confirm_action
      confirmationType: z.enum(["booking_created", "booking_cancelled", "search_complete"]).optional(),
      message: z.string().optional(),
      // For show_search_results - room data
      rooms: z.array(z.object({
        id: z.string(),
        name: z.string(),
        building: z.string(),
        capacity: z.number(),
        tier: z.string(),
        hourlyRate: z.number(),
        score: z.number().optional(),
      })).optional(),
    }).describe("Parameters for the action"),
  }),
  execute: async ({ action, params }) => {
    // This tool just returns the action for the client to execute
    // The actual execution happens in the chat interface
    return {
      executeAction: true,
      action,
      params,
      timestamp: new Date().toISOString(),
    }
  },
})

const tools = {
  searchRooms: searchRoomsTool,
  createBooking: createBookingTool,
  cancelBooking: cancelBookingTool,
  listMyBookings: listMyBookingsTool,
  appAction: appActionTool,
}

export async function POST(req: Request) {
  const body = await req.json()
  const userId = body.userId || "00a00000-0000-0000-0000-000000000001"
  const pageContext = body.pageContext || null

  const messages = await validateUIMessages({
    messages: body.messages as UIMessage[],
    tools,
  })

  // Build context-aware system prompt
  let contextPrompt = ""
  if (pageContext) {
    contextPrompt = `

CURRENT PAGE CONTEXT:
- Page: ${pageContext.page}${pageContext.section ? ` (${pageContext.section})` : ""}
- Context: ${pageContext.hint}
- Parameters: ${JSON.stringify(pageContext.params || {})}

CONTEXTUAL BEHAVIOR:
- Tailor your responses to the current page context
- If the user is already on a relevant page, don't navigate away unnecessarily
- Suggest relevant actions based on where they are`
  }

  const result = streamText({
    model: openai("gpt-5.2"),
    system: `You are a helpful room booking assistant for a Swiss corporate office building reservation system called "Raumreservierung". You can control the app directly through voice commands.

Your capabilities:
- Search for available meeting rooms based on capacity, equipment, date/time, building preference, and tier
- Create new bookings (always confirm with the user first)
- Cancel existing bookings
- List upcoming bookings
- Navigate the app to show relevant pages and results

IMPORTANT - App Control:
After completing any action, ALWAYS use the appAction tool to show results or navigate:
- After searchRooms: Use appAction with "navigate_rooms" to show filtered results, or "show_search_results" to display inline
- After createBooking (success): Use appAction with "confirm_action" (confirmationType: "booking_created") and then "navigate_bookings"
- After cancelBooking (success): Use appAction with "confirm_action" (confirmationType: "booking_cancelled")
- After listMyBookings: Use appAction with "navigate_bookings" to show the bookings page
- When user asks to "show rooms" or "find rooms": Search first, then navigate_rooms with filters
- When user says "book it" or confirms: Call createBooking, then navigate to confirmation

Voice-optimized responses:
- Keep responses short and clear for text-to-speech
- Announce what action you're taking: "Searching for rooms...", "Booking confirmed!", "Showing your bookings"
- After navigation, briefly describe what's on screen
- Respond naturally to voice commands like "yes", "book it", "that one", etc.

VOICE COMMANDS TO RECOGNIZE:
- "book it", "yes", "confirm", "that one" = confirmation to proceed
- "cancel", "nevermind", "stop" = cancel current action
- Room names can be spoken naturally

Guidelines:
- Be concise and professional
- When searching rooms, present the top 3 results briefly with room name, capacity, and price
- Always confirm before creating or cancelling a booking ("Should I book [room] for [time]?")
- Use the user's ID: ${userId}
- Dates should default to upcoming weekdays if not specified. Today is ${new Date().toISOString().split("T")[0]}
- Times are in Europe/Zurich timezone
- Equipment options: projector, whiteboard, video_conferencing, microphone, recording, standing_desk
- Room tiers: standard, premium, executive
- Currency is CHF (Swiss Francs)
- Format monetary values with CHF prefix and 2 decimal places${contextPrompt}`,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
