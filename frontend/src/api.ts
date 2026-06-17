import type { DashboardSummary, Material, Product, Production, User } from './types'

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

export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password })
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
  dashboard: () => request<DashboardSummary>('/dashboard/summary'),
  users: () => request<User[]>('/users'),
  createUser: (payload: unknown) => request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),
  materials: () => request<Material[]>('/materials'),
  createMaterial: (payload: unknown) => request<Material>('/materials', { method: 'POST', body: JSON.stringify(payload) }),
  products: () => request<Product[]>('/products'),
  createProduct: (payload: unknown) => request<Product>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  productions: () => request<Production[]>('/productions'),
  createProduction: (payload: unknown) => request<Production>('/productions', { method: 'POST', body: JSON.stringify(payload) }),
  calculateCost: (productionId: number, payload: unknown) =>
    request(`/costs/production/${productionId}`, { method: 'POST', body: JSON.stringify(payload) }),
}
