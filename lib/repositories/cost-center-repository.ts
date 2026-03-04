import { sql } from "../db"
import type { CostCenter, CostCenterWithUsage } from "../schemas/cost-center"

export const costCenterRepository = {
  async findById(id: string): Promise<CostCenter | null> {
    const rows = await sql`SELECT * FROM cost_centers WHERE id = ${id}`
    return (rows[0] as CostCenter) || null
  },

  async findByCode(code: string): Promise<CostCenter | null> {
    const rows = await sql`SELECT * FROM cost_centers WHERE code = ${code}`
    return (rows[0] as CostCenter) || null
  },

  async findAll(): Promise<CostCenter[]> {
    const rows = await sql`SELECT * FROM cost_centers ORDER BY name`
    return rows as CostCenter[]
  },

  async findAllWithUsage(): Promise<CostCenterWithUsage[]> {
    const rows = await sql`
      SELECT cc.id, cc.name, cc.code, cc.budget_monthly, cc.created_at,
             COUNT(b.id) as booking_count,
             COALESCE(SUM(b.estimated_cost), 0) as total_cost,
             ROUND(COALESCE(SUM(b.estimated_cost), 0) / NULLIF(cc.budget_monthly, 0) * 100, 1) as budget_pct
      FROM cost_centers cc
      LEFT JOIN bookings b ON b.cost_center_id = cc.id AND b.status IN ('confirmed', 'completed')
      GROUP BY cc.id, cc.name, cc.code, cc.budget_monthly, cc.created_at
      ORDER BY total_cost DESC
    `
    return rows as CostCenterWithUsage[]
  },

  async create(data: { name: string; code: string; budget_monthly: number }): Promise<CostCenter> {
    const rows = await sql`
      INSERT INTO cost_centers (name, code, budget_monthly)
      VALUES (${data.name}, ${data.code}, ${data.budget_monthly})
      RETURNING *
    `
    return rows[0] as CostCenter
  },

  async update(
    id: string,
    data: Partial<{ name: string; code: string; budget_monthly: number }>
  ): Promise<CostCenter | null> {
    const current = await this.findById(id)
    if (!current) return null

    const rows = await sql`
      UPDATE cost_centers SET
        name = ${data.name ?? current.name},
        code = ${data.code ?? current.code},
        budget_monthly = ${data.budget_monthly ?? current.budget_monthly}
      WHERE id = ${id}
      RETURNING *
    `
    return rows[0] as CostCenter
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM cost_centers WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },
}
