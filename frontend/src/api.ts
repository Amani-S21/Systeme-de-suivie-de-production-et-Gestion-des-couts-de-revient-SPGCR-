import type { BomItem, Charge, DashboardSummary, Material, Product, ProductChargeSummary, Production, User } from './types'
import { notify } from './lib/notifications'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
const API_ORIGIN = new URL(API_URL, window.location.origin).origin
const READY_CACHE_MS = 2 * 60 * 1000

let lastReadyAt = 0
let readinessPromise: Promise<void> | null = null

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 65000) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    window.clearTimeout(timeout)
  }
}

async function waitForBackend(): Promise<void> {
  if (Date.now() - lastReadyAt < READY_CACHE_MS) return
  if (readinessPromise) return readinessPromise

  readinessPromise = (async () => {
    let lastError: unknown
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        const response = await fetchWithTimeout(`${API_ORIGIN}/health`)
        if (response.ok) {
          lastReadyAt = Date.now()
          return
        }
        lastError = new Error(`Health check HTTP ${response.status}`)
      } catch (error) {
        lastError = error
      }
      if (attempt < 2) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
      }
    }
    console.error('SPCR backend unavailable', lastError)
    throw new Error(
      "Le serveur est temporairement indisponible. Patientez quelques secondes puis réessayez."
    )
  })().finally(() => {
    readinessPromise = null
  })

  return readinessPromise
}

function token() {
  return localStorage.getItem('spcr_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  await waitForBackend()
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token()) headers.set('Authorization', `Bearer ${token()}`)
  let response: Response
  try {
    response = await fetchWithTimeout(`${API_URL}${path}`, { ...options, headers })
  } catch (error) {
    lastReadyAt = 0
    console.error(`API request failed: ${path}`, error)
    const message =
      "La communication avec le serveur a été interrompue. Vérifiez votre connexion puis réessayez."
    notify('error', message)
    throw new Error(message)
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item: { msg?: string }) => item.msg || 'Donnée invalide').join(', ')
      : typeof error.detail === 'string'
        ? error.detail
        : error.detail
          ? JSON.stringify(error.detail)
          : 'Erreur API'
    notify('error', detail)
    throw new Error(detail)
  }
  const result = await response.json()
  const method = (options.method || 'GET').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    notify('success', mutationMessage(path, method))
  }
  return result
}

function mutationMessage(path: string, method: string) {
  if (path === '/productions' && method === 'POST') return 'Le lot de production a été ouvert avec succès.'
  if (path.includes('/productions/') && method === 'DELETE') return 'Le lot de production a été supprimé.'
  if (path.includes('/productions/')) return 'Le lot de production a été mis à jour.'
  if (path === '/users' && method === 'POST') return 'Le compte utilisateur a été créé et attend sa validation.'
  if (path.includes('/users/') && method === 'DELETE') return 'Le compte utilisateur a été supprimé.'
  if (path.includes('/users/')) return 'Le compte utilisateur a été mis à jour.'
  if (path.includes('/materials')) return 'Les informations du stock ont été enregistrées.'
  if (path.includes('/products')) return 'Les informations du produit ont été enregistrées.'
  if (path.includes('/charges')) return 'La charge a été enregistrée.'
  if (path.includes('/costs/')) return 'Le calcul du coût de revient a été enregistré.'
  return 'L’action a été enregistrée avec succès.'
}

export async function login(username: string, password: string) {
  await waitForBackend()
  const body = new URLSearchParams({ username, password })
  let response: Response
  try {
    response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch (error) {
    lastReadyAt = 0
    console.error('Login request failed', error)
    throw new Error("Impossible de joindre le serveur. Patientez quelques secondes puis réessayez.")
  }
  if (!response.ok) throw new Error('Identifiants invalides')
  return response.json() as Promise<{ access_token: string; user: User }>
}

export const api = {
  me: () => request<User>('/users/me'),
  dashboard: (dateFrom?: string, dateTo?: string) => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    const query = params.toString()
    return request<DashboardSummary>(`/dashboard/summary${query ? `?${query}` : ''}`)
  },
  users: () => request<User[]>('/users'),
  operators: () => request<User[]>('/users/operators'),
  createUser: (payload: unknown) => request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  updateUser: (id: string | number, payload: unknown) => request<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteUser: (id: string | number) => request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' }),
  materials: () => request<Material[]>('/materials'),
  createMaterial: (payload: unknown) => request<Material>('/materials', { method: 'POST', body: JSON.stringify(payload) }),
  updateMaterial: (id: string | number, payload: unknown) => request<Material>(`/materials/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  addStockMovement: (id: string | number, payload: unknown) => request<Material>(`/materials/${id}/movements`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteMaterial: (id: string | number) => request<{ success: boolean }>(`/materials/${id}`, { method: 'DELETE' }),
  products: () => request<Product[]>('/products'),
  createProduct: (payload: unknown) => request<Product>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: string | number, payload: unknown) => request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  productBom: (productId: string | number) => request<BomItem[]>(`/products/${productId}/bom`),
  replaceProductBom: (productId: string | number, payload: unknown) => request<BomItem[]>(`/products/${productId}/bom`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id: string | number) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  productions: () => request<Production[]>('/productions'),
  createProduction: (payload: unknown) => request<Production>('/productions', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduction: (id: string | number, payload: unknown) => request<Production>(`/productions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteProduction: (id: string | number) => request<{ success: boolean }>(`/productions/${id}`, { method: 'DELETE' }),
  calculateCost: (productionId: number, payload: unknown) =>
    request(`/costs/production/${productionId}`, { method: 'POST', body: JSON.stringify(payload) }),
  charges: (filters?: { search?: string; category?: string; productId?: string | number; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.category) params.set('category', filters.category)
    if (filters?.productId) params.set('product_id', String(filters.productId))
    if (filters?.dateFrom) params.set('date_from', filters.dateFrom)
    if (filters?.dateTo) params.set('date_to', filters.dateTo)
    return request<Charge[]>(`/charges${params.toString() ? `?${params}` : ''}`)
  },
  createCharge: (payload: unknown) => request<Charge>('/charges', { method: 'POST', body: JSON.stringify(payload) }),
  updateCharge: (id: string | number, payload: unknown) => request<Charge>(`/charges/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCharge: (id: string | number) => request<{ success: boolean }>(`/charges/${id}`, { method: 'DELETE' }),
  productChargeSummary: (productId: string | number) => request<ProductChargeSummary>(`/charges/product/${productId}/summary`),
}
