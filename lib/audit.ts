'use server'

import { createClient } from '@/utils/supabase/server'

export type ActionType =
  | 'CONNEXION'
  | 'DECONNEXION'
  | 'CREATION_LOT'
  | 'CLOTURE_LOT'
  | 'AJUSTEMENT_STOCK'
  | 'CREATION_COMPOSANT'
  | 'CREATION_FORMULE'
  | 'ACTIVATION_COMPTE'
  | 'DESACTIVATION_COMPTE'
  | 'CHANGEMENT_ROLE'
  | 'SUPPRESSION_UTILISATEUR'
  | 'AUTRE'

/**
 * Enregistre un événement dans la table logs_activites.
 * Ne fait jamais planter la flow principale — les erreurs sont swallowées.
 */
export async function logActivite(
  profilId: string,
  actionType: ActionType,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('logs_activites').insert({
      profil_id: profilId,
      action_type: actionType,
      description,
      metadata: metadata ?? null,
    })
  } catch {
    // Swallow — l'audit ne doit jamais bloquer la logique métier
  }
}
