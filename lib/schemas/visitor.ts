import { z } from "zod"

export const VisitorStatusSchema = z.enum(["invited", "checked_in", "cancelled"])
export type VisitorStatus = z.infer<typeof VisitorStatusSchema>

export const VisitorSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  qr_token: z.string(),
  token_expires_at: z.coerce.date().nullable(),
  checked_in_at: z.coerce.date().nullable(),
  status: VisitorStatusSchema.default("invited"),
  created_at: z.coerce.date(),
})

export type Visitor = z.infer<typeof VisitorSchema>

export const CreateVisitorSchema = z.object({
  booking_id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
})

export type CreateVisitorInput = z.infer<typeof CreateVisitorSchema>

export const CheckInVisitorSchema = z.object({
  qr_token: z.string().min(1),
})

export type CheckInVisitorInput = z.infer<typeof CheckInVisitorSchema>

export const VisitorWithBookingSchema = VisitorSchema.extend({
  room_name: z.string(),
  building_name: z.string(),
  booking_title: z.string(),
  booking_start: z.coerce.date(),
  booking_end: z.coerce.date(),
  host_name: z.string(),
})

export type VisitorWithBooking = z.infer<typeof VisitorWithBookingSchema>
