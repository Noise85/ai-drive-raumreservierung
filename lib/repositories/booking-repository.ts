import { sql } from "../db"
import type { Booking, BookingWithDetails, BookingStatus } from "../schemas/booking"

export const bookingRepository = {
  async findById(id: string): Promise<Booking | null> {
    const rows = await sql`SELECT * FROM bookings WHERE id = ${id}`
    return (rows[0] as Booking) || null
  },

  async findByIdWithDetails(id: string): Promise<BookingWithDetails | null> {
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.id = ${id}
    `
    return (rows[0] as BookingWithDetails) || null
  },

  async findByUser(userId: string): Promise<BookingWithDetails[]> {
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.user_id = ${userId}
      ORDER BY b.start_time DESC
    `
    return rows as BookingWithDetails[]
  },

  async findByRoom(roomId: string, options?: { status?: BookingStatus }): Promise<Booking[]> {
    if (options?.status) {
      const rows = await sql`
        SELECT * FROM bookings 
        WHERE room_id = ${roomId} AND status = ${options.status}
        ORDER BY start_time DESC
      `
      return rows as Booking[]
    }
    const rows = await sql`
      SELECT * FROM bookings WHERE room_id = ${roomId} ORDER BY start_time DESC
    `
    return rows as Booking[]
  },

  async findConflicts(
    roomId: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): Promise<Booking[]> {
    if (excludeBookingId) {
      const rows = await sql`
        SELECT * FROM bookings 
        WHERE room_id = ${roomId}
          AND status = 'confirmed'
          AND id != ${excludeBookingId}
          AND start_time < ${endTime}::timestamptz
          AND end_time > ${startTime}::timestamptz
      `
      return rows as Booking[]
    }
    const rows = await sql`
      SELECT * FROM bookings 
      WHERE room_id = ${roomId}
        AND status = 'confirmed'
        AND start_time < ${endTime}::timestamptz
        AND end_time > ${startTime}::timestamptz
    `
    return rows as Booking[]
  },

  async findGhostBookings(): Promise<Array<{ booking_id: string; room_id: string; user_id: string }>> {
    const rows = await sql`
      SELECT b.id as booking_id, b.room_id, b.user_id
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.status = 'confirmed'
        AND r.occupancy_status = 'empty'
        AND b.start_time < now()
        AND b.end_time > now()
    `
    return rows as Array<{ booking_id: string; room_id: string; user_id: string }>
  },

  async findByDateRange(
    startDate: string,
    endDate: string,
    options?: { costCenterId?: string; status?: BookingStatus[] }
  ): Promise<BookingWithDetails[]> {
    const statusList = options?.status || ["confirmed", "completed"]

    if (options?.costCenterId) {
      const rows = await sql`
        SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.tier,
               u.name as user_name, u.department,
               cc.name as cost_center_name, cc.code as cost_center_code,
               bl.name as building_name
        FROM bookings b
        JOIN rooms r ON r.id = b.room_id
        JOIN floors f ON f.id = r.floor_id
        JOIN buildings bl ON bl.id = f.building_id
        JOIN users u ON u.id = b.user_id
        LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
        WHERE b.start_time >= ${startDate}::timestamptz
          AND b.end_time <= ${endDate}::timestamptz
          AND b.status = ANY(${statusList}::text[])
          AND b.cost_center_id = ${options.costCenterId}
        ORDER BY b.start_time DESC
      `
      return rows as BookingWithDetails[]
    }

    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity, r.tier,
             u.name as user_name, u.department,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.start_time >= ${startDate}::timestamptz
        AND b.end_time <= ${endDate}::timestamptz
        AND b.status = ANY(${statusList}::text[])
      ORDER BY b.start_time DESC
    `
    return rows as BookingWithDetails[]
  },

  async create(data: {
    room_id: string
    user_id: string
    title: string
    start_time: string
    end_time: string
    attendee_count?: number
    cost_center_id?: string | null
    estimated_cost?: number
  }): Promise<Booking> {
    const rows = await sql`
      INSERT INTO bookings (
        room_id, user_id, title, start_time, end_time, 
        attendee_count, cost_center_id, estimated_cost, status
      )
      VALUES (
        ${data.room_id}, 
        ${data.user_id}, 
        ${data.title}, 
        ${data.start_time}::timestamptz, 
        ${data.end_time}::timestamptz, 
        ${data.attendee_count ?? 1}, 
        ${data.cost_center_id ?? null}, 
        ${data.estimated_cost ?? null}, 
        'confirmed'
      )
      RETURNING *
    `
    return rows[0] as Booking
  },

  async updateStatus(id: string, status: BookingStatus): Promise<Booking | null> {
    const updateFields =
      status === "cancelled"
        ? await sql`
            UPDATE bookings 
            SET status = ${status}, cancelled_at = now(), updated_at = now()
            WHERE id = ${id}
            RETURNING *
          `
        : await sql`
            UPDATE bookings 
            SET status = ${status}, updated_at = now()
            WHERE id = ${id}
            RETURNING *
          `
    return (updateFields[0] as Booking) || null
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM bookings WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },

  async findTodayByUser(userId: string): Promise<BookingWithDetails[]> {
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.user_id = ${userId}
        AND b.status = 'confirmed'
        AND DATE(b.start_time) = CURRENT_DATE
      ORDER BY b.start_time
    `
    return rows as BookingWithDetails[]
  },

  async findUpcomingByUser(userId: string, limit = 5): Promise<BookingWithDetails[]> {
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.user_id = ${userId}
        AND b.status = 'confirmed'
        AND b.start_time > now()
      ORDER BY b.start_time
      LIMIT ${limit}
    `
    return rows as BookingWithDetails[]
  },

  async findUpcomingByRoom(roomId: string, limit = 10): Promise<Array<Booking & { booked_by: string }>> {
    const rows = await sql`
      SELECT b.*, u.name as booked_by
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      WHERE b.room_id = ${roomId}
        AND b.status = 'confirmed'
        AND b.start_time > now()
      ORDER BY b.start_time
      LIMIT ${limit}
    `
    return rows as Array<Booking & { booked_by: string }>
  },

  async getGhostBookingsCount(): Promise<number> {
    const rows = await sql`
      SELECT COUNT(*) as count
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      WHERE b.status = 'confirmed'
        AND r.occupancy_status = 'empty'
        AND b.start_time < now()
        AND b.end_time > now()
    `
    return Number(rows[0]?.count || 0)
  },

  async findByRoomAndDateRange(
    roomId: string,
    startDate: string,
    endDate: string,
    status: BookingStatus[] = ["confirmed"]
  ): Promise<BookingWithDetails[]> {
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             u.name as user_name,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.room_id = ${roomId}
        AND b.start_time >= ${startDate}::timestamptz
        AND b.start_time <= ${endDate}::timestamptz
        AND b.status = ANY(${status}::text[])
      ORDER BY b.start_time
    `
    return rows as BookingWithDetails[]
  },

  async findByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    status?: BookingStatus[]
  ): Promise<BookingWithDetails[]> {
    const statusList = status || ["confirmed", "completed", "cancelled", "auto_released"]
    const rows = await sql`
      SELECT b.*, r.name as room_name, r.capacity as room_capacity,
             u.name as user_name,
             cc.name as cost_center_name, cc.code as cost_center_code,
             bl.name as building_name
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      LEFT JOIN cost_centers cc ON cc.id = b.cost_center_id
      WHERE b.user_id = ${userId}
        AND b.start_time >= ${startDate}::timestamptz
        AND b.start_time <= ${endDate}::timestamptz
        AND b.status = ANY(${statusList}::text[])
      ORDER BY b.start_time
    `
    return rows as BookingWithDetails[]
  },
}
