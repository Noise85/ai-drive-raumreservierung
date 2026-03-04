import { sql } from "../db"
import type { Building, Floor } from "../schemas/building"

export const buildingRepository = {
  async findById(id: string): Promise<Building | null> {
    const rows = await sql`SELECT * FROM buildings WHERE id = ${id}`
    return (rows[0] as Building) || null
  },

  async findAll(): Promise<Building[]> {
    const rows = await sql`SELECT * FROM buildings ORDER BY name`
    return rows as Building[]
  },

  async findByName(name: string): Promise<Building | null> {
    const rows = await sql`
      SELECT * FROM buildings WHERE LOWER(name) = LOWER(${name})
    `
    return (rows[0] as Building) || null
  },

  async create(data: {
    name: string
    address: string
    city?: string
    timezone?: string
    carbon_intensity_factor?: number
  }): Promise<Building> {
    const rows = await sql`
      INSERT INTO buildings (name, address, city, timezone, carbon_intensity_factor)
      VALUES (
        ${data.name},
        ${data.address},
        ${data.city ?? "Zurich"},
        ${data.timezone ?? "Europe/Zurich"},
        ${data.carbon_intensity_factor ?? 0.42}
      )
      RETURNING *
    `
    return rows[0] as Building
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      address: string
      city: string
      timezone: string
      carbon_intensity_factor: number
    }>
  ): Promise<Building | null> {
    const current = await this.findById(id)
    if (!current) return null

    const rows = await sql`
      UPDATE buildings SET
        name = ${data.name ?? current.name},
        address = ${data.address ?? current.address},
        city = ${data.city ?? current.city},
        timezone = ${data.timezone ?? current.timezone},
        carbon_intensity_factor = ${data.carbon_intensity_factor ?? current.carbon_intensity_factor},
        updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `
    return rows[0] as Building
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM buildings WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },

  async findAllWithCounts(): Promise<Array<Building & { floor_count: number; room_count: number }>> {
    const rows = await sql`
      SELECT b.*,
        (SELECT COUNT(*) FROM floors f WHERE f.building_id = b.id) as floor_count,
        (SELECT COUNT(*) FROM rooms r JOIN floors f ON f.id = r.floor_id WHERE f.building_id = b.id) as room_count
      FROM buildings b
      ORDER BY b.name
    `
    return rows as Array<Building & { floor_count: number; room_count: number }>
  },

  async findAllWithEnergy(): Promise<Array<{ name: string; carbon_intensity_factor: number; room_count: number }>> {
    const rows = await sql`
      SELECT b.name, b.carbon_intensity_factor,
             (SELECT COUNT(*) FROM rooms r JOIN floors f ON f.id = r.floor_id WHERE f.building_id = b.id) as room_count
      FROM buildings b
      ORDER BY b.name
    `
    return rows as unknown as Array<{ name: string; carbon_intensity_factor: number; room_count: number }>
  },
}

export const floorRepository = {
  async findById(id: string): Promise<Floor | null> {
    const rows = await sql`SELECT * FROM floors WHERE id = ${id}`
    return (rows[0] as Floor) || null
  },

  async findByBuilding(buildingId: string): Promise<Floor[]> {
    const rows = await sql`
      SELECT * FROM floors WHERE building_id = ${buildingId} ORDER BY floor_number
    `
    return rows as Floor[]
  },

  async findAll(): Promise<Floor[]> {
    const rows = await sql`SELECT * FROM floors ORDER BY building_id, floor_number`
    return rows as Floor[]
  },

  async create(data: {
    building_id: string
    name: string
    floor_number: number
    map_svg?: string | null
  }): Promise<Floor> {
    const rows = await sql`
      INSERT INTO floors (building_id, name, floor_number, map_svg)
      VALUES (${data.building_id}, ${data.name}, ${data.floor_number}, ${data.map_svg ?? null})
      RETURNING *
    `
    return rows[0] as Floor
  },

  async update(
    id: string,
    data: Partial<{
      name: string
      floor_number: number
      map_svg: string | null
    }>
  ): Promise<Floor | null> {
    const current = await this.findById(id)
    if (!current) return null

    const rows = await sql`
      UPDATE floors SET
        name = ${data.name ?? current.name},
        floor_number = ${data.floor_number ?? current.floor_number},
        map_svg = ${data.map_svg !== undefined ? data.map_svg : current.map_svg}
      WHERE id = ${id}
      RETURNING *
    `
    return rows[0] as Floor
  },

  async delete(id: string): Promise<boolean> {
    const rows = await sql`DELETE FROM floors WHERE id = ${id} RETURNING id`
    return rows.length > 0
  },

  async findAllWithCounts(): Promise<Array<Floor & { building_name: string; room_count: number }>> {
    const rows = await sql`
      SELECT f.*, b.name as building_name,
        (SELECT COUNT(*) FROM rooms r WHERE r.floor_id = f.id) as room_count
      FROM floors f
      JOIN buildings b ON b.id = f.building_id
      ORDER BY b.name, f.floor_number
    `
    return rows as Array<Floor & { building_name: string; room_count: number }>
  },
}
