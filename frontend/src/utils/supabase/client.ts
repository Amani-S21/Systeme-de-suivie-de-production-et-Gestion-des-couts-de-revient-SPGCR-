import { api } from '@/api'

export function createClient() {
  return {
    functions: {
      invoke: async (_name: string, options?: { body?: any }): Promise<{ data: any; error: any }> => {
        const productionId = Number(options?.body?.lot_id || options?.body?.lotId || options?.body?.productionId || 0)
        if (!productionId) return { data: null, error: { message: 'Lot de production invalide.' } }
        const data = await api.calculateCost(productionId, {
          labor_cost: Number(options?.body?.cout_direct_main_oeuvre || 0),
          overhead_cost: Number(options?.body?.charges_indirectes_fixes || 0),
          other_cost: 0,
        })
        await api.updateProduction(productionId, { status: 'terminee' })
        return { data, error: null }
      },
    },
  }
}
