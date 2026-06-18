import { api } from '@/api'

export function createClient() {
  return {
    functions: {
      invoke: async (_name: string, options?: { body?: any }) => {
        const productionId = Number(options?.body?.lotId || options?.body?.productionId || 0)
        if (!productionId) return { data: null, error: null }
        const data = await api.calculateCost(productionId, {
          labor_cost: 0,
          overhead_cost: 0,
          other_cost: 0,
        })
        return { data, error: null }
      },
    },
  }
}
