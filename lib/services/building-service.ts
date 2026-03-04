import { buildingRepository, floorRepository } from "../repositories/building-repository"

export const buildingService = {
  /**
   * Get all buildings with counts
   */
  async findAllWithCounts() {
    return buildingRepository.findAllWithCounts()
  },

  /**
   * Get all buildings
   */
  async findAll() {
    return buildingRepository.findAll()
  },

  /**
   * Get all floors with counts
   */
  async findAllFloorsWithCounts() {
    return floorRepository.findAllWithCounts()
  },
}
