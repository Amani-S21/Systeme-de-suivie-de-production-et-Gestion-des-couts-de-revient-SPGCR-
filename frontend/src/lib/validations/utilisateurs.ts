import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin_msd', 'responsable_production', 'operateur_usine']),
})

export const activateUserSchema = z.object({
  userId: z.string().min(1),
})
