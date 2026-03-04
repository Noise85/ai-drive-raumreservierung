import { z } from "zod"

export const BookingStatusSchema = z.enum([
  "confirmed",
  "cancelled",
  "auto_released",
  "completed",
])

export type BookingStatus = z.infer<typeof BookingStatusSchema>

export const BookingSchema = z.object({
  id: z.string().uuid(),
  room_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  start_time: z.coerce.date(),
  end_time: z.coerce.date(),
  status: BookingStatusSchema.default("confirmed"),
  attendee_count: z.number().int().positive().default(1),
  visitor_emails: z.array(z.string().email()).default([]),
  cost_center_id: z.string().uuid().nullable(),
  estimated_cost: z.number().nullable(),
  actual_cost: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  cancelled_at: z.coerce.date().nullable(),
})

export type Booking = z.infer<typeof BookingSchema>

export const CreateBookingSchema = z.object({
  room_id: z.string().uuid(),
  user_id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  start_time: z.string().datetime({ offset: true }).or(z.coerce.date()),
  end_time: z.string().datetime({ offset: true }).or(z.coerce.date()),
  attendee_count: z.number().int().positive().default(1),
  visitor_emails: z.array(z.string().email()).optional(),
  cost_center_id: z.string().uuid().nullable().optional(),
}).refine(
  (data) => new Date(data.end_time) > new Date(data.start_time),
  { message: "End time must be after start time", path: ["end_time"] }
)

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>

export const CancelBookingSchema = z.object({
  booking_id: z.string().uuid(),
  user_id: z.string().uuid(),
  reason: z.string().optional(),
})

export type CancelBookingInput = z.infer<typeof CancelBookingSchema>

// Extended booking with joined data
export const BookingWithDetailsSchema = BookingSchema.extend({
  room_name: z.string(),
  room_capacity: z.number(),
  building_name: z.string(),
  cost_center_name: z.string().nullable(),
  cost_center_code: z.string().nullable(),
})

export type BookingWithDetails = z.infer<typeof BookingWithDetailsSchema>
