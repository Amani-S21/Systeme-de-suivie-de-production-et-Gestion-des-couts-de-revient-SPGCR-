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
  code: string
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

export interface BomItem {
  id: number
  product_id: number
  material_id: number
  quantity_required: string
}

export interface Charge {
  id: number
  label: string
  category: string
  amount: string
  charge_date: string
  description?: string | null
  product_id?: number | null
  created_by_id?: number | null
  created_at: string
}

export interface ProductChargeSummary {
  product_id: number
  labor_cost: string
  overhead_cost: string
  other_cost: string
  total_cost: string
}

export interface Production {
  id: number
  reference: string
  product_id: number
  operator_id?: number | null
  product?: Product
  quantity: string
  status: 'planifiee' | 'en_cours' | 'terminee' | 'annulee'
  created_at: string
  cost?: {
    id: number
    production_id: number
    raw_material_cost: string
    labor_cost: string
    overhead_cost: string
    other_cost: string
    total_cost: string
    unit_cost: string
    margin_rate: string
    calculated_at: string
  } | null
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
  production_status: { name: string; value: number }[]
}
