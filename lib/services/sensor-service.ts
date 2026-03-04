import { sensorRepository } from "../repositories/sensor-repository"

export const sensorService = {
  /**
   * Get all sensors with location details
   */
  async findAllWithLocation() {
    return sensorRepository.findAllWithLocation()
  },

  /**
   * Get count of offline sensors
   */
  async getOfflineCount() {
    return sensorRepository.getOfflineCount()
  },
}
