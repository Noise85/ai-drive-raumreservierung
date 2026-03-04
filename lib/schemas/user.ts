import { z } from "zod"

export const UserRoleSchema = z.enum([
  "employee",
  "facility_manager",
  "admin",
  "finance",
  "sustainability",
])

export type UserRole = z.infer<typeof UserRoleSchema>

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: UserRoleSchema,
  department: z.string().nullable(),
  cost_center_id: z.string().uuid().nullable(),
  preferred_locale: z.string().default("en"),
  preferences: z.record(z.unknown()).default({}),
  created_at: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

export const CreateUserSchema = UserSchema.omit({
  id: true,
  created_at: true,
}).partial({
  preferences: true,
  preferred_locale: true,
})

export type CreateUserInput = z.infer<typeof CreateUserSchema>

export const UpdateUserSchema = CreateUserSchema.partial()
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
