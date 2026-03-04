import { costCenterRepository } from "../repositories/cost-center-repository"
import { bookingRepository } from "../repositories/booking-repository"

export interface ChargebackReportItem {
  id: string
  title: string
  start_time: Date
  end_time: Date
  estimated_cost: number | null
  actual_cost: number | null
  status: string
  room_name: string
  tier: string
  user_name: string
  department: string | null
  cost_center_name: string | null
  cost_center_code: string | null
}

export const financeService = {
  /**
   * Get cost center leaderboard with usage statistics
   */
  async getCostCenterLeaderboard() {
    return costCenterRepository.findAllWithUsage()
  },

  /**
   * Get chargeback report for a date range
   */
  async getChargebackReport(
    startDate: string,
    endDate: string,
    costCenterId?: string
  ): Promise<ChargebackReportItem[]> {
    const bookings = await bookingRepository.findByDateRange(startDate, endDate, {
      costCenterId,
      status: ["confirmed", "completed"],
    })

    return bookings.map((b) => ({
      id: b.id,
      title: b.title,
      start_time: new Date(b.start_time),
      end_time: new Date(b.end_time),
      estimated_cost: b.estimated_cost,
      actual_cost: b.actual_cost,
      status: b.status,
      room_name: b.room_name,
      tier: (b as Record<string, unknown>).tier as string || "standard",
      user_name: (b as Record<string, unknown>).user_name as string || "",
      department: (b as Record<string, unknown>).department as string || null,
      cost_center_name: b.cost_center_name,
      cost_center_code: b.cost_center_code,
    }))
  },

  /**
   * Get all cost centers
   */
  async getCostCenters() {
    return costCenterRepository.findAll()
  },
}
