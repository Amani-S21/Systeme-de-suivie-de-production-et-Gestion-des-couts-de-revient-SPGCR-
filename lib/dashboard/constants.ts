/** Seuil en dessous duquel un composant est considéré en stock critique */
export const STOCK_CRITICAL_THRESHOLD = 25

/** Codes ou motifs de noms pour les matières premières principales */
export const MAIN_MATERIAL_PATTERNS = [
  'jus',
  'raisin',
  'bouteille',
  'étiquette',
  'etiquette',
  'bouchon',
] as const

/** Palette Recharts — tons doux adaptés au thème Light */
export const CHART_COLORS = {
  primary: '#64748b',
  primaryLight: '#94a3b8',
  accent: '#3b82f6',
  accentSoft: '#dbeafe',
  success: '#059669',
  successSoft: '#d1fae5',
  warning: '#d97706',
  muted: '#cbd5e1',
  grid: '#f1f5f9',
} as const
