/** Données de repli pour afficher les graphiques même sans production en base */

export function getDefaultEvolutionData() {
  return ['L-01', 'L-02', 'L-03', 'L-04', 'L-05', 'L-06'].map((numeroLot) => ({
    numeroLot,
    coutTotal: 0,
    margeBrute: 0,
  }))
}

export function getDefaultBreakdownData() {
  return [
    { name: 'Matières premières', value: 0 },
    { name: "Main d'œuvre", value: 0 },
    { name: 'Charges indirectes', value: 0 },
  ]
}

export function getDefaultVolumeData() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      month: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      litres: 0,
    }
  })
}

export const DEFAULT_STOCK_LABELS = [
  { name: 'Jus de raisin', unite: 'litre' },
  { name: 'Bouteilles', unite: 'unite' },
  { name: 'Étiquettes', unite: 'unite' },
  { name: 'Bouchons', unite: 'unite' },
] as const

export function getDefaultStockData() {
  return DEFAULT_STOCK_LABELS.map((item) => ({
    name: item.name,
    stock: 0,
    unite: item.unite,
  }))
}
