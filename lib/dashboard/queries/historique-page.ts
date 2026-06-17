import { createClient } from '@/utils/supabase/server'
import type { ActionType } from '@/lib/audit'

export interface LogRow {
  id: string
  profil_id: string | null
  action_type: ActionType
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
  profil_nom: string | null
  profil_prenom: string | null
}

export async function fetchLogsActivites(limit = 500): Promise<LogRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('logs_activites')
    .select(`
      id,
      profil_id,
      action_type,
      description,
      metadata,
      created_at,
      profiles ( nom, prenom )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []

  return (data ?? []).map((row: any) => {
    const profil = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      profil_id: row.profil_id,
      action_type: row.action_type as ActionType,
      description: row.description,
      metadata: row.metadata ?? null,
      created_at: row.created_at,
      profil_nom: profil?.nom ?? null,
      profil_prenom: profil?.prenom ?? null,
    }
  })
}
