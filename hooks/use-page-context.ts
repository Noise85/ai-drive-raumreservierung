"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useMemo } from "react"

export interface PageContext {
  page: string
  section: string | null
  params: Record<string, string>
  hint: string
  proactivePrompt: string
}

/**
 * Hook to get context about the current page for the AI assistant
 * This helps the AI understand where the user is and suggest relevant actions
 */
export function usePageContext(locale: string): PageContext {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  return useMemo(() => {
    // Remove locale prefix from pathname
    const path = pathname.replace(`/${locale}`, "") || "/"
    const params: Record<string, string> = {}
    
    // Collect search params
    searchParams.forEach((value, key) => {
      params[key] = value
    })
    
    // Determine context based on route
    if (path === "/" || path === "") {
      return {
        page: "home",
        section: null,
        params,
        hint: "User is on the home dashboard",
        proactivePrompt: getTimeBasedGreeting() + " Need a room for today?"
      }
    }
    
    if (path === "/rooms" || path.startsWith("/rooms")) {
      // Check if viewing a specific room
      const roomIdMatch = path.match(/\/rooms\/([^/]+)/)
      if (roomIdMatch) {
        return {
          page: "room-detail",
          section: null,
          params: { ...params, roomId: roomIdMatch[1] },
          hint: `User is viewing room details for room ID: ${roomIdMatch[1]}`,
          proactivePrompt: "Would you like to book this room?"
        }
      }
      
      // Room search/list page
      const filterHint = Object.entries(params).length > 0
        ? `with filters: ${JSON.stringify(params)}`
        : "without filters"
      return {
        page: "rooms",
        section: null,
        params,
        hint: `User is browsing available rooms ${filterHint}`,
        proactivePrompt: params.capacity
          ? `Showing rooms for ${params.capacity}+ people. Want me to narrow it down?`
          : "Looking for a specific room? Tell me your requirements."
      }
    }
    
    if (path === "/bookings" || path.startsWith("/bookings")) {
      if (path === "/bookings/new") {
        return {
          page: "new-booking",
          section: null,
          params,
          hint: "User is creating a new booking",
          proactivePrompt: "Tell me when you need the room and for how many people."
        }
      }
      return {
        page: "bookings",
        section: null,
        params,
        hint: "User is viewing their bookings list",
        proactivePrompt: "Want me to read your upcoming bookings or make changes?"
      }
    }
    
    if (path === "/chat") {
      return {
        page: "chat",
        section: null,
        params,
        hint: "User is in the chat interface",
        proactivePrompt: "How can I help you today?"
      }
    }
    
    if (path.startsWith("/admin")) {
      const adminSection = path.replace("/admin/", "").split("/")[0]
      return {
        page: "admin",
        section: adminSection || null,
        params,
        hint: `User is in admin section: ${adminSection || "overview"}`,
        proactivePrompt: "Need help with administrative tasks?"
      }
    }
    
    if (path.startsWith("/facility")) {
      const facilitySection = path.replace("/facility/", "").split("/")[0]
      return {
        page: "facility",
        section: facilitySection || null,
        params,
        hint: `User is in facility management: ${facilitySection || "dashboard"}`,
        proactivePrompt: "Would you like a summary of current occupancy?"
      }
    }
    
    if (path.startsWith("/finance")) {
      const financeSection = path.replace("/finance/", "").split("/")[0]
      return {
        page: "finance",
        section: financeSection || null,
        params,
        hint: `User is in finance section: ${financeSection || "overview"}`,
        proactivePrompt: "Need help with cost reports or chargebacks?"
      }
    }
    
    if (path.startsWith("/sustainability")) {
      return {
        page: "sustainability",
        section: "dashboard",
        params,
        hint: "User is viewing sustainability dashboard",
        proactivePrompt: "Want to know the carbon impact of your bookings?"
      }
    }
    
    if (path.startsWith("/visitors")) {
      return {
        page: "visitors",
        section: "checkin",
        params,
        hint: "User is on visitor check-in page",
        proactivePrompt: "Ready to check in a visitor?"
      }
    }
    
    // Default fallback
    return {
      page: "unknown",
      section: null,
      params,
      hint: `User is on page: ${path}`,
      proactivePrompt: "How can I help you?"
    }
  }, [pathname, searchParams, locale])
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning!"
  if (hour < 17) return "Good afternoon!"
  return "Good evening!"
}

/**
 * Generate AI system prompt addition based on page context
 */
export function getContextualSystemPrompt(context: PageContext): string {
  return `
CURRENT PAGE CONTEXT:
- Page: ${context.page}${context.section ? ` (${context.section})` : ""}
- Context: ${context.hint}
- Parameters: ${JSON.stringify(context.params)}

CONTEXTUAL BEHAVIOR:
- If the user seems to need guidance, you can proactively suggest: "${context.proactivePrompt}"
- Tailor your responses to the current page context
- If the user is already on a relevant page, don't navigate away unnecessarily
`.trim()
}
