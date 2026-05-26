-- Permet aux responsables production de lire les profils des opérateurs
-- (nécessaire pour afficher le nom sur le tableau de suivi des lots)
CREATE POLICY "Responsables lisent profils operateurs"
ON public.profiles
FOR SELECT
USING (
  has_role(ARRAY['responsable_production'::app_role])
  AND role = 'operateur_usine'::app_role
);
