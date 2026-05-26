import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin_msd', 'responsable_production', 'operateur_usine']),
})

export const activateUserSchema = z.object({
  userId: z.string().uuid(),
})
