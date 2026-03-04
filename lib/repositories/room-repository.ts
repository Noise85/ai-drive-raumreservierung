import { sql } from "../db"
import type { Room, RoomWithLocation, OccupancyStatus } from "../schemas/room"

export const roomRepository = {
  async findById(id: string): Promise<Room | null> {
    const rows = await sql`SELECT * FROM rooms WHERE id = ${id}`
    return (rows[0] as Room) || null
  },

  async findByIdWithLocation(id: string): Promise<RoomWithLocation | null> {
    const rows = await sql`
      SELECT r.*, f.name as floor_name, f.floor_number, 
             b.id as building_id, b.name as building_name, b.city
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE r.id = ${id}
    `
    return (rows[0] as RoomWithLocation) || null
  },

  async findAll(options?: { activeOnly?: boolean }): Promise<Room[]> {
    if (options?.activeOnly) {
      const rows = await sql`SELECT * FROM rooms WHERE is_active = true ORDER BY name`
      return rows as Room[]
    }
    const rows = await sql`SELECT * FROM rooms ORDER BY name`
    return rows as Room[]
  },

  async findAllWithLocation(options?: { activeOnly?: boolean }): Promise<RoomWithLocation[]> {
    if (options?.activeOnly) {
      const rows = await sql`
        SELECT r.*, f.name as floor_name, f.floor_number, 
               b.id as building_id, b.name as building_name
        FROM rooms r
        JOIN floors f ON f.id = r.floor_id
        JOIN buildings b ON b.id = f.building_id
        WHERE r.is_active = true
        ORDER BY b.name, f.floor_number, r.name
      `
      return rows as RoomWithLocation[]
    }
    const rows = await sql`
      SELECT r.*, f.name as floor_name, f.floor_number, 
             b.id as building_id, b.name as building_name
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      ORDER BY b.name, f.floor_number, r.name
    `
    return rows as RoomWithLocation[]
  },

  async findByBuilding(buildingId: string): Promise<RoomWithLocation[]> {
    const rows = await sql`
      SELECT r.*, f.name as floor_name, f.floor_number, 
             b.id as building_id, b.name as building_name
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE b.id = ${buildingId} AND r.is_active = true
      ORDER BY f.floor_number, r.name
    `
    return rows as RoomWithLocation[]
  },

  async findByFloor(floorId: string): Promise<Room[]> {
    const rows = await sql`
      SELECT * FROM rooms WHERE floor_id = ${floorId} ORDER BY name
    `
    return rows as Room[]
  },

  async findAvailable(params: {
    startTime: string
    endTime: string
    minCapacity?: number
  }): Promise<RoomWithLocation[]> {
    const { startTime, endTime, minCapacity = 1 } = params

    const rows = await sql`
      SELECT r.*, f.name as floor_name, f.floor_number, 
             b.id as building_id, b.name as building_name
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE r.is_active = true
        AND r.capacity >= ${minCapacity}
        AND NOT EXISTS (
          SELECT 1 FROM bookings bk
          WHERE bk.room_id = r.id
            AND bk.status = 'confirmed'
            AND bk.start_time < ${endTime}::timestamptz
            AND bk.end_time > ${startTime}::timestamptz
        )
      ORDER BY r.capacity ASC
    `
    return rows as RoomWithLocation[]
  },

  async updateOccupancyStatus(id: string, status: OccupancyStatus): Promise<Room | null> {
    const rows = await sql`
      UPDATE rooms SET occupancy_status = ${status}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return (rows[0] as Room) || null
  },

  async create(data: {
    floor_id: string
    name: string
    description?: string | null
    capacity: number
    equipment?: string[]
    image_url?: string | null
    tier?: string
    base_hourly_rate: number
    energy_kwh_per_hour?: number
  }): Promise<Room> {
    const rows = await sql`
      INSERT INTO rooms (
        floor_id, name, description, capacity, equipment, 
        image_url, tier, base_hourly_rate, energy_kwh_per_hour
      )
      VALUES (
        ${data.floor_id},
        ${data.name},
        ${data.description ?? null},
        ${data.capacity},
        ${JSON.stringify(data.equipment ?? [])}::jsonb,
        ${data.image_url ?? null},
        ${data.tier ?? "standard"},
        ${data.base_hourly_rate},
        ${data.energy_kwh_per_hour ?? 2.5}
      )
      RETURNING *
    `
    return rows[0] as Room
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      description: string | null
      capacity: number
      equipment: string[]
      image_url: string | null
      tier: string
      base_hourly_rate: number
      energy_kwh_per_hour: number
      is_active: boolean
    }>
  ): Promise<Room | null> {
    const current = await this.findById(id)
    if (!current) return null

    const rows = await sql`
      UPDATE rooms SET
        name = ${data.name ?? current.name},
        description = ${data.description !== undefined ? data.description : current.description},
        capacity = ${data.capacity ?? current.capacity},
        equipment = ${JSON.stringify(data.equipment ?? current.equipment)}::jsonb,
        image_url = ${data.image_url !== undefined ? data.image_url : current.image_url},
        tier = ${data.tier ?? current.tier},
        base_hourly_rate = ${data.base_hourly_rate ?? current.base_hourly_rate},
        energy_kwh_per_hour = ${data.energy_kwh_per_hour ?? current.energy_kwh_per_hour},
        is_active = ${data.is_active ?? current.is_active},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows[0] as Room
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM rooms WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },

  async getStats(): Promise<{ total_rooms: number; available_rooms: number }> {
    const rows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE is_active) as total_rooms,
        COUNT(*) FILTER (WHERE is_active AND occupancy_status = 'empty') as available_rooms
      FROM rooms
    `
    return rows[0] as { total_rooms: number; available_rooms: number }
  },

  async getOccupancyStats(): Promise<{ occupied: number; total: number }> {
    const rows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE occupancy_status = 'occupied') as occupied,
        COUNT(*) FILTER (WHERE is_active) as total
      FROM rooms
    `
    return rows[0] as { occupied: number; total: number }
  },

  async getEnergyProfiles(): Promise<Array<{
    name: string
    energy_kwh_per_hour: number
    tier: string
    capacity: number
    floor_name: string
    building_name: string
  }>> {
    const rows = await sql`
      SELECT r.name, r.energy_kwh_per_hour, r.tier, r.capacity, f.name as floor_name, b.name as building_name
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      WHERE r.is_active = true
      ORDER BY r.energy_kwh_per_hour DESC
    `
    return rows as unknown as Array<{
      name: string
      energy_kwh_per_hour: number
      tier: string
      capacity: number
      floor_name: string
      building_name: string
    }>
  },

  async getActiveForPricing(): Promise<Array<{ id: string; name: string; base_hourly_rate: number; tier: string }>> {
    const rows = await sql`
      SELECT id, name, base_hourly_rate, tier FROM rooms WHERE is_active = true ORDER BY name
    `
    return rows as unknown as Array<{ id: string; name: string; base_hourly_rate: number; tier: string }>
  },
}
