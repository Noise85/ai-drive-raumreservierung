import { sql } from "../db"

export interface CarbonByBuilding {
  name: string
  carbon_intensity_factor: number
  bookings: number
  total_kwh: number
}

export interface CarbonByTeam {
  department: string
  bookings: number
  kg_co2e: number
}

export interface CarbonTrend {
  month: string
  kg_co2e: number
}

export const carbonRepository = {
  async getCarbonByBuilding(
    startDate: string,
    endDate: string
  ): Promise<CarbonByBuilding[]> {
    const rows = await sql`
      SELECT bl.name, bl.carbon_intensity_factor,
             COUNT(b.id)::int as bookings,
             SUM(
               r.energy_kwh_per_hour * 
               EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
             ) as total_kwh
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      WHERE b.start_time >= ${startDate}::timestamptz
        AND b.end_time <= ${endDate}::timestamptz
        AND b.status IN ('confirmed', 'completed')
      GROUP BY bl.name, bl.carbon_intensity_factor
      ORDER BY total_kwh DESC
    `
    return rows as unknown as CarbonByBuilding[]
  },

  async getCarbonByTeam(
    startDate: string,
    endDate: string
  ): Promise<CarbonByTeam[]> {
    const rows = await sql`
      SELECT COALESCE(u.department, 'Unknown') as department,
             COUNT(b.id)::int as bookings,
             SUM(
               r.energy_kwh_per_hour * bl.carbon_intensity_factor *
               EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
             ) as kg_co2e
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      JOIN users u ON u.id = b.user_id
      WHERE b.start_time >= ${startDate}::timestamptz
        AND b.end_time <= ${endDate}::timestamptz
        AND b.status IN ('confirmed', 'completed')
      GROUP BY u.department
      ORDER BY kg_co2e DESC
    `
    return rows as unknown as CarbonByTeam[]
  },

  async getCarbonTrend(
    startDate: string,
    endDate: string
  ): Promise<CarbonTrend[]> {
    const rows = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', b.start_time), 'YYYY-MM') as month,
        SUM(
          r.energy_kwh_per_hour * bl.carbon_intensity_factor *
          EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
        ) as kg_co2e
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      WHERE b.start_time >= (${startDate}::timestamptz - interval '6 months')
        AND b.end_time <= ${endDate}::timestamptz
        AND b.status IN ('confirmed', 'completed')
      GROUP BY DATE_TRUNC('month', b.start_time)
      ORDER BY month ASC
    `
    return rows as unknown as CarbonTrend[]
  },

  async getTotalCarbonForPeriod(
    startDate: string,
    endDate: string
  ): Promise<number> {
    const rows = await sql`
      SELECT COALESCE(SUM(
        r.energy_kwh_per_hour * bl.carbon_intensity_factor *
        EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0
      ), 0) as kg_co2e
      FROM bookings b
      JOIN rooms r ON r.id = b.room_id
      JOIN floors f ON f.id = r.floor_id
      JOIN buildings bl ON bl.id = f.building_id
      WHERE b.start_time >= ${startDate}::timestamptz
        AND b.end_time < ${endDate}::timestamptz
        AND b.status IN ('confirmed', 'completed')
    `
    return Number(rows[0]?.kg_co2e || 0)
  },

  async getCarbonIntensityHistory(): Promise<Array<{ factor: number; effective_from: string; building_name: string }>> {
    const rows = await sql`
      SELECT cih.factor, cih.effective_from, b.name as building_name
      FROM carbon_intensity_history cih
      JOIN buildings b ON b.id = cih.building_id
      ORDER BY b.name, cih.effective_from DESC
    `
    return rows as unknown as Array<{ factor: number; effective_from: string; building_name: string }>
  },
}
