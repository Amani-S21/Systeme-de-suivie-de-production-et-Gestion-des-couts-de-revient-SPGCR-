export function generateCode(label: string, fallback = 'ITEM'): string {
  const words = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  const base = words.join('-') || fallback
  const suffix = String(Date.now()).slice(-6)
  return `${base}-${suffix}`
}
