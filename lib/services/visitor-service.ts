import { visitorRepository } from "../repositories/visitor-repository"
import { auditRepository } from "../repositories/audit-repository"
import type { Visitor, VisitorWithBooking, CreateVisitorInput } from "../schemas/visitor"

export interface CheckInResult {
  success: boolean
  visitor?: VisitorWithBooking
  error?: string
  errorCode?: "NOT_FOUND" | "ALREADY_CHECKED_IN" | "CANCELLED" | "EXPIRED" | "UNKNOWN"
}

export const visitorService = {
  /**
   * Check in a visitor by QR token
   */
  async checkIn(qrToken: string): Promise<CheckInResult> {
    const visitor = await visitorRepository.findByTokenWithBooking(qrToken)

    if (!visitor) {
      return {
        success: false,
        error: "Invalid check-in code.",
        errorCode: "NOT_FOUND",
      }
    }

    if (visitor.status === "checked_in") {
      return {
        success: false,
        error: "Already checked in.",
        errorCode: "ALREADY_CHECKED_IN",
      }
    }

    if (visitor.status === "cancelled") {
      return {
        success: false,
        error: "This invitation has been cancelled.",
        errorCode: "CANCELLED",
      }
    }

    if (visitor.token_expires_at && new Date(visitor.token_expires_at) < new Date()) {
      return {
        success: false,
        error: "Check-in code has expired.",
        errorCode: "EXPIRED",
      }
    }

    // Mark as checked in
    await visitorRepository.checkIn(qrToken)

    // Audit log
    await auditRepository.log({
      entity_type: "visitor",
      entity_id: visitor.id,
      action: "checked_in",
      details: { name: visitor.name, room: visitor.room_name },
    })

    // Get updated visitor
    const updated = await visitorRepository.findByTokenWithBooking(qrToken)

    return {
      success: true,
      visitor: updated ?? undefined,
    }
  },

  /**
   * Create a new visitor invitation
   */
  async createVisitor(input: CreateVisitorInput): Promise<Visitor> {
    const visitor = await visitorRepository.create({
      booking_id: input.booking_id,
      name: input.name,
      email: input.email,
    })

    await auditRepository.log({
      entity_type: "visitor",
      entity_id: visitor.id,
      action: "invited",
      details: { name: input.name, email: input.email },
    })

    return visitor
  },

  /**
   * Cancel a visitor invitation
   */
  async cancelVisitor(visitorId: string): Promise<boolean> {
    const visitor = await visitorRepository.updateStatus(visitorId, "cancelled")
    
    if (visitor) {
      await auditRepository.log({
        entity_type: "visitor",
        entity_id: visitorId,
        action: "cancelled",
      })
      return true
    }

    return false
  },

  /**
   * Get visitors for a booking
   */
  async getBookingVisitors(bookingId: string): Promise<Visitor[]> {
    return visitorRepository.findByBooking(bookingId)
  },

  /**
   * Get pending check-ins
   */
  async getPendingCheckIns(): Promise<VisitorWithBooking[]> {
    return visitorRepository.findPendingCheckins()
  },
}
