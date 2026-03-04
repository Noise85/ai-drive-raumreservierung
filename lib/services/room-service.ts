import { roomRepository } from "../repositories/room-repository"
import { bookingRepository } from "../repositories/booking-repository"
import type { RoomWithLocation, RoomSearchParams } from "../schemas/room"

export interface RoomScore {
  room: RoomWithLocation
  score: number
  justification: string[]
}

export interface ScoringCriteria {
  requiredCapacity: number
  requiredEquipment: string[]
  preferredBuilding?: string
  preferredTier?: string
  startTime: string
  endTime: string
}

export const roomService = {
  /**
   * Search and score rooms based on criteria
   */
  async searchAndScore(criteria: ScoringCriteria): Promise<RoomScore[]> {
    const { requiredCapacity, requiredEquipment, preferredBuilding, preferredTier, startTime, endTime } = criteria

    // Get available rooms
    const rooms = await roomRepository.findAvailable({
      startTime,
      endTime,
      minCapacity: requiredCapacity,
    })

    if (rooms.length === 0) {
      // Constraint relaxation: try without capacity filter
      const relaxedRooms = await roomRepository.findAvailable({ startTime, endTime })
      return this.scoreRooms(relaxedRooms, criteria, true)
    }

    return this.scoreRooms(rooms, criteria, false)
  },

  /**
   * Score a list of rooms against criteria
   */
  scoreRooms(
    rooms: RoomWithLocation[],
    criteria: ScoringCriteria,
    relaxed: boolean
  ): RoomScore[] {
    return rooms
      .map((room) => {
        const justification: string[] = []
        const equipment = (room.equipment as string[]) || []

        // Equipment match (0-1)
        let equipmentScore = 1
        if (criteria.requiredEquipment.length > 0) {
          const matches = criteria.requiredEquipment.filter((e) => equipment.includes(e))
          equipmentScore = matches.length / criteria.requiredEquipment.length
          if (equipmentScore === 1) {
            justification.push("Has all required equipment")
          } else if (equipmentScore > 0) {
            justification.push(`Has ${matches.length}/${criteria.requiredEquipment.length} required items`)
          } else {
            justification.push("Missing required equipment")
          }
        }

        // Capacity fit score
        const capacityRatio = criteria.requiredCapacity / room.capacity
        let capacityScore: number
        if (capacityRatio >= 0.5 && capacityRatio <= 1.0) {
          capacityScore = 1 - Math.abs(0.75 - capacityRatio) * 0.5
          justification.push(`Good capacity fit (${criteria.requiredCapacity}/${room.capacity})`)
        } else if (capacityRatio < 0.5) {
          capacityScore = 0.4
          justification.push(`Room is oversized (${room.capacity} seats)`)
        } else {
          capacityScore = relaxed ? 0.3 : 0.5
          if (relaxed) {
            justification.push(`Below requested capacity (relaxed search)`)
          }
        }

        // Tier preference
        let tierScore = 0.7
        if (criteria.preferredTier && room.tier === criteria.preferredTier) {
          tierScore = 1
          justification.push(`Matches preferred tier: ${room.tier}`)
        }

        // Building preference
        let buildingScore = 0.8
        if (criteria.preferredBuilding) {
          if (room.building_name.toLowerCase().includes(criteria.preferredBuilding.toLowerCase())) {
            buildingScore = 1
            justification.push(`In preferred building: ${room.building_name}`)
          } else {
            justification.push(`Different building: ${room.building_name}`)
          }
        }

        // Currently empty bonus
        let occupancyBonus = 0
        if (room.occupancy_status === "empty") {
          occupancyBonus = 0.1
          justification.push("Currently empty")
        }

        // Calculate weighted score
        const score =
          equipmentScore * 0.3 +
          capacityScore * 0.25 +
          tierScore * 0.15 +
          buildingScore * 0.2 +
          (1 - Number(room.base_hourly_rate) / 200) * 0.1 +
          occupancyBonus

        return {
          room,
          score: Math.round(score * 100) / 100,
          justification,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  },

  /**
   * Get room stats (total rooms, available rooms)
   */
  async getStats() {
    return roomRepository.getStats()
  },

  /**
   * Get occupancy stats
   */
  async getOccupancyStats() {
    return roomRepository.getOccupancyStats()
  },

  /**
   * Find all rooms with location details
   */
  async findAllWithLocation(options?: { activeOnly?: boolean }) {
    return roomRepository.findAllWithLocation(options)
  },

  /**
   * Find rooms by building
   */
  async findByBuilding(buildingId: string) {
    return roomRepository.findByBuilding(buildingId)
  },

  /**
   * Find room by ID with location details
   */
  async findByIdWithLocation(id: string) {
    return roomRepository.findByIdWithLocation(id)
  },

  /**
   * Find room by ID
   */
  async findById(id: string) {
    return roomRepository.findById(id)
  },
}
