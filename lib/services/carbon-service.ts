import { carbonRepository } from "../repositories/carbon-repository"

export interface CarbonData {
  totalKgCO2e: number
  byBuilding: Array<{ name: string; kgCO2e: number; bookings: number }>
  byTeam: Array<{ department: string; kgCO2e: number; bookings: number }>
  trend: Array<{ month: string; kgCO2e: number }>
  previousPeriodTotal: number
  reductionPct: number
}

export const carbonService = {
  /**
   * Calculate carbon emissions for a time period
   */
  async calculateCarbon(startDate: string, endDate: string): Promise<CarbonData> {
    // Calculate carbon by building
    const byBuildingRaw = await carbonRepository.getCarbonByBuilding(startDate, endDate)

    const byBuilding = byBuildingRaw.map((row) => ({
      name: row.name,
      kgCO2e: Number(row.total_kwh || 0) * Number(row.carbon_intensity_factor || 0.42),
      bookings: Number(row.bookings || 0),
    }))

    // Calculate carbon by team/department
    const byTeamRaw = await carbonRepository.getCarbonByTeam(startDate, endDate)

    const byTeam = byTeamRaw.map((row) => ({
      department: row.department,
      kgCO2e: Number(row.kg_co2e || 0),
      bookings: Number(row.bookings || 0),
    }))

    // Monthly trend (last 6 months)
    const trendRaw = await carbonRepository.getCarbonTrend(startDate, endDate)

    const trend = trendRaw.map((row) => ({
      month: row.month,
      kgCO2e: Number(row.kg_co2e || 0),
    }))

    // Previous period for comparison
    const periodDays = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    const prevStart = new Date(
      new Date(startDate).getTime() - periodDays * 24 * 60 * 60 * 1000
    ).toISOString()

    const previousPeriodTotal = await carbonRepository.getTotalCarbonForPeriod(prevStart, startDate)
    const totalKgCO2e = byBuilding.reduce((sum, b) => sum + b.kgCO2e, 0)
    const reductionPct =
      previousPeriodTotal > 0
        ? Math.round(((previousPeriodTotal - totalKgCO2e) / previousPeriodTotal) * 100)
        : 0

    return {
      totalKgCO2e,
      byBuilding,
      byTeam,
      trend,
      previousPeriodTotal,
      reductionPct,
    }
  },
}
