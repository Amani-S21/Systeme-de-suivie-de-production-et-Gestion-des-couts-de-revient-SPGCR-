import { api } from '@/api'

export interface SearchResult {
  id: string
  type: 'lot' | 'composant' | 'produit'
  title: string
  subtitle?: string
  href: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const q = query.toLowerCase()
  const [materials, products, productions] = await Promise.all([
    api.materials().catch(() => []),
    api.products().catch(() => []),
    api.productions().catch(() => []),
  ])
  return [
    ...materials
      .filter((item) => item.name.toLowerCase().includes(q))
      .map((item) => ({ id: String(item.id), type: 'composant' as const, title: item.name, subtitle: item.unit, href: `/dashboard/composants?search=${item.name}` })),
    ...products
      .filter((item) => item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q))
      .map((item) => ({ id: String(item.id), type: 'produit' as const, title: item.name, subtitle: item.sku, href: `/dashboard/nomenclatures?search=${item.name}` })),
    ...productions
      .filter((item) => item.reference.toLowerCase().includes(q))
      .map((item) => ({ id: String(item.id), type: 'lot' as const, title: item.reference, subtitle: item.product?.name, href: `/dashboard/lots?search=${item.reference}` })),
  ].slice(0, 8)
}
