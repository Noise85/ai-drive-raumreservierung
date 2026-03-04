import { sensorRepository, occupancyEventRepository } from "../repositories/sensor-repository"
import { roomRepository } from "../repositories/room-repository"
import type { OccupancyStatus } from "../schemas/room"

export const occupancyService = {
  /**
   * Record a sensor event and update room status
   */
  async recordSensorEvent(
    roomId: string,
    status: "occupied" | "empty"
  ): Promise<{ success: boolean; previousStatus?: OccupancyStatus }> {
    const room = await roomRepository.findById(roomId)
    if (!room) {
      return { success: false }
    }

    const previousStatus = room.occupancy_status as OccupancyStatus

    // Find sensor for room
    const sensors = await sensorRepository.findByRoom(roomId)
    const sensorId = sensors[0]?.id || null

    // Create occupancy event
    await occupancyEventRepository.create({
      room_id: roomId,
      sensor_id: sensorId,
      status,
    })

    // Update room status
    await roomRepository.updateOccupancyStatus(roomId, status)

    return { success: true, previousStatus }
  },
}
