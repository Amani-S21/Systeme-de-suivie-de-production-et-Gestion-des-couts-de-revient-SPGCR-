-- ============================================================
-- SPGCR – Migration : logs_activites (Journal d'Audit)
-- ============================================================

CREATE TYPE action_type_enum AS ENUM (
  'CONNEXION',
  'DECONNEXION',
  'CREATION_LOT',
  'CLOTURE_LOT',
  'AJUSTEMENT_STOCK',
  'CREATION_COMPOSANT',
  'CREATION_FORMULE',
  'ACTIVATION_COMPTE',
  'DESACTIVATION_COMPTE',
  'CHANGEMENT_ROLE',
  'SUPPRESSION_UTILISATEUR',
  'AUTRE'
);

CREATE TABLE IF NOT EXISTS public.logs_activites (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profil_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type   action_type_enum NOT NULL,
  description   TEXT NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast chronological queries
CREATE INDEX IF NOT EXISTS idx_logs_activites_created_at ON public.logs_activites (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_activites_profil_id  ON public.logs_activites (profil_id);
CREATE INDEX IF NOT EXISTS idx_logs_activites_action_type ON public.logs_activites (action_type);

-- RLS
ALTER TABLE public.logs_activites ENABLE ROW LEVEL SECURITY;

-- Admin and responsable can read all logs
CREATE POLICY "admin_resp_read_logs" ON public.logs_activites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND actif = true
        AND role IN ('admin_msd', 'responsable_production')
    )
  );

-- Any authenticated, active user can insert their own logs
CREATE POLICY "auth_user_insert_log" ON public.logs_activites
  FOR INSERT WITH CHECK (
    profil_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND actif = true
    )
  );

-- Admin can delete logs (for archive cleanup)
CREATE POLICY "admin_delete_logs" ON public.logs_activites
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND actif = true AND role = 'admin_msd'
    )
  );
