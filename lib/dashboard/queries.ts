import { createClient } from '@/utils/supabase/server'
import { STOCK_CRITICAL_THRESHOLD, MAIN_MATERIAL_PATTERNS } from './constants'
import {
  getDefaultBreakdownData,
  getDefaultEvolutionData,
  getDefaultStockData,
  getDefaultVolumeData,
} from './chartDefaults'
import type { ComposantStock } from '@/types/spgcr'

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

// ─── ADMIN ───────────────────────────────────────────────────────────────────

export async function fetchAdminDashboardData() {
  const supabase = await createClient()

  const { data: couts } = await supabase
    .from('couts_revient')
    .select(`
      *,
      lots_production (
        id, numero_lot, quantite_produite, statut, date_production
      )
    `)
    .order('calcule_at', { ascending: false })

  const allCouts = couts ?? []
  const terminatedLots = allCouts.filter((c) => {
    const lot = unwrapRelation(c.lots_production)
    return lot?.statut === 'termine'
  })

  const avgUnitCost =
    terminatedLots.length > 0
      ? terminatedLots.reduce((s, c) => s + Number(c.cout_unitaire_theorique), 0) /
        terminatedLots.length
      : 0

  const totalMarge = terminatedLots.reduce(
    (s, c) => s + Number(c.marge_brute_estimee ?? 0),
    0
  )

  const totalChargesIndirectes = terminatedLots.reduce(
    (s, c) => s + Number(c.charges_indirectes),
    0
  )

  const { count: lotsClotures } = await supabase
    .from('lots_production')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'termine')

  const chartLots = terminatedLots.slice(0, 6).reverse()
  const evolutionData = chartLots.map((c) => {
    const lot = unwrapRelation(c.lots_production)
    return {
      numeroLot: lot?.numero_lot ?? '—',
      coutTotal: Number(c.cout_revient_total),
      margeBrute: Number(c.marge_brute_estimee ?? 0),
    }
  })

  const latestCost = terminatedLots[0] ?? null
  const breakdownData = latestCost
    ? [
        { name: 'Matières premières', value: Number(latestCost.cout_direct_matieres) },
        { name: "Main d'œuvre", value: Number(latestCost.cout_direct_main_oeuvre) },
        { name: 'Charges indirectes', value: Number(latestCost.charges_indirectes) },
      ]
    : getDefaultBreakdownData()

  const latestLotLabel = latestCost
    ? unwrapRelation(latestCost.lots_production)?.numero_lot ?? null
    : null

  const recentLots = allCouts.slice(0, 5).map((c) => {
    const lot = unwrapRelation(c.lots_production)
    return {
      id: lot?.id ?? c.lot_id,
      numeroLot: lot?.numero_lot ?? '—',
      quantite: lot?.quantite_produite ?? 0,
      statut: (lot?.statut ?? 'termine') as 'en_cours' | 'termine' | 'annule',
      coutUnitaire: Number(c.cout_unitaire_theorique),
      calculeAt: c.calcule_at,
    }
  })

  return {
    kpis: {
      avgUnitCost,
      totalMarge,
      lotsClotures: lotsClotures ?? 0,
      totalChargesIndirectes,
    },
    evolutionData: evolutionData.length > 0 ? evolutionData : getDefaultEvolutionData(),
    breakdownData,
    latestLotLabel,
    recentLots,
  }
}

// ─── RESPONSABLE ─────────────────────────────────────────────────────────────

export async function fetchResponsableDashboardData() {
  const supabase = await createClient()

  const { data: composants } = await supabase
    .from('composants')
    .select('id, code, nom, stock_actuel, unite_mesure')
    .order('nom')

  const allComposants = (composants ?? []) as ComposantStock[]
  const criticalStock = allComposants.filter(
    (c) => Number(c.stock_actuel) < STOCK_CRITICAL_THRESHOLD
  )

  const { count: lotsEnCours } = await supabase
    .from('lots_production')
    .select('*', { count: 'exact', head: true })
    .eq('statut', 'en_cours')

  const { data: allLots } = await supabase
    .from('lots_production')
    .select('quantite_produite, statut')
    .neq('statut', 'annule')

  const lots = allLots ?? []
  const produced = lots
    .filter((l) => l.statut === 'termine')
    .reduce((s, l) => s + l.quantite_produite, 0)
  const total = lots.reduce((s, l) => s + l.quantite_produite, 0)
  const rendement = total > 0 ? Math.round((produced / total) * 100) : 0

  const { data: lotsWithProduct } = await supabase
    .from('lots_production')
    .select(`
      id, numero_lot, quantite_produite, statut, date_production,
      produits_finis ( nom, volume_litre )
    `)
    .eq('statut', 'termine')
    .order('date_production', { ascending: true })

  const volumeByMonth = new Map<string, number>()
  for (const lot of lotsWithProduct ?? []) {
    const pf = unwrapRelation(lot.produits_finis as { volume_litre: number } | { volume_litre: number }[] | null)
    const volume = lot.quantite_produite * Number(pf?.volume_litre ?? 0.75)
    const date = new Date(lot.date_production)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    volumeByMonth.set(key, (volumeByMonth.get(key) ?? 0) + volume)
  }

  const volumeData = Array.from(volumeByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, litres]) => {
      const [y, m] = month.split('-')
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('fr-FR', {
        month: 'short',
        year: '2-digit',
      })
      return { month: label, litres: Math.round(litres * 100) / 100 }
    })

  const mainMaterials = allComposants.filter((c) =>
    MAIN_MATERIAL_PATTERNS.some((p) => c.nom.toLowerCase().includes(p))
  )
  const stockFromDb =
    mainMaterials.length > 0
      ? mainMaterials.map((c) => ({
          name: c.nom.length > 18 ? `${c.nom.slice(0, 16)}…` : c.nom,
          stock: Number(c.stock_actuel),
          unite: c.unite_mesure,
        }))
      : allComposants.slice(0, 6).map((c) => ({
          name: c.nom.length > 18 ? `${c.nom.slice(0, 16)}…` : c.nom,
          stock: Number(c.stock_actuel),
          unite: c.unite_mesure,
        }))

  const stockData = stockFromDb.length > 0 ? stockFromDb : getDefaultStockData()

  const { data: activeLots } = await supabase
    .from('lots_production')
    .select(`
      id, numero_lot, quantite_produite, statut, date_production, operateur_id,
      produits_finis ( nom ),
      profiles:operateur_id ( prenom, nom )
    `)
    .eq('statut', 'en_cours')
    .order('date_production', { ascending: false })

  const activeLotsRows = (activeLots ?? []).map((lot) => {
    const op = unwrapRelation(
      lot.profiles as { prenom: string; nom: string } | { prenom: string; nom: string }[] | null
    )
    const pf = unwrapRelation(
      lot.produits_finis as { nom: string } | { nom: string }[] | null
    )
    const daysSince = Math.floor(
      (Date.now() - new Date(lot.date_production).getTime()) / (1000 * 60 * 60 * 24)
    )
    const progress = Math.min(95, Math.max(15, daysSince * 12 + 20))
    return {
      id: lot.id,
      numeroLot: lot.numero_lot,
      produit: pf?.nom ?? '—',
      quantite: lot.quantite_produite,
      operateur: op ? `${op.prenom} ${op.nom}` : 'Non assigné',
      progress,
      dateProduction: lot.date_production,
    }
  })

  return {
    kpis: {
      criticalStockCount: criticalStock.length,
      lotsEnCours: lotsEnCours ?? 0,
      rendement,
    },
    volumeData: volumeData.length > 0 ? volumeData : getDefaultVolumeData(),
    stockData,
    activeLotsRows,
    criticalStock,
  }
}

// ─── OPÉRATEUR ───────────────────────────────────────────────────────────────

export async function fetchOperateurDashboardData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: myLots } = await supabase
    .from('lots_production')
    .select(`
      id, numero_lot, quantite_produite, statut, date_production,
      produits_finis ( nom )
    `)
    .eq('operateur_id', userId)
    .order('date_production', { ascending: false })

  const lots = myLots ?? []
  const lotsThisMonth = lots.filter((l) => l.date_production >= monthStart)
  const lotsEnCours = lots.filter((l) => l.statut === 'en_cours')
  const totalBouteilles = lots.reduce((s, l) => s + l.quantite_produite, 0)

  const activeLot = lotsEnCours[0] ?? null

  const history = lots.map((lot) => {
    const pf = unwrapRelation(
      lot.produits_finis as { nom: string } | { nom: string }[] | null
    )
    return {
      id: lot.id,
      numeroLot: lot.numero_lot,
      produit: pf?.nom ?? '—',
      quantite: lot.quantite_produite,
      statut: lot.statut as 'en_cours' | 'termine' | 'annule',
      dateProduction: lot.date_production,
    }
  })

  return {
    kpis: {
      lotsThisMonth: lotsThisMonth.length,
      lotsEnCours: lotsEnCours.length,
      totalBouteilles,
    },
    activeLot: activeLot
      ? {
          id: activeLot.id,
          numeroLot: activeLot.numero_lot,
          quantiteProduite: activeLot.quantite_produite,
        }
      : null,
    history,
  }
}

export async function fetchDashboardProfile(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, nom, prenom, role, actif')
    .eq('id', userId)
    .single()
  return profile
}
