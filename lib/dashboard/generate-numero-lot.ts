/** Génère un numéro de lot unique du type LOT-20260526-A3F2 */
export function generateNumeroLot(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `LOT-${y}${m}${day}-${rand}`
}
