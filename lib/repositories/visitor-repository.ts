import { sql } from "../db"
import type { Visitor, VisitorWithBooking, VisitorStatus } from "../schemas/visitor"

export const visitorRepository = {
  async findById(id: string): Promise<Visitor | null> {
    const rows = await sql`SELECT * FROM visitors WHERE id = ${id}`
    return (rows[0] as Visitor) || null
  },

  async findByToken(qrToken: string): Promise<Visitor | null> {
    const rows = await sql`SELECT * FROM visitors WHERE qr_token = ${qrToken}`
    return (rows[0] as Visitor) || null
  },

  async findByTokenWithBooking(qrToken: string): Promise<VisitorWithBooking | null> {
    const rows = await sql`
      SELECT v.*, r.name as room_name, bl.name as building_name,
             b.title as booking_title, b.start_time as booking_start, 
             b.end_time as booking_end, u.name as host_name
      FROM visitors v
      JOIN bookings b ON b.id = v.booking_id
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      WHERE v.qr_token = ${qrToken}
    `
    return (rows[0] as VisitorWithBooking) || null
  },

  async findByBooking(bookingId: string): Promise<Visitor[]> {
    const rows = await sql`
      SELECT * FROM visitors WHERE booking_id = ${bookingId} ORDER BY created_at
    `
    return rows as Visitor[]
  },

  async findByEmail(email: string): Promise<Visitor[]> {
    const rows = await sql`
      SELECT * FROM visitors WHERE email = ${email} ORDER BY created_at DESC
    `
    return rows as Visitor[]
  },

  async findPendingCheckins(): Promise<VisitorWithBooking[]> {
    const rows = await sql`
      SELECT v.*, r.name as room_name, bl.name as building_name,
             b.title as booking_title, b.start_time as booking_start, 
             b.end_time as booking_end, u.name as host_name
      FROM visitors v
      JOIN bookings b ON b.id = v.booking_id
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      WHERE v.status = 'invited'
        AND b.status = 'confirmed'
        AND b.start_time <= now() + interval '1 hour'
        AND b.end_time > now()
      ORDER BY b.start_time ASC
    `
    return rows as VisitorWithBooking[]
  },

  async create(data: {
    booking_id: string
    name: string
    email: string
    token_expires_at?: string
  }): Promise<Visitor> {
    const rows = await sql`
      INSERT INTO visitors (booking_id, name, email, token_expires_at)
      VALUES (
        ${data.booking_id}, 
        ${data.name}, 
        ${data.email}, 
        ${data.token_expires_at ?? null}::timestamptz
      )
      RETURNING *
    `
    return rows[0] as Visitor
  },

  async updateStatus(id: string, status: VisitorStatus): Promise<Visitor | null> {
    if (status === "checked_in") {
      const rows = await sql`
        UPDATE visitors SET status = ${status}, checked_in_at = now()
        WHERE id = ${id}
        RETURNING *
      `
      return (rows[0] as Visitor) || null
    }

    const rows = await sql`
      UPDATE visitors SET status = ${status}
      WHERE id = ${id}
      RETURNING *
    `
    return (rows[0] as Visitor) || null
  },

  async checkIn(qrToken: string): Promise<Visitor | null> {
    const rows = await sql`
      UPDATE visitors SET status = 'checked_in', checked_in_at = now()
      WHERE qr_token = ${qrToken} AND status = 'invited'
      RETURNING *
    `
    return (rows[0] as Visitor) || null
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM visitors WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },
}
