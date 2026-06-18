export type UserRole = 'admin_msd' | 'responsable_production' | 'operateur_usine'

export interface User {
  id: number
  email: string
  login: string
  first_name: string
  last_name: string
  role: UserRole
  is_active: boolean
}

export interface Material {
  id: number
  name: string
  unit: string
  quantity: string
  unit_cost: string
  minimum_stock: string
}

export interface Product {
  id: number
  name: string
  sku: string
  unit: string
  sale_price: string
}

export interface Production {
  id: number
  reference: string
  product_id: number
  product?: Product
  quantity: string
  status: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
  created_at: string
}

export interface DashboardSummary {
  kpis: {
    produced_quantity: string
    average_unit_cost: string
    total_production_cost: string
    margin_rate: string
  }
  production_evolution: { month: string; quantity: number }[]
  cost_breakdown: { name: string; value: number }[]
  recent_productions: { id: number; reference: string; product: string; quantity: number; date: string }[]
  product_costs: { product: string; unit_cost: number; evolution: number }[]
}
