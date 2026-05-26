/**
 * Calcule le nouveau coût unitaire moyen pondéré après entrée en stock.
 * CUMP = (stock × CUMP actuel + prix achat total) / (stock + quantité achetée)
 */
export function computeNewCump(
  currentStock: number,
  currentCump: number,
  quantityAdded: number,
  totalPurchasePrice: number
): number {
  const newStock = currentStock + quantityAdded
  if (newStock <= 0) return 0
  const totalValue = currentStock * currentCump + totalPurchasePrice
  return Math.round((totalValue / newStock) * 100) / 100
}
