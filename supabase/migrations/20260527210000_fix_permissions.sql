-- ============================================================
-- SPGCR – Migration : Fix Permissions & Trigger Ownership
-- ============================================================

-- On s'assure que les rôles standards peuvent accéder au schéma public
GRANT USAGE ON SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated, anon, service_role;

-- On force le propriétaire du trigger pour être sûr qu'il tourne avec les droits max
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- On s'assure que le trigger est bien SECURITY DEFINER (déjà le cas normalement)
-- On ré-applique une version ultra-minimale pour être certain à 100%
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, prenom, role, actif)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'prenom', 'Nouveau'),
    'operateur_usine'::app_role,
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
