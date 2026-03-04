import { z } from "zod"

export const RoomTierSchema = z.enum(["standard", "premium", "executive"])
export type RoomTier = z.infer<typeof RoomTierSchema>

export const OccupancyStatusSchema = z.enum(["occupied", "empty", "unknown", "offline"])
export type OccupancyStatus = z.infer<typeof OccupancyStatusSchema>

export const EquipmentItemSchema = z.enum([
  "projector",
  "whiteboard",
  "video_conferencing",
  "microphone",
  "recording",
  "standing_desk",
  "display",
  "phone",
])

export type EquipmentItem = z.infer<typeof EquipmentItemSchema>

export const RoomSchema = z.object({
  id: z.string().uuid(),
  floor_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  capacity: z.number().int().positive(),
  equipment: z.array(z.string()),
  image_url: z.string().url().nullable(),
  tier: RoomTierSchema.default("standard"),
  base_hourly_rate: z.coerce.number().positive(),
  energy_kwh_per_hour: z.coerce.number().positive(),
  occupancy_status: OccupancyStatusSchema.default("unknown"),
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Room = z.infer<typeof RoomSchema>

export const RoomWithLocationSchema = RoomSchema.extend({
  floor_name: z.string(),
  floor_number: z.number(),
  building_id: z.string().uuid(),
  building_name: z.string(),
  city: z.string().optional(),
})

export type RoomWithLocation = z.infer<typeof RoomWithLocationSchema>

export const RoomSearchParamsSchema = z.object({
  capacity: z.number().int().positive().optional(),
  equipment: z.array(z.string()).optional(),
  building_id: z.string().uuid().optional(),
  building_name: z.string().optional(),
  tier: RoomTierSchema.optional(),
  start_time: z.string().datetime({ offset: true }),
  end_time: z.string().datetime({ offset: true }),
})

export type RoomSearchParams = z.infer<typeof RoomSearchParamsSchema>

export const CreateRoomSchema = RoomSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  occupancy_status: true,
})

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>

export const UpdateRoomSchema = CreateRoomSchema.partial()
export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>
