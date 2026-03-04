"use server"

/**
 * Server Actions - Thin orchestration layer
 * 
 * These actions handle form submissions and redirects.
 * Business logic is delegated to services.
 */

import { redirect } from "next/navigation"
import { userService } from "./services/user-service"
import { bookingService } from "./services/booking-service"
import { occupancyService } from "./services/occupancy-service"

// ============================================================================
// User Actions
// ============================================================================

export async function switchUser(formData: FormData) {
  const userId = formData.get("userId") as string
  const locale = formData.get("locale") as string

  await userService.switchUser(userId)
  redirect(`/${locale}`)
}

export async function switchLocale(formData: FormData) {
  const locale = formData.get("locale") as string
  const currentPath = formData.get("currentPath") as string

  await userService.switchLocale(locale)

  // Replace locale prefix in current path
  const pathParts = currentPath.split("/")
  pathParts[1] = locale
  redirect(pathParts.join("/"))
}

// ============================================================================
// Booking Actions
// ============================================================================

export async function createBooking(formData: FormData) {
  const roomId = formData.get("roomId") as string
  const userId = formData.get("userId") as string
  const title = formData.get("title") as string
  const startTime = formData.get("startTime") as string
  const endTime = formData.get("endTime") as string
  const attendeeCount = parseInt(formData.get("attendeeCount") as string) || 1
  const costCenterId = formData.get("costCenterId") as string || null
  const locale = formData.get("locale") as string

  const result = await bookingService.createBooking({
    room_id: roomId,
    user_id: userId,
    title,
    start_time: startTime,
    end_time: endTime,
    attendee_count: attendeeCount,
    cost_center_id: costCenterId,
  })

  if (!result.success) {
    if (result.errorCode === "CONFLICT") {
      redirect(`/${locale}/bookings/new?error=conflict&roomId=${roomId}`)
    }
    redirect(`/${locale}/bookings/new?error=${result.errorCode}&message=${encodeURIComponent(result.error || "")}`)
  }

  redirect(`/${locale}/bookings`)
}

export async function cancelBooking(formData: FormData) {
  const bookingId = formData.get("bookingId") as string
  const userId = formData.get("userId") as string
  const locale = formData.get("locale") as string

  await bookingService.cancelBooking(bookingId, userId)
  redirect(`/${locale}/bookings`)
}

// ============================================================================
// Occupancy & Sensor Actions
// ============================================================================

export async function simulateSensorEvent(formData: FormData) {
  const roomId = formData.get("roomId") as string
  const newStatus = formData.get("status") as "occupied" | "empty"

  await occupancyService.recordSensorEvent(roomId, newStatus)
}

export async function triggerAutoRelease(formData: FormData) {
  const locale = formData.get("locale") as string

  await bookingService.autoReleaseGhostBookings()
  redirect(`/${locale}/facility/dashboard`)
}
