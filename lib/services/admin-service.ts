import { pricingScheduleRepository } from "../repositories/pricing-repository"
import { roomRepository } from "../repositories/room-repository"
import { buildingRepository } from "../repositories/building-repository"
import { analyticsRepository } from "../repositories/analytics-repository"
import { carbonRepository } from "../repositories/carbon-repository"

export interface PricingSchedule {
  id: string
  room_id: string
  day_of_week: number
  start_hour: number
  end_hour: number
  multiplier: number
  room_name: string
  base_hourly_rate: number
  tier: string
}

export interface ScoringWeight {
  id: string
  building_id: string
  building_name: string
  equipment_weight: number
  proximity_weight: number
  capacity_weight: number
  utilization_weight: number
}

export interface RoomEnergyProfile {
  name: string
  energy_kwh_per_hour: number
  tier: string
  capacity: number
  floor_name: string
  building_name: string
}

export interface BuildingEnergy {
  name: string
  carbon_intensity_factor: number
  room_count: number
}

export interface CarbonIntensityHistory {
  factor: number
  effective_from: string
  building_name: string
}

export interface RoomUtilization {
  room_name: string
  building_name: string
  capacity: number
  booking_count: number
  total_hours: number
}

export interface BuildingStats {
  building_name: string
  room_count: number
  booking_count: number
  total_hours: number
  avg_duration: number
}

export const adminService = {
  async getPricingSchedules(): Promise<PricingSchedule[]> {
    const rows = await pricingScheduleRepository.findAllWithRoomDetails()
    return rows as unknown as PricingSchedule[]
  },

  async getActiveRoomsForPricing(): Promise<Array<{ id: string; name: string; base_hourly_rate: number; tier: string }>> {
    return roomRepository.getActiveForPricing()
  },

  async getScoringWeights(): Promise<ScoringWeight[]> {
    const rows = await analyticsRepository.getScoringWeights()
    return rows as unknown as ScoringWeight[]
  },

  async getRoomEnergyProfiles(): Promise<RoomEnergyProfile[]> {
    const rows = await roomRepository.getEnergyProfiles()
    return rows as unknown as RoomEnergyProfile[]
  },

  async getBuildingEnergy(): Promise<BuildingEnergy[]> {
    const rows = await buildingRepository.findAllWithEnergy()
    return rows as unknown as BuildingEnergy[]
  },

  async getCarbonIntensityHistory(): Promise<CarbonIntensityHistory[]> {
    const rows = await carbonRepository.getCarbonIntensityHistory()
    return rows as unknown as CarbonIntensityHistory[]
  },

  async getRoomUtilization(days = 30): Promise<RoomUtilization[]> {
    const rows = await analyticsRepository.getRoomUtilization(days)
    return rows as unknown as RoomUtilization[]
  },

  async getBuildingStats(days = 30): Promise<BuildingStats[]> {
    const rows = await analyticsRepository.getBuildingStats(days)
    return rows as unknown as BuildingStats[]
  },
}
