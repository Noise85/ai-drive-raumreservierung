import { z } from "zod"

export const SensorTypeSchema = z.enum(["pir", "co2", "temperature", "humidity"])
export type SensorType = z.infer<typeof SensorTypeSchema>

export const SensorStatusSchema = z.enum(["online", "offline"])
export type SensorStatus = z.infer<typeof SensorStatusSchema>

export const SensorSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  type: z.string().default("pir"),
  status: SensorStatusSchema.default("online"),
  last_signal_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
})

export type Sensor = z.infer<typeof SensorSchema>

export const OccupancyEventSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  sensor_id: z.string().uuid().nullable(),
  status: z.enum(["occupied", "empty"]),
  recorded_at: z.coerce.date(),
})

export type OccupancyEvent = z.infer<typeof OccupancyEventSchema>

export const CreateOccupancyEventSchema = z.object({
  room_id: z.string().uuid(),
  status: z.enum(["occupied", "empty"]),
})

export type CreateOccupancyEventInput = z.infer<typeof CreateOccupancyEventSchema>
