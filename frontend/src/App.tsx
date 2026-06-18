import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BarChart2, DollarSign, PackageCheck, Receipt, TrendingUp } from 'lucide-react'
import DashboardShell from '@/components/dashboard/DashboardShell'
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid'
import KpiCard from '@/components/dashboard/ui/KpiCard'
import ChartCard from '@/components/dashboard/ui/ChartCard'
import CostEvolutionChart from '@/components/dashboard/charts/CostEvolutionChart'
import CostBreakdownPie from '@/components/dashboard/charts/CostBreakdownPie'
import ComposantsPageClient from '@/components/dashboard/composants/ComposantsPageClient'
import NomenclaturesPageClient from '@/components/dashboard/nomenclatures/NomenclaturesPageClient'
import LotsPageClient from '@/app/dashboard/lots/LotsPageClient'
import AnalysesFinancieresClient from '@/components/dashboard/analyses/AnalysesFinancieresClient'
import UtilisateursPageClient from '@/components/dashboard/utilisateurs/UtilisateursPageClient'
import ProfilPageClient from '@/components/dashboard/profil/ProfilPageClient'
import DashboardSectionPlaceholder from '@/components/dashboard/DashboardSectionPlaceholder'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { api } from '@/api'
import type { DashboardSummary, Material, Product, Production, User } from '@/types'
import type { AppRole } from '@/types/spgcr'
import type { LotStatut } from '@/types/spgcr'

function useLocationPath() {
  const [path, setPath] = useState(window.location.pathname + window.location.search)
  useEffect(() => {
    const update = () => setPath(window.location.pathname + window.location.search)
    window.addEventListener('popstate', update)
    window.addEventListener('spcr:refresh', update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener('spcr:refresh', update)
    }
  }, [])
  return path
}

function money(value: string | number) {
  return Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

function toComposants(materials: Material[]) {
  return materials.map((m) => ({
    id: String(m.id),
    code: `CMP-${String(m.id).padStart(4, '0')}`,
    nom: m.name,
    categorie: 'matiere_premiere',
    unite_mesure: m.unit,
    stock_actuel: Number(m.quantity),
    cout_unitaire_moyen_pondere: Number(m.unit_cost),
  }))
}

function toProduits(products: Product[]) {
  return products.map((p) => ({
    id: String(p.id),
    code: p.sku,
    nom: p.name,
    volume_litre: 0.75,
    unite_commerciale: p.unit || 'bouteille',
  }))
}

function toLots(productions: Production[]) {
  return productions.map((p) => ({
    id: String(p.id),
    numeroLot: p.reference,
    produitFiniId: String(p.product_id),
    produitCode: p.product?.sku || `PF-${p.product_id}`,
    produitNom: p.product?.name || `Produit ${p.product_id}`,
    volumeLitre: 0.75,
    operateurNom: 'Operateur',
    quantitePrevue: Number(p.quantity),
    dateLancement: p.created_at,
    statut: (p.status === 'terminee' ? 'termine' : p.status === 'annulee' ? 'annule' : 'en_cours') as LotStatut,
  }))
}

function toUsers(users: User[]) {
  return users.map((u) => ({
    id: String(u.id),
    nom: u.last_name,
    prenom: u.first_name,
    role: u.role as AppRole,
    actif: u.is_active,
    created_at: new Date().toISOString(),
  }))
}

function Overview({ summary, role, userId, products, materials, productions }: {
  summary: DashboardSummary | null
  role: AppRole
  userId: string
  products: Product[]
  materials: Material[]
  productions: Production[]
}) {
  const kpis = summary?.kpis
  const evolution = summary?.production_evolution?.map((p) => ({
    numeroLot: p.month,
    coutTotal: p.quantity,
    margeBrute: Math.round(p.quantity * 0.18),
  })) || []
  const breakdown = summary?.cost_breakdown || []
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tableau de bord</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Vue d'ensemble</h1>
      </div>

      <QuickActionsGrid
        role={role}
        currentUserId={userId}
        produitsFinis={toProduits(products)}
        operateurs={[{ id: userId, prenom: 'Utilisateur', nom: 'connecte' }]}
        composants={toComposants(materials).map((c) => ({ id: c.id, code: c.code, nom: c.nom, unite_mesure: c.unite_mesure }))}
        activeLot={productions.find((p) => p.status === 'en_cours') ? {
          id: String(productions.find((p) => p.status === 'en_cours')!.id),
          numeroLot: productions.find((p) => p.status === 'en_cours')!.reference,
          quantiteProduite: Number(productions.find((p) => p.status === 'en_cours')!.quantity),
        } : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Cout de revient moyen / bouteille" value={`${money(kpis?.average_unit_cost || 0)} FCFA`} icon={DollarSign} accent="indigo" />
        <KpiCard label="Marge brute totale estimee" value={`${Number(kpis?.margin_rate || 0).toFixed(1)} %`} icon={TrendingUp} accent="emerald" />
        <KpiCard label="Lots clotures" value={String(productions.filter((p) => p.status === 'terminee').length)} icon={PackageCheck} accent="amber" />
        <KpiCard label="Charges indirectes imputees" value={`${money(kpis?.total_production_cost || 0)} FCFA`} icon={Receipt} accent="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Evolution cout vs marge" subtitle="Donnees de production">
          <CostEvolutionChart data={evolution.length ? evolution : [
            { numeroLot: 'Jan', coutTotal: 9000, margeBrute: 1400 },
            { numeroLot: 'Fev', coutTotal: 10800, margeBrute: 1800 },
            { numeroLot: 'Mar', coutTotal: 9000, margeBrute: 1500 },
          ]} />
        </ChartCard>
        <ChartCard title="Repartition des couts" subtitle="Dernier lot calcule">
          <CostBreakdownPie data={breakdown.length ? breakdown : [
            { name: 'Matieres premieres', value: 45 },
            { name: "Main d'oeuvre", value: 20 },
            { name: 'Charges indirectes', value: 25 },
          ]} />
        </ChartCard>
      </div>
    </div>
  )
}

function PendingValidation({ user }: { user: User }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-amber-100 bg-white p-8 text-center shadow-xl">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Compte en attente de validation</h1>
        <p className="mt-2 text-sm text-slate-500">
          Bonjour {user.first_name}, votre compte a bien ete cree. Un administrateur doit l'activer avant l'acces au tableau de bord.
        </p>
        <button
          className="mt-6 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          onClick={() => {
            localStorage.removeItem('spcr_token')
            localStorage.removeItem('spcr_user')
            window.history.pushState({}, '', '/login')
            window.dispatchEvent(new PopStateEvent('popstate'))
          }}
        >
          Retour a la connexion
        </button>
      </div>
    </div>
  )
}

function DashboardApp({ path, user, reloadUser }: { path: string; user: User; reloadUser: () => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [users, setUsers] = useState<User[]>([])

  async function load() {
    const [nextSummary, nextMaterials, nextProducts, nextProductions] = await Promise.all([
      api.dashboard().catch(() => null),
      api.materials().catch(() => []),
      api.products().catch(() => []),
      api.productions().catch(() => []),
    ])
    setSummary(nextSummary)
    setMaterials(nextMaterials)
    setProducts(nextProducts)
    setProductions(nextProductions)
    if (user.role === 'admin_msd') {
      setUsers(await api.users().catch(() => []))
    }
  }

  useEffect(() => {
    load()
    const refresh = () => {
      load()
      reloadUser()
    }
    window.addEventListener('spcr:refresh', refresh)
    return () => window.removeEventListener('spcr:refresh', refresh)
  }, [user.id, user.role])

  const role = user.role as AppRole
  const page = path.split('?')[0]
  const content = useMemo(() => {
    if (page === '/dashboard/composants') return <ComposantsPageClient composants={toComposants(materials)} />
    if (page === '/dashboard/nomenclatures') {
      const produitsFinis = toProduits(products)
      const composants = toComposants(materials).map((c) => ({ id: c.id, code: c.code, nom: c.nom, unite_mesure: c.unite_mesure }))
      return (
        <NomenclaturesPageClient
          formules={produitsFinis.map((p) => ({
            produit_fini_id: p.id,
            produit_code: p.code,
            produit_nom: p.nom,
            volume_litre: p.volume_litre,
            unite_commerciale: p.unite_commerciale,
            lignes: composants.slice(0, 2).map((c) => ({
              id: `${p.id}-${c.id}`,
              composant_id: c.id,
              composant_nom: c.nom,
              composant_code: c.code,
              quantite_requise: 1,
              unite_mesure: c.unite_mesure,
            })),
          }))}
          produitsFinis={produitsFinis}
          composants={composants}
        />
      )
    }
    if (page === '/dashboard/lots') {
      return (
        <LotsPageClient
          role={role}
          userId={String(user.id)}
          lots={toLots(productions)}
          bomLinesByProduitFiniId={{}}
          produitsFinis={toProduits(products)}
          operateurs={[{ id: String(user.id), prenom: user.first_name, nom: user.last_name }]}
          kpis={{
            lotsActifs: String(productions.filter((p) => p.status === 'en_cours').length),
            volumeCuve: `${productions.reduce((sum, p) => sum + Number(p.quantity || 0), 0)} u.`,
            cloturesCeMois: String(productions.filter((p) => p.status === 'terminee').length),
          }}
        />
      )
    }
    if (page === '/dashboard/analyses') {
      const rows = productions.map((p) => ({
        id: String(p.id),
        lot_id: String(p.id),
        numero_lot: p.reference,
        produit_nom: p.product?.name || `Produit ${p.product_id}`,
        cout_direct_matieres: 0,
        cout_revient_total: 0,
        cout_unitaire_theorique: Number(summary?.kpis.average_unit_cost || 0),
        marge_brute_estimee: Number(summary?.kpis.margin_rate || 0),
        calcule_at: p.created_at,
        quantite_produite: Number(p.quantity),
      }))
      const coutMoyen = rows.length ? rows.reduce((acc, row) => acc + row.cout_unitaire_theorique, 0) / rows.length : 0
      return <AnalysesFinancieresClient rows={rows} stats={{ cout_moyen: coutMoyen, marge_globale: Number(summary?.kpis.margin_rate || 0) }} />
    }
    if (page === '/dashboard/utilisateurs') {
      const rows = toUsers(users)
      return <UtilisateursPageClient pending={rows.filter((u) => !u.actif)} active={rows.filter((u) => u.actif)} />
    }
    if (page === '/dashboard/profil') {
      return <ProfilPageClient profile={{
        id: String(user.id),
        nom: user.last_name,
        prenom: user.first_name,
        role,
        actif: user.is_active,
        created_at: new Date().toISOString(),
      }} email={user.email} />
    }
    if (page === '/dashboard/historique') return <DashboardSectionPlaceholder title="Historique & Logs" description="Journal des actions et audits de production." icon={BarChart2} />
    if (page === '/dashboard/succursales') return <DashboardSectionPlaceholder title="Gestion des Succursales" description="Gestion des sites, depots et points de production." icon={PackageCheck} />
    return <Overview summary={summary} role={role} userId={String(user.id)} products={products} materials={materials} productions={productions} />
  }, [page, materials, products, productions, summary, users, user])

  return (
    <DashboardShell role={role} prenom={user.first_name} nom={user.last_name} email={user.email}>
      {content}
    </DashboardShell>
  )
}

export default function App() {
  const path = useLocationPath()
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('spcr_user')
    return raw ? JSON.parse(raw) : null
  })

  async function reloadUser() {
    if (!localStorage.getItem('spcr_token')) return
    const me = await api.me().catch(() => null)
    if (me) {
      setUser(me)
      localStorage.setItem('spcr_user', JSON.stringify(me))
    }
  }

  useEffect(() => {
    reloadUser()
  }, [])

  if (path.startsWith('/login')) return <LoginPage />
  if (!path.startsWith('/dashboard')) {
    return (
      <>
        <Header user={null} profile={null} />
        <HomePage />
        <Footer />
      </>
    )
  }
  if (!user) return <LoginPage />
  if (!user.is_active) return <PendingValidation user={user} />
  return <DashboardApp path={path} user={user} reloadUser={reloadUser} />
}
