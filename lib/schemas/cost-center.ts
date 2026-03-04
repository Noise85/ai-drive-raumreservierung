import { z } from "zod"

export const CostCenterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  budget_monthly: z.coerce.number().positive(),
  created_at: z.coerce.date(),
})

export type CostCenter = z.infer<typeof CostCenterSchema>

export const CostCenterWithUsageSchema = CostCenterSchema.extend({
  booking_count: z.coerce.number(),
  total_cost: z.coerce.number(),
  budget_pct: z.coerce.number().nullable(),
})

export type CostCenterWithUsage = z.infer<typeof CostCenterWithUsageSchema>

export const CreateCostCenterSchema = CostCenterSchema.omit({
  id: true,
  created_at: true,
})

export type CreateCostCenterInput = z.infer<typeof CreateCostCenterSchema>
