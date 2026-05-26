import { createClient } from '@/utils/supabase/server'
import type {
  ComposantOption,
  OperateurOption,
  ProduitFiniOption,
} from '@/components/dashboard/quick-actions/types'

export async function fetchQuickActionsOptions(userId: string) {
  const supabase = await createClient()

  const { data: produits } = await supabase
    .from('produits_finis')
    .select('id, code, nom, volume_litre')
    .order('nom')

  const { data: composants } = await supabase
    .from('composants')
    .select('id, code, nom, unite_mesure')
    .order('nom')

  const { data: operateurs } = await supabase
    .from('profiles')
    .select('id, prenom, nom, role, actif')
    .eq('actif', true)
    .eq('role', 'operateur_usine')
    .order('nom')

  const { data: selfProfile } = await supabase
    .from('profiles')
    .select('id, prenom, nom')
    .eq('id', userId)
    .single()

  let operateurList: OperateurOption[] = (operateurs ?? []).map((o) => ({
    id: o.id,
    prenom: o.prenom,
    nom: o.nom,
  }))

  if (operateurList.length === 0 && selfProfile) {
    operateurList = [
      {
        id: selfProfile.id,
        prenom: selfProfile.prenom,
        nom: selfProfile.nom,
      },
    ]
  }

  return {
    produitsFinis: (produits ?? []) as ProduitFiniOption[],
    composants: (composants ?? []) as ComposantOption[],
    operateurs: operateurList,
  }
}
