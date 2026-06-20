import { z } from 'zod'

export const bomLineSchema = z.object({
  composant_id: z.string().min(1, 'Composant invalide.'),
  quantite_requise: z
    .number({ error: 'Quantité invalide.' })
    .positive('La quantité doit être strictement positive.'),
})

/** Étape 1 — fiche nouveau produit (catalogue théorique) */
export const formuleCatalogueNewSchema = z.object({
  mode: z.literal('new'),
  nom: z.string().min(2, 'Le nom du produit est requis.').max(120),
  code: z
    .string()
    .min(2, 'Le code SKU est requis.')
    .max(32)
    .regex(/^[A-Z0-9_-]+$/i, 'SKU alphanumérique uniquement.'),
  unite_commerciale: z.enum(['bouteille', 'carton'], {
    error: 'Choisissez une unité (bouteille ou carton).',
  }),
})

/** Étape 1 — rattachement à un produit déjà présent au catalogue */
export const formuleCatalogueExistingSchema = z.object({
  mode: z.literal('existing'),
  produit_fini_id: z.string().min(1, 'Sélectionnez un produit du catalogue.'),
})

export const formuleCatalogueEtape1Schema = z.discriminatedUnion('mode', [
  formuleCatalogueNewSchema,
  formuleCatalogueExistingSchema,
])

export type FormuleCatalogueEtape1 = z.infer<typeof formuleCatalogueEtape1Schema>

/** Payload création / mise à jour produit après étape 1 (nouveau flux) */
export const persistCataloguePayloadSchema = z.discriminatedUnion('mode', [
  formuleCatalogueExistingSchema,
  formuleCatalogueNewSchema.extend({
    draft_produit_fini_id: z.string().min(1).optional(),
  }),
])

export type PersistCataloguePayload = z.infer<typeof persistCataloguePayloadSchema>

export const formuleLignesSchema = z.object({
  lignes: z.array(bomLineSchema).min(1, 'Ajoutez au moins une ligne de composant.'),
})

export const formuleValidationSchema = z.object({
  signatureConfirmee: z.boolean().refine((v) => v === true, {
    message: 'Vous devez valider la formule technique.',
  }),
})

/** Soumission finale : uniquement BOM + validation (produit déjà défini à l’étape 1) */
export const soumissionBomSeuleSchema = z.object({
  produit_fini_id: z.string().min(1, 'Identifiant produit invalide.'),
  lignes: formuleLignesSchema.shape.lignes,
  validation: formuleValidationSchema,
})

export type SoumissionBomSeuleValues = z.infer<typeof soumissionBomSeuleSchema>

/** @deprecated Ancien flux monolithique — conservé pour typage résiduel si besoin */
export const nouvelleFormuleSchema = z.object({
  general: formuleCatalogueEtape1Schema,
  lignes: formuleLignesSchema,
  validation: formuleValidationSchema,
})

export type BomLineValues = z.infer<typeof bomLineSchema>
