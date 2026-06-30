import { z } from 'zod'

export const nouveauComposantStep1Schema = z.object({
  code: z
    .string()
    .min(2, 'Le code doit contenir au moins 2 caractères.')
    .max(32, 'Le code est trop long.')
    .regex(/^[A-Z0-9_-]+$/i, 'Code alphanumérique uniquement.'),
  nom: z.string().min(2, 'Le nom est obligatoire.').max(120),
  categorie: z.enum(['matiere_premiere', 'intrant', 'emballage', 'charge_indirecte']),
  unite_mesure: z.enum(['litre', 'kg', 'unite']),
})

export const nouveauComposantStep2Schema = z.object({
  stock_actuel: z
    .number({ error: 'Saisissez un nombre valide.' })
    .min(0, 'Le stock ne peut pas être négatif.'),
  cout_unitaire_moyen_pondere: z
    .number({ error: 'Saisissez un montant valide.' })
    .min(0, 'Le CUMP ne peut pas être négatif.'),
  seuil_minimum: z
    .number({ error: 'Saisissez un seuil valide.' })
    .positive('Le seuil minimum doit être strictement supérieur à zéro.'),
})

export const nouveauComposantSchema = nouveauComposantStep1Schema.merge(
  nouveauComposantStep2Schema
)

export const nouvelleBomStep1Schema = z.object({
  produit_fini_id: z.string().min(1, 'Sélectionnez un produit fini valide.'),
})

export const nouvelleBomStep2Schema = z.object({
  composant_id: z.string().min(1, 'Sélectionnez un composant valide.'),
  quantite_requise: z
    .number({ error: 'Saisissez une quantité valide.' })
    .positive('La quantité requise doit être strictement positive.'),
})

export const nouvelleBomSchema = nouvelleBomStep1Schema.merge(nouvelleBomStep2Schema)

export const nouveauLotStep1Schema = z.object({
  produitFiniId: z.string().min(1, 'Sélectionnez un produit fini valide.'),
  quantite: z
    .number({ error: 'Saisissez une quantité valide.' })
    .int('La quantité doit être un nombre entier.')
    .min(1, 'La quantité doit être d\'au moins 1 bouteille.'),
})

export const nouveauLotStep2Schema = z.object({
  numeroLot: z.string().min(3, 'Le numéro de lot est obligatoire.'),
  operateurId: z.string().min(1, 'Assignez un opérateur valide.'),
})

export const clotureLotCostsSchema = z.object({
  cout_main_oeuvre: z
    .number({ error: 'Saisissez un montant valide.' })
    .positive('Le coût main-d\'œuvre doit être strictement positif.'),
  charges_indirectes: z
    .number({ error: 'Saisissez un montant valide.' })
    .min(0, 'Les charges indirectes ne peuvent pas être négatives.'),
})
