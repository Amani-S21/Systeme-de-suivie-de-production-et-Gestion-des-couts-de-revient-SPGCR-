-- ============================================================
-- SPGCR – Migration : Ultra-Safe Trigger
-- ============================================================

-- Ce trigger est conçu pour ne JAMAIS faire échouer la création de l'utilisateur Auth.
-- Même si l'insertion dans profiles échoue, l'utilisateur Auth sera créé.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    -- Tentative d'insertion minimale
    INSERT INTO public.profiles (id, nom, prenom, role, actif)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'last_name', 'Utilisateur'),
        COALESCE(NEW.raw_user_meta_data->>'prenom', NEW.raw_user_meta_data->>'first_name', 'Nouveau'),
        'operateur_usine'::app_role, -- On force le rôle par défaut pour éviter tout problème d'enum cast
        false
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION 
    WHEN OTHERS THEN
      -- On ignore silencieusement les erreurs pour ne pas bloquer auth.users
      -- L'admin pourra créer le profil manuellement plus tard si besoin
      RETURN NEW;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
