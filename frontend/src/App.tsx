import { useEffect, useMemo, useState } from 'react'
import type * as React from 'react'
import {
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  Factory,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { api, login } from './api'
import type { DashboardSummary, Material, Product, Production, User, UserRole } from './types'

type Page = 'dashboard' | 'production' | 'materials' | 'charges' | 'costs' | 'products' | 'reports' | 'users' | 'settings'

const navItems: { page: Page; label: string; icon: React.ElementType; roles: UserRole[] | 'all' }[] = [
  { page: 'dashboard', label: 'Tableau de bord', icon: Home, roles: 'all' },
  { page: 'production', label: 'Production', icon: Factory, roles: 'all' },
  { page: 'materials', label: 'Matieres premieres', icon: Boxes, roles: ['admin', 'responsable'] },
  { page: 'charges', label: 'Charges', icon: ClipboardList, roles: ['admin', 'responsable'] },
  { page: 'costs', label: 'Calcul des couts', icon: WalletCards, roles: ['admin', 'responsable'] },
  { page: 'products', label: 'Produits', icon: Package, roles: ['admin', 'responsable'] },
  { page: 'reports', label: 'Rapports', icon: BarChart3, roles: ['admin', 'responsable'] },
  { page: 'users', label: 'Utilisateurs', icon: Users, roles: ['admin'] },
  { page: 'settings', label: 'Parametres', icon: Settings, roles: ['admin'] },
]

function canSee(role: UserRole, roles: UserRole[] | 'all') {
  return roles === 'all' || roles.includes(role)
}

function formatNumber(value: string | number) {
  return Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })
}

function formatCurrency(value: string | number) {
  return `${formatNumber(value)} FCFA`
}

function LoginPage({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [email, setEmail] = useState('admin@spcr.local')
  const [password, setPassword] = useState('Admin@12345')
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const result = await login(email, password)
      localStorage.setItem('spcr_token', result.access_token)
      onLogin(result.user, result.access_token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible')
    }
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={submit}>
        <div className="brand-mark">
          <ShieldCheck size={30} />
        </div>
        <h1>SPCR</h1>
        <p>Suivi de production et gestion des couts de revient</p>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Mot de passe</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <span className="error">{error}</span>}
        <button className="primary-button">Connexion</button>
      </form>
    </main>
  )
}

function Sidebar({ page, setPage, user, logout }: { page: Page; setPage: (page: Page) => void; user: User; logout: () => void }) {
  const items = navItems.filter((item) => canSee(user.role, item.roles))
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="gear"><Settings size={28} /></div>
        <div>
          <strong>SPCR</strong>
          <span>Suivi de Production et<br />Gestion des Couts de Revient</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.page} className={page === item.page ? 'active' : ''} onClick={() => setPage(item.page)}>
              <Icon size={21} />
              <span>{item.label}</span>
              <ChevronRight className="nav-arrow" size={18} />
            </button>
          )
        })}
      </nav>
      <button className="logout" onClick={logout}>
        <LogOut size={21} />
        Deconnexion
      </button>
    </aside>
  )
}

function Header({ user }: { user: User }) {
  return (
    <header className="topbar">
      <button className="icon-button"><Menu size={24} /></button>
      <div className="topbar-right">
        <div className="notification"><Bell size={22} /><span>3</span></div>
        <div className="avatar">{user.first_name.slice(0, 1)}{user.last_name.slice(0, 1)}</div>
        <strong>{user.first_name}</strong>
        <ChevronDown size={16} />
      </div>
    </header>
  )
}

function KpiCard({ icon: Icon, title, value, suffix, trend, color }: { icon: React.ElementType; title: string; value: string; suffix?: string; trend: string; color: string }) {
  return (
    <article className="kpi-card">
      <div className={`kpi-icon ${color}`}><Icon size={30} /></div>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {suffix && <span className="suffix">{suffix}</span>}
        <small className={trend.startsWith('-') ? 'down' : 'up'}>{trend} par rapport au mois dernier</small>
      </div>
    </article>
  )
}

function Dashboard({ data }: { data: DashboardSummary | null }) {
  const fallback: DashboardSummary = {
    kpis: { produced_quantity: '12560', average_unit_cost: '2450', total_production_cost: '30772000', margin_rate: '18.7' },
    production_evolution: [
      { month: 'Jan', quantity: 9000 }, { month: 'Fev', quantity: 10800 }, { month: 'Mar', quantity: 9000 }, { month: 'Avr', quantity: 10750 }, { month: 'Mai', quantity: 13400 },
    ],
    cost_breakdown: [
      { name: 'Matieres premieres', value: 45 }, { name: "Main d'oeuvre", value: 20 }, { name: 'Charges indirectes', value: 25 }, { name: 'Autres charges', value: 10 },
    ],
    recent_productions: [
      { id: 1, reference: 'PRD-2025-0051', product: 'Produit A', quantity: 1250, date: '31/05/2025' },
      { id: 2, reference: 'PRD-2025-0050', product: 'Produit B', quantity: 980, date: '31/05/2025' },
      { id: 3, reference: 'PRD-2025-0049', product: 'Produit C', quantity: 1100, date: '30/05/2025' },
    ],
    product_costs: [
      { product: 'Produit A', unit_cost: 2650, evolution: -2.8 },
      { product: 'Produit B', unit_cost: 2320, evolution: -1.7 },
      { product: 'Produit C', unit_cost: 2810, evolution: 3.4 },
    ],
  }
  const summary = data || fallback
  const colors = ['#2f6fed', '#35b779', '#fb970f', '#8e44dd']

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Tableau de bord</h1>
          <p>Bienvenue dans votre systeme de suivi de production et de gestion des couts de revient.</p>
        </div>
        <button className="date-filter"><CalendarDays size={19} /> Du 01/05/2025 au 31/05/2025 <ChevronDown size={16} /></button>
      </div>
      <section className="kpi-grid">
        <KpiCard icon={Factory} title="Quantite produite" value={formatNumber(summary.kpis.produced_quantity)} suffix="unites" trend="↑ 8.5%" color="blue" />
        <KpiCard icon={Database} title="Cout de revient moyen" value={formatNumber(summary.kpis.average_unit_cost)} suffix="FCFA / unite" trend="- 3.2%" color="green" />
        <KpiCard icon={WalletCards} title="Cout total de production" value={formatNumber(summary.kpis.total_production_cost)} suffix="FCFA" trend="↑ 5.1%" color="orange" />
        <KpiCard icon={BarChart3} title="Marge sur cout" value={`${Number(summary.kpis.margin_rate).toFixed(1)}%`} trend="↑ 2.4%" color="purple" />
      </section>
      <section className="dashboard-grid">
        <div className="panel">
          <h2>Evolution de la production</h2>
          <ResponsiveContainer width="100%" height={245}>
            <LineChart data={summary.production_evolution}>
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="quantity" stroke="#2f6fed" strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="panel">
          <h2>Repartition des couts de production</h2>
          <div className="donut-row">
            <ResponsiveContainer width="48%" height={245}>
              <PieChart>
                <Pie data={summary.cost_breakdown} innerRadius={56} outerRadius={95} dataKey="value">
                  {summary.cost_breakdown.map((_, index) => <Cell key={index} fill={colors[index]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-list">
              {summary.cost_breakdown.map((item, index) => (
                <div key={item.name}><span style={{ background: colors[index] }} />{item.name}<strong>{Math.round(item.value)}%</strong></div>
              ))}
            </div>
          </div>
        </div>
        <div className="panel">
          <h2>Dernieres productions enregistrees</h2>
          <DataTable headers={['Reference', 'Produit', 'Quantite', 'Date', 'Action']} rows={summary.recent_productions.map((p) => [p.reference, p.product, `${formatNumber(p.quantity)} unites`, p.date, <button className="mini-button">Voir</button>])} />
          <button className="secondary-button">Voir toutes les productions</button>
        </div>
        <div className="panel">
          <h2>Cout de revient par produit</h2>
          <DataTable headers={['Produit', 'Cout de revient (FCFA/unite)', 'Evolution']} rows={summary.product_costs.map((p) => [p.product, formatNumber(p.unit_cost), <span className={p.evolution > 0 ? 'down' : 'up'}>{p.evolution > 0 ? '↑' : '↓'} {p.evolution}%</span>])} />
          <button className="secondary-button">Voir le detail des couts</button>
        </div>
      </section>
    </>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>) : <tr><td colSpan={headers.length}>Aucune donnee</td></tr>}</tbody>
      </table>
    </div>
  )
}

function ResourcePages({ page, role, reloadDashboard }: { page: Page; role: UserRole; reloadDashboard: () => void }) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productions, setProductions] = useState<Production[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState('')

  async function load() {
    setMessage('')
    if (page === 'materials') setMaterials(await api.materials())
    if (page === 'products') setProducts(await api.products())
    if (page === 'production' || page === 'costs') {
      setProductions(await api.productions())
      setProducts(await api.products())
      setMaterials(await api.materials().catch(() => []))
    }
    if (page === 'users' && role === 'admin') setUsers(await api.users())
  }

  useEffect(() => { load().catch((e) => setMessage(e.message)) }, [page])

  if (page === 'charges' || page === 'reports' || page === 'settings') {
    return <Placeholder title={navItems.find((item) => item.page === page)?.label || ''} />
  }

  return (
    <div className="panel full-panel">
      <h2>{navItems.find((item) => item.page === page)?.label}</h2>
      {message && <p className="notice">{message}</p>}
      {page === 'materials' && (
        <>
          <QuickForm fields={['name', 'unit', 'quantity', 'unit_cost', 'minimum_stock']} labels={['Nom', 'Unite', 'Quantite', 'Cout unitaire', 'Stock minimum']} onSubmit={async (payload) => { await api.createMaterial(payload); await load() }} />
          <DataTable headers={['Nom', 'Unite', 'Stock', 'Cout unitaire', 'Stock minimum']} rows={materials.map((m) => [m.name, m.unit, formatNumber(m.quantity), formatCurrency(m.unit_cost), formatNumber(m.minimum_stock)])} />
        </>
      )}
      {page === 'products' && (
        <>
          <QuickForm fields={['name', 'sku', 'unit', 'sale_price']} labels={['Nom', 'Reference', 'Unite', 'Prix de vente']} onSubmit={async (payload) => { await api.createProduct(payload); await load() }} />
          <DataTable headers={['Nom', 'Reference', 'Unite', 'Prix de vente']} rows={products.map((p) => [p.name, p.sku, p.unit, formatCurrency(p.sale_price)])} />
        </>
      )}
      {page === 'production' && (
        <>
          <ProductionForm products={products} materials={materials} onSubmit={async (payload) => { await api.createProduction(payload); await load(); reloadDashboard() }} />
          <DataTable headers={['Reference', 'Produit', 'Quantite', 'Statut']} rows={productions.map((p) => [p.reference, p.product?.name || p.product_id, formatNumber(p.quantity), p.status])} />
        </>
      )}
      {page === 'costs' && (
        <>
          <CostForm productions={productions} onSubmit={async (productionId, payload) => { await api.calculateCost(productionId, payload); await load(); reloadDashboard() }} />
          <DataTable headers={['Reference', 'Produit', 'Quantite', 'Statut']} rows={productions.map((p) => [p.reference, p.product?.name || p.product_id, formatNumber(p.quantity), p.status])} />
        </>
      )}
      {page === 'users' && (
        <>
          <QuickForm fields={['email', 'password', 'first_name', 'last_name', 'role']} labels={['Email', 'Mot de passe', 'Prenom', 'Nom', 'Role']} onSubmit={async (payload) => { await api.createUser(payload); await load() }} />
          <DataTable headers={['Nom', 'Email', 'Role', 'Actif']} rows={users.map((u) => [`${u.first_name} ${u.last_name}`, u.email, u.role, u.is_active ? 'Oui' : 'Non'])} />
        </>
      )}
    </div>
  )
}

function QuickForm({ fields, labels, onSubmit }: { fields: string[]; labels: string[]; onSubmit: (payload: Record<string, string>) => Promise<void> }) {
  const initial = Object.fromEntries(fields.map((field) => [field, field === 'role' ? 'operateur' : '']))
  const [form, setForm] = useState<Record<string, string>>(initial)
  return (
    <form className="quick-form" onSubmit={async (e) => { e.preventDefault(); await onSubmit(form); setForm(initial) }}>
      {fields.map((field, index) => (
        <label key={field}>{labels[index]}<input type={field === 'password' ? 'password' : 'text'} value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} /></label>
      ))}
      <button className="primary-button">Enregistrer</button>
    </form>
  )
}

function ProductionForm({ products, materials, onSubmit }: { products: Product[]; materials: Material[]; onSubmit: (payload: unknown) => Promise<void> }) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [quantityUsed, setQuantityUsed] = useState('')
  return (
    <form className="quick-form" onSubmit={async (e) => { e.preventDefault(); await onSubmit({ product_id: Number(productId), quantity, status: 'terminee', materials: materialId ? [{ material_id: Number(materialId), quantity_used: quantityUsed }] : [] }) }}>
      <label>Produit<select value={productId} onChange={(e) => setProductId(e.target.value)}>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Quantite produite<input value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
      <label>Matiere consommee<select value={materialId} onChange={(e) => setMaterialId(e.target.value)}><option value="">Aucune</option>{materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
      <label>Quantite consommee<input value={quantityUsed} onChange={(e) => setQuantityUsed(e.target.value)} /></label>
      <button className="primary-button">Creer production</button>
    </form>
  )
}

function CostForm({ productions, onSubmit }: { productions: Production[]; onSubmit: (productionId: number, payload: unknown) => Promise<void> }) {
  const [productionId, setProductionId] = useState('')
  const [labor, setLabor] = useState('0')
  const [overhead, setOverhead] = useState('0')
  const [other, setOther] = useState('0')
  return (
    <form className="quick-form" onSubmit={async (e) => { e.preventDefault(); await onSubmit(Number(productionId), { labor_cost: labor, overhead_cost: overhead, other_cost: other }) }}>
      <label>Production<select value={productionId} onChange={(e) => setProductionId(e.target.value)}>{productions.map((p) => <option key={p.id} value={p.id}>{p.reference}</option>)}</select></label>
      <label>Main d'oeuvre<input value={labor} onChange={(e) => setLabor(e.target.value)} /></label>
      <label>Charges indirectes<input value={overhead} onChange={(e) => setOverhead(e.target.value)} /></label>
      <label>Autres charges<input value={other} onChange={(e) => setOther(e.target.value)} /></label>
      <button className="primary-button">Calculer</button>
    </form>
  )
}

function Placeholder({ title }: { title: string }) {
  return <div className="panel full-panel"><h2>{title}</h2><p className="muted">Module pret dans la nouvelle architecture React/FastAPI. Les donnees principales sont gerees dans Production, Matieres, Produits, Calcul des couts et Utilisateurs.</p></div>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  const visiblePage = useMemo(() => page, [page])

  async function loadDashboard() {
    setSummary(await api.dashboard().catch(() => null))
  }

  useEffect(() => {
    if (!localStorage.getItem('spcr_token')) return
    api.me().then(setUser).catch(() => localStorage.removeItem('spcr_token'))
  }, [])

  useEffect(() => {
    if (user) loadDashboard()
  }, [user])

  if (!user) return <LoginPage onLogin={(u) => setUser(u)} />

  return (
    <div className="app-shell">
      <Sidebar page={visiblePage} setPage={setPage} user={user} logout={() => { localStorage.removeItem('spcr_token'); setUser(null) }} />
      <section className="workspace">
        <Header user={user} />
        <main className="content">
          {visiblePage === 'dashboard' ? <Dashboard data={summary} /> : <ResourcePages page={visiblePage} role={user.role} reloadDashboard={loadDashboard} />}
        </main>
      </section>
    </div>
  )
}
