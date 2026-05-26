-- ============================================================
-- SPGCR – Migration : Fix Profiles RLS Insert
-- ============================================================

-- Autoriser les administrateurs à insérer directement dans la table profiles
-- Utile pour la pré-création de profils par l'admin.
-- Note: L'admin doit fournir un ID valide (ex: généré ou lié à un auth user ultérieurement)
-- ou nous devrions assouplir la contrainte FK si on veut de la pré-création pure.

CREATE POLICY "Admins insèrent des profils" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND actif = true
        AND role = 'admin_msd'::app_role
    )
  );
