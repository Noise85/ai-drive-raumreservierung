import { roomRepository } from "../repositories/room-repository"
import { pricingScheduleRepository } from "../repositories/pricing-repository"

export interface PricingResult {
  baseRate: number
  multiplier: number
  effectiveRate: number
  totalCost: number
  breakdown: string
  hours: number
}

export const pricingService = {
  /**
   * Calculate booking cost with dynamic pricing
   */
  async calculateCost(
    roomId: string,
    startTime: string,
    endTime: string
  ): Promise<PricingResult> {
    const room = await roomRepository.findById(roomId)
    if (!room) {
      throw new Error("Room not found")
    }

    const baseRate = Number(room.base_hourly_rate)
    const start = new Date(startTime)
    const end = new Date(endTime)
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    const dayOfWeek = start.getDay()
    const startHour = start.getHours()

    // Get applicable pricing schedule
    const schedule = await pricingScheduleRepository.findApplicable(roomId, dayOfWeek, startHour)

    const multiplier = schedule ? Number(schedule.multiplier) : 1.0
    const effectiveRate = baseRate * multiplier
    const totalCost = effectiveRate * hours

    const breakdown =
      multiplier !== 1.0
        ? `CHF ${baseRate.toFixed(2)}/hr × ${multiplier}× (${multiplier > 1 ? "peak" : "off-peak"}) × ${hours.toFixed(1)}h = CHF ${totalCost.toFixed(2)}`
        : `CHF ${baseRate.toFixed(2)}/hr × ${hours.toFixed(1)}h = CHF ${totalCost.toFixed(2)}`

    return { baseRate, multiplier, effectiveRate, totalCost, breakdown, hours }
  },

  /**
   * Get pricing schedule for a room
   */
  async getPricingSchedule(roomId: string) {
    return pricingScheduleRepository.findByRoom(roomId)
  },

  /**
   * Update pricing schedule
   */
  async updatePricingSchedule(
    roomId: string,
    dayOfWeek: number,
    startHour: number,
    endHour: number,
    multiplier: number
  ) {
    return pricingScheduleRepository.upsert(roomId, dayOfWeek, startHour, endHour, multiplier)
  },
}
