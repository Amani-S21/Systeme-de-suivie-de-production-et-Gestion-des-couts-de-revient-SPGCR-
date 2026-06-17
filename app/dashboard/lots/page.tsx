import { createClient } from '@/utils/supabase/server'
import type { AppRole, LotStatut } from '@/types/spgcr'
import { fetchQuickActionsOptions } from '@/lib/dashboard/quick-actions-queries'
import LotsPageClient, {
  type BomLine,
  type LotRow,
  type LotsPageClientProps,
} from './LotsPageClient'

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export default async function LotsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // La layout dashboard gère déjà la redirection, mais on reste safe.
    return null
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profileRow?.role as AppRole

  const [{ data: lotsRaw }, quickActionsOptions] = await Promise.all([
    supabase
      .from('lots_production')
      .select(`
        id,
        numero_lot,
        quantite_produite,
        statut,
        date_production,
        produit_fini_id,
        produits_finis ( id, code, nom, volume_litre ),
        profiles:operateur_id ( id, prenom, nom )
      `)
      .order('date_production', { ascending: false }),
    fetchQuickActionsOptions(user.id),
  ])

  const lots = (lotsRaw ?? []).map((lot) => {
    const pf = unwrapRelation(
      lot.produits_finis as {
        id: string
        code: string
        nom: string
        volume_litre: number | null
      } | { id: string; code: string; nom: string; volume_litre: number | null }[]
    )

    const opRaw = lot.profiles as
      | { id: string; prenom: string; nom: string }
      | { id: string; prenom: string; nom: string }[]
      | null
    const op = Array.isArray(opRaw) ? opRaw[0] ?? null : opRaw

    const statut = (lot.statut as LotStatut) ?? 'en_cours'

    return {
      id: lot.id,
      numeroLot: lot.numero_lot,
      produitFiniId: lot.produit_fini_id,
      produitCode: pf?.code ?? '',
      produitNom: pf?.nom ?? '—',
      volumeLitre: pf?.volume_litre ?? null,
      operateurNom: op ? `${op.prenom} ${op.nom}` : 'Non assigné',
      quantitePrevue: Number(lot.quantite_produite),
      dateLancement: lot.date_production,
      statut,
    } satisfies LotRow
  })

  const pfIds = Array.from(new Set(lots.map((l) => l.produitFiniId)))

  let bomLinesByProduitFiniId: Record<string, BomLine[]> = {}

  if (pfIds.length > 0) {
    const { data: bomRows } = await supabase
      .from('nomenclatures_bom')
      .select(`
        produit_fini_id,
        quantite_requise,
        composants ( id, code, nom, unite_mesure )
      `)
      .in('produit_fini_id', pfIds)

    bomLinesByProduitFiniId = (bomRows ?? []).reduce(
      (acc, row) => {
        const comp = unwrapRelation(
          row.composants as
            | { id: string; code: string; nom: string; unite_mesure: string }
            | { id: string; code: string; nom: string; unite_mesure: string }[]
            | null
        )

        if (!comp) return acc

        const produitId = row.produit_fini_id as string

        acc[produitId] = acc[produitId] ?? []
        acc[produitId].push({
          composantId: comp.id,
          composantCode: comp.code,
          composantNom: comp.nom,
          uniteMesure: comp.unite_mesure,
          quantiteRequiseParLitre: Number(row.quantite_requise),
        } satisfies BomLine)
        return acc
      },
      {} as Record<string, BomLine[]>
    )
  }

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const lotsActifs = lots.filter((l) => l.statut === 'en_cours')

  const lotsTerminesCeMois = lots.filter(
    (l) =>
      l.statut === 'termine' && new Date(l.dateLancement) >= monthStart
  )

  const totalBottlesInCuve = lotsActifs.reduce(
    (s, l) => s + l.quantitePrevue,
    0
  )
  const totalLitresInCuve = lotsActifs.reduce((s, l) => {
    const vol = l.volumeLitre
    return s + l.quantitePrevue * (vol ?? 0.75)
  }, 0)

  const hasVolumeInfo = lotsActifs.some((l) => l.volumeLitre != null)
  const volumeCuveValue = hasVolumeInfo
    ? `${totalLitresInCuve.toFixed(2)} L`
    : `${totalBottlesInCuve} btl.`

  const props: LotsPageClientProps = {
    role,
    userId: user.id,
    lots,
    bomLinesByProduitFiniId,
    produitsFinis: quickActionsOptions.produitsFinis,
    operateurs: quickActionsOptions.operateurs,
    kpis: {
      lotsActifs: String(lotsActifs.length),
      volumeCuve: volumeCuveValue,
      cloturesCeMois: String(lotsTerminesCeMois.length),
    },
  }

  return <LotsPageClient {...props} />
}
