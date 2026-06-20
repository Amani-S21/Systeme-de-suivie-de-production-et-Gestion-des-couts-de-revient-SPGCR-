import type { BomItem, Charge, DashboardSummary, Material, Product, Production, User } from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function token() {
  return localStorage.getItem('spcr_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (token()) headers.set('Authorization', `Bearer ${token()}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Erreur API')
  }
  return response.json()
}

export async function login(username: string, password: string) {
  const body = new URLSearchParams({ username, password })
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
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
  charges: (filters?: { search?: string; category?: string; dateFrom?: string; dateTo?: string }) => {
    const params = new URLSearchParams()
    if (filters?.search) params.set('search', filters.search)
    if (filters?.category) params.set('category', filters.category)
    if (filters?.dateFrom) params.set('date_from', filters.dateFrom)
    if (filters?.dateTo) params.set('date_to', filters.dateTo)
    return request<Charge[]>(`/charges${params.toString() ? `?${params}` : ''}`)
  },
  createCharge: (payload: unknown) => request<Charge>('/charges', { method: 'POST', body: JSON.stringify(payload) }),
  updateCharge: (id: string | number, payload: unknown) => request<Charge>(`/charges/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCharge: (id: string | number) => request<{ success: boolean }>(`/charges/${id}`, { method: 'DELETE' }),
}
