import { NextRequest, NextResponse } from "next/server"
import { bookingService } from "@/lib/services"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const roomId = searchParams.get("roomId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const status = searchParams.get("status")?.split(",") as Array<"confirmed" | "completed" | "cancelled" | "auto_released"> | undefined

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate are required" },
      { status: 400 }
    )
  }

  try {
    let bookings

    if (userId) {
      // Fetch bookings for a specific user (My Bookings / Dashboard calendar)
      bookings = await bookingService.getByUserAndDateRange(userId, startDate, endDate, status)
    } else if (roomId) {
      // Fetch bookings for a specific room (Booking Form availability calendar)
      bookings = await bookingService.getByRoomAndDateRange(roomId, startDate, endDate, status || ["confirmed"])
    } else {
      // Fetch all bookings in date range (Admin/Facility view)
      bookings = await bookingService.getByDateRange(startDate, endDate, { status })
    }

    // Transform to calendar event format
    const events = bookings.map((booking) => ({
      id: booking.id,
      title: booking.title,
      start_time: booking.start_time,
      end_time: booking.end_time,
      status: booking.status,
      room_name: booking.room_name,
      building_name: booking.building_name,
      user_name: (booking as unknown as { user_name?: string }).user_name,
      attendee_count: booking.attendee_count,
      estimated_cost: booking.estimated_cost,
    }))

    return NextResponse.json({ bookings: events })
  } catch (error) {
    console.error("Calendar API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch calendar data" },
      { status: 500 }
    )
  }
}
