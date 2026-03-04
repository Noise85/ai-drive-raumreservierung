import { bookingRepository } from "../repositories/booking-repository"
import { roomRepository } from "../repositories/room-repository"
import { auditRepository } from "../repositories/audit-repository"
import { pricingService } from "./pricing-service"
import { CreateBookingSchema, type CreateBookingInput } from "../schemas/booking"

export interface BookingResult {
  success: boolean
  booking?: Awaited<ReturnType<typeof bookingRepository.findById>>
  error?: string
  errorCode?: "CONFLICT" | "ROOM_NOT_FOUND" | "VALIDATION_ERROR" | "UNKNOWN"
}

export const bookingService = {
  /**
   * Create a new booking with validation, conflict checking, and cost estimation
   */
  async createBooking(input: CreateBookingInput): Promise<BookingResult> {
    // Validate input
    const validation = CreateBookingSchema.safeParse(input)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors.map((e) => e.message).join(", "),
        errorCode: "VALIDATION_ERROR",
      }
    }

    const data = validation.data
    const startTime = typeof data.start_time === "string" ? data.start_time : data.start_time.toISOString()
    const endTime = typeof data.end_time === "string" ? data.end_time : data.end_time.toISOString()

    // Check room exists
    const room = await roomRepository.findById(data.room_id)
    if (!room) {
      return {
        success: false,
        error: "Room not found",
        errorCode: "ROOM_NOT_FOUND",
      }
    }

    // Check for conflicts
    const conflicts = await bookingRepository.findConflicts(data.room_id, startTime, endTime)
    if (conflicts.length > 0) {
      return {
        success: false,
        error: "Room is already booked for this time slot",
        errorCode: "CONFLICT",
      }
    }

    // Calculate estimated cost
    const pricing = await pricingService.calculateCost(data.room_id, startTime, endTime)

    // Create booking
    const booking = await bookingRepository.create({
      room_id: data.room_id,
      user_id: data.user_id,
      title: data.title,
      start_time: startTime,
      end_time: endTime,
      attendee_count: data.attendee_count,
      cost_center_id: data.cost_center_id ?? null,
      estimated_cost: pricing.totalCost,
    })

    // Audit log
    await auditRepository.log({
      entity_type: "booking",
      entity_id: booking.id,
      action: "created",
      actor_id: data.user_id,
      details: { title: data.title, room_id: data.room_id },
    })

    return { success: true, booking }
  },

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<BookingResult> {
    const booking = await bookingRepository.findById(bookingId)
    if (!booking) {
      return {
        success: false,
        error: "Booking not found",
        errorCode: "UNKNOWN",
      }
    }

    const updated = await bookingRepository.updateStatus(bookingId, "cancelled")

    await auditRepository.log({
      entity_type: "booking",
      entity_id: bookingId,
      action: "cancelled",
      actor_id: userId,
      details: { reason: reason || "user_cancelled" },
    })

    return { success: true, booking: updated ?? undefined }
  },

  /**
   * Auto-release ghost bookings (rooms booked but empty)
   */
  async autoReleaseGhostBookings(): Promise<{ released: number; bookingIds: string[] }> {
    const ghosts = await bookingRepository.findGhostBookings()
    const released: string[] = []

    for (const ghost of ghosts) {
      await bookingRepository.updateStatus(ghost.booking_id, "auto_released")

      await auditRepository.log({
        entity_type: "booking",
        entity_id: ghost.booking_id,
        action: "auto_released",
        actor_id: null,
        details: { reason: "ghost_booking" },
      })

      released.push(ghost.booking_id)
    }

    return { released: released.length, bookingIds: released }
  },

  /**
   * Get user's bookings categorized by status
   */
  async getUserBookings(userId: string) {
    const bookings = await bookingRepository.findByUser(userId)
    const now = new Date()

    return {
      upcoming: bookings.filter(
        (b) => b.status === "confirmed" && new Date(b.start_time) > now
      ),
      past: bookings.filter(
        (b) =>
          b.status === "completed" ||
          (b.status === "confirmed" && new Date(b.end_time) <= now)
      ),
      cancelled: bookings.filter(
        (b) => b.status === "cancelled" || b.status === "auto_released"
      ),
      all: bookings,
    }
  },

  /**
   * Get today's bookings for a user
   */
  async getTodayByUser(userId: string) {
    return bookingRepository.findTodayByUser(userId)
  },

  /**
   * Get upcoming bookings for a user
   */
  async getUpcomingByUser(userId: string, limit?: number) {
    return bookingRepository.findUpcomingByUser(userId, limit)
  },

  /**
   * Get upcoming bookings for a room
   */
  async getUpcomingByRoom(roomId: string, limit?: number) {
    return bookingRepository.findUpcomingByRoom(roomId, limit)
  },

  /**
   * Get ghost bookings count
   */
  async getGhostBookingsCount() {
    return bookingRepository.getGhostBookingsCount()
  },

  /**
   * Find booking by ID with details
   */
  async findByIdWithDetails(bookingId: string) {
    return bookingRepository.findByIdWithDetails(bookingId)
  },

  /**
   * Get bookings for a date range (for calendar view)
   */
  async getByDateRange(
    startDate: string,
    endDate: string,
    options?: { costCenterId?: string; status?: Array<"confirmed" | "completed" | "cancelled" | "auto_released"> }
  ) {
    return bookingRepository.findByDateRange(startDate, endDate, options)
  },

  /**
   * Get bookings for a specific room within a date range (for room availability calendar)
   */
  async getByRoomAndDateRange(
    roomId: string,
    startDate: string,
    endDate: string,
    status: Array<"confirmed" | "completed" | "cancelled" | "auto_released"> = ["confirmed"]
  ) {
    return bookingRepository.findByRoomAndDateRange(roomId, startDate, endDate, status)
  },

  /**
   * Get bookings for a specific user within a date range (for My Bookings calendar)
   */
  async getByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    status?: Array<"confirmed" | "completed" | "cancelled" | "auto_released">
  ) {
    return bookingRepository.findByUserAndDateRange(userId, startDate, endDate, status)
  },

  /**
   * Check if there are conflicts for a room at a given time
   */
  async checkConflicts(roomId: string, startTime: string, endTime: string, excludeBookingId?: string) {
    const conflicts = await bookingRepository.findConflicts(roomId, startTime, endTime, excludeBookingId)
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    }
  },
}
