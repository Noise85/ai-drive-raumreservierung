import { sql } from "../db"
import type { Sensor, OccupancyEvent } from "../schemas/sensor"

export const sensorRepository = {
  async findById(id: string): Promise<Sensor | null> {
    const rows = await sql`SELECT * FROM sensors WHERE id = ${id}`
    return (rows[0] as Sensor) || null
  },

  async findByRoom(roomId: string): Promise<Sensor[]> {
    const rows = await sql`SELECT * FROM sensors WHERE room_id = ${roomId}`
    return rows as Sensor[]
  },

  async findAll(): Promise<Sensor[]> {
    const rows = await sql`SELECT * FROM sensors ORDER BY room_id, type`
    return rows as Sensor[]
  },

  async create(data: { room_id: string; type?: string }): Promise<Sensor> {
    const rows = await sql`
      INSERT INTO sensors (room_id, type)
      VALUES (${data.room_id}, ${data.type ?? "pir"})
      RETURNING *
    `
    return rows[0] as Sensor
  },

  async updateStatus(id: string, status: "online" | "offline"): Promise<Sensor | null> {
    const rows = await sql`
      UPDATE sensors SET status = ${status}, last_signal_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return (rows[0] as Sensor) || null
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM sensors WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },

  async findAllWithLocation(): Promise<Array<Sensor & { room_name: string; building_name: string }>> {
    const rows = await sql`
      SELECT s.*, r.name as room_name, b.name as building_name
      FROM sensors s
      JOIN rooms r ON r.id = s.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      ORDER BY b.name, r.name
    `
    return rows as Array<Sensor & { room_name: string; building_name: string }>
  },

  async getOfflineCount(): Promise<number> {
    const rows = await sql`
      SELECT COUNT(*) FILTER (WHERE status = 'offline') as offline_count
      FROM sensors
    `
    return Number(rows[0]?.offline_count || 0)
  },
}

export const occupancyEventRepository = {
  async create(data: {
    room_id: string
    sensor_id?: string | null
    status: "occupied" | "empty"
  }): Promise<OccupancyEvent> {
    const rows = await sql`
      INSERT INTO occupancy_events (room_id, sensor_id, status)
      VALUES (${data.room_id}, ${data.sensor_id ?? null}, ${data.status})
      RETURNING *
    `
    return rows[0] as OccupancyEvent
  },
}
