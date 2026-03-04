import { sql } from "../db"

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

export interface ScoringWeight {
  id: string
  building_id: string
  building_name: string
  equipment_weight: number
  proximity_weight: number
  capacity_weight: number
  utilization_weight: number
}

export const analyticsRepository = {
  async getRoomUtilization(days = 30): Promise<RoomUtilization[]> {
    const rows = await sql`
      SELECT
        r.name as room_name,
        b.name as building_name,
        r.capacity,
        COUNT(bk.id) as booking_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time)) / 3600), 0) as total_hours
      FROM rooms r
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings b ON b.id = f.building_id
      LEFT JOIN bookings bk ON bk.room_id = r.id AND bk.status IN ('confirmed', 'completed')
        AND bk.start_time >= now() - (${days}::int * interval '1 day')
      WHERE r.is_active = true
      GROUP BY r.id, r.name, b.name, r.capacity
      ORDER BY total_hours DESC
    `
    return rows as unknown as RoomUtilization[]
  },

  async getBuildingStats(days = 30): Promise<BuildingStats[]> {
    const rows = await sql`
      SELECT
        b.name as building_name,
        COUNT(DISTINCT r.id) as room_count,
        COUNT(bk.id) as booking_count,
        COALESCE(SUM(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time)) / 3600), 0) as total_hours,
        COALESCE(AVG(EXTRACT(EPOCH FROM (bk.end_time - bk.start_time)) / 3600), 0) as avg_duration
      FROM buildings b
      JOIN floors f ON f.building_id = b.id
      JOIN rooms r ON r.floor_id = f.id
      LEFT JOIN bookings bk ON bk.room_id = r.id AND bk.status IN ('confirmed', 'completed')
        AND bk.start_time >= now() - (${days}::int * interval '1 day')
      GROUP BY b.id, b.name
      ORDER BY b.name
    `
    return rows as unknown as BuildingStats[]
  },

  async getScoringWeights(): Promise<ScoringWeight[]> {
    const rows = await sql`
      SELECT sw.*, b.name as building_name
      FROM scoring_weights sw
      JOIN buildings b ON b.id = sw.building_id
      ORDER BY b.name
    `
    return rows as unknown as ScoringWeight[]
  },

  async updateScoringWeight(
    buildingId: string,
    weights: {
      equipment_weight?: number
      proximity_weight?: number
      capacity_weight?: number
      utilization_weight?: number
    }
  ): Promise<ScoringWeight | null> {
    const rows = await sql`
      UPDATE scoring_weights SET
        equipment_weight = COALESCE(${weights.equipment_weight ?? null}, equipment_weight),
        proximity_weight = COALESCE(${weights.proximity_weight ?? null}, proximity_weight),
        capacity_weight = COALESCE(${weights.capacity_weight ?? null}, capacity_weight),
        utilization_weight = COALESCE(${weights.utilization_weight ?? null}, utilization_weight)
      WHERE building_id = ${buildingId}
      RETURNING *
    `
    if (rows.length === 0) return null
    
    // Get building name for response
    const result = await sql`
      SELECT sw.*, b.name as building_name
      FROM scoring_weights sw
      JOIN buildings b ON b.id = sw.building_id
      WHERE sw.id = ${rows[0].id}
    `
    return (result[0] as unknown as ScoringWeight) || null
  },
}
