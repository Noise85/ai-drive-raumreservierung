import { sql } from "../db"
import type { User } from "../schemas/user"

export const userRepository = {
  async findById(id: string): Promise<User | null> {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`
    return (rows[0] as User) || null
  },

  async findByEmail(email: string): Promise<User | null> {
    const rows = await sql`SELECT * FROM users WHERE email = ${email}`
    return (rows[0] as User) || null
  },

  async findAll(): Promise<User[]> {
    const rows = await sql`SELECT * FROM users ORDER BY name`
    return rows as User[]
  },

  async findByRole(role: string): Promise<User[]> {
    const rows = await sql`SELECT * FROM users WHERE role = ${role} ORDER BY name`
    return rows as User[]
  },

  async findByCostCenter(costCenterId: string): Promise<User[]> {
    const rows = await sql`
      SELECT * FROM users WHERE cost_center_id = ${costCenterId} ORDER BY name
    `
    return rows as User[]
  },

  async create(data: {
    email: string
    name: string
    role: string
    department?: string | null
    cost_center_id?: string | null
    preferred_locale?: string
  }): Promise<User> {
    const rows = await sql`
      INSERT INTO users (email, name, role, department, cost_center_id, preferred_locale)
      VALUES (
        ${data.email}, 
        ${data.name}, 
        ${data.role}, 
        ${data.department ?? null}, 
        ${data.cost_center_id ?? null},
        ${data.preferred_locale ?? "en"}
      )
      RETURNING *
    `
    return rows[0] as User
  },

  async update(
    id: string,
    data: Partial<{
      email: string
      name: string
      role: string
      department: string | null
      cost_center_id: string | null
      preferred_locale: string
    }>
  ): Promise<User | null> {
    const fields: string[] = []
    const values: unknown[] = []

    if (data.email !== undefined) {
      fields.push("email")
      values.push(data.email)
    }
    if (data.name !== undefined) {
      fields.push("name")
      values.push(data.name)
    }
    if (data.role !== undefined) {
      fields.push("role")
      values.push(data.role)
    }
    if (data.department !== undefined) {
      fields.push("department")
      values.push(data.department)
    }
    if (data.cost_center_id !== undefined) {
      fields.push("cost_center_id")
      values.push(data.cost_center_id)
    }
    if (data.preferred_locale !== undefined) {
      fields.push("preferred_locale")
      values.push(data.preferred_locale)
    }

    if (fields.length === 0) return this.findById(id)

    // For simplicity, we do a full update. In production, consider a query builder.
    const current = await this.findById(id)
    if (!current) return null

    const rows = await sql`
      UPDATE users SET
        email = ${data.email ?? current.email},
        name = ${data.name ?? current.name},
        role = ${data.role ?? current.role},
        department = ${data.department !== undefined ? data.department : current.department},
        cost_center_id = ${data.cost_center_id !== undefined ? data.cost_center_id : current.cost_center_id},
        preferred_locale = ${data.preferred_locale ?? current.preferred_locale}
      WHERE id = ${id}
      RETURNING *
    `
    return rows[0] as User
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM users WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },
}
