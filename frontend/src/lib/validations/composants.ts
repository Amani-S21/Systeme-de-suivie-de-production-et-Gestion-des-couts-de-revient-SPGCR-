import { z } from 'zod'

export const composantIdentificationExistingSchema = z.object({
  mode: z.literal('existing'),
  composantId: z.string().min(1, 'Sélectionnez un composant valide.'),
})

export const composantIdentificationNewSchema = z.object({
  mode: z.literal('new'),
  code: z
    .string()
    .min(2, 'Le code doit contenir au moins 2 caractères.')
    .max(32, 'Le code est trop long.')
    .regex(/^[A-Z0-9_-]+$/i, 'Code alphanumérique uniquement.'),
  nom: z.string().min(2, 'Le nom est obligatoire.').max(120),
  categorie: z.enum(['matiere_premiere', 'intrant', 'emballage', 'charge_indirecte']),
  unite_mesure: z.enum(['litre', 'kg', 'unite']),
})

export const composantIdentificationSchema = z.discriminatedUnion('mode', [
  composantIdentificationExistingSchema,
  composantIdentificationNewSchema,
])

export const composantMouvementSchema = z.object({
  quantiteAchetee: z
    .number({ error: 'Saisissez un nombre valide.' })
    .positive('La quantité doit être strictement positive.'),
  prixAchatTotal: z
    .number({ error: 'Saisissez un montant valide.' })
    .positive("Le prix d'achat doit être strictement positif."),
  seuilMinimum: z
    .number({ error: 'Saisissez un seuil valide.' })
    .positive('Le seuil minimum doit être strictement supérieur à zéro.'),
  seuilConfirme: z.boolean(),
})

export const adjustStockFormSchema = z.object({
  identification: composantIdentificationSchema,
  mouvement: composantMouvementSchema,
})

export type AdjustStockFormValues = z.infer<typeof adjustStockFormSchema>
export type ComposantIdentificationValues = z.infer<typeof composantIdentificationSchema>
