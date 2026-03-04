import { sql } from "../db"

export interface PricingSchedule {
  id: string
  room_id: string
  day_of_week: number
  start_hour: number
  end_hour: number
  multiplier: number
}

export interface PricingScheduleWithRoom extends PricingSchedule {
  room_name: string
  base_hourly_rate: number
  tier: string
}

export const pricingScheduleRepository = {
  async findByRoom(roomId: string): Promise<PricingSchedule[]> {
    const rows = await sql`
      SELECT * FROM pricing_schedules 
      WHERE room_id = ${roomId}
      ORDER BY day_of_week, start_hour
    `
    return rows as unknown as PricingSchedule[]
  },

  async findApplicable(
    roomId: string,
    dayOfWeek: number,
    hour: number
  ): Promise<PricingSchedule | null> {
    const rows = await sql`
      SELECT * FROM pricing_schedules 
      WHERE room_id = ${roomId}
        AND day_of_week = ${dayOfWeek}
        AND start_hour <= ${hour}
        AND end_hour > ${hour}
      LIMIT 1
    `
    return (rows[0] as unknown as PricingSchedule) || null
  },

  async findAllWithRoomDetails(): Promise<PricingScheduleWithRoom[]> {
    const rows = await sql`
      SELECT ps.*, r.name as room_name, r.base_hourly_rate, r.tier
      FROM pricing_schedules ps
      JOIN rooms r ON r.id = ps.room_id
      ORDER BY r.name, ps.day_of_week, ps.start_hour
    `
    return rows as unknown as PricingScheduleWithRoom[]
  },

  async upsert(
    roomId: string,
    dayOfWeek: number,
    startHour: number,
    endHour: number,
    multiplier: number
  ): Promise<PricingSchedule> {
    const existing = await sql`
      SELECT id FROM pricing_schedules 
      WHERE room_id = ${roomId} 
        AND day_of_week = ${dayOfWeek}
        AND start_hour = ${startHour}
    `

    if (existing.length > 0) {
      const rows = await sql`
        UPDATE pricing_schedules 
        SET multiplier = ${multiplier}, end_hour = ${endHour}
        WHERE id = ${existing[0].id}
        RETURNING *
      `
      return rows[0] as unknown as PricingSchedule
    } else {
      const rows = await sql`
        INSERT INTO pricing_schedules (room_id, day_of_week, start_hour, end_hour, multiplier)
        VALUES (${roomId}, ${dayOfWeek}, ${startHour}, ${endHour}, ${multiplier})
        RETURNING *
      `
      return rows[0] as unknown as PricingSchedule
    }
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM pricing_schedules WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },
}
