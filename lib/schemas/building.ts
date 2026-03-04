import { z } from "zod"

export const BuildingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().default("Zurich"),
  timezone: z.string().default("Europe/Zurich"),
  carbon_intensity_factor: z.coerce.number().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Building = z.infer<typeof BuildingSchema>

export const FloorSchema = z.object({
  id: z.string().uuid(),
  building_id: z.string().uuid(),
  name: z.string().min(1),
  floor_number: z.number().int(),
  map_svg: z.string().nullable(),
  created_at: z.coerce.date(),
})

export type Floor = z.infer<typeof FloorSchema>

export const CreateBuildingSchema = BuildingSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export type CreateBuildingInput = z.infer<typeof CreateBuildingSchema>

export const CreateFloorSchema = FloorSchema.omit({
  id: true,
  created_at: true,
})

export type CreateFloorInput = z.infer<typeof CreateFloorSchema>
