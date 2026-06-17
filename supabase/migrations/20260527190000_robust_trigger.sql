-- ============================================================
-- SPGCR – Migration : Robust Trigger handle_new_user
-- ============================================================

-- On s'assure que le trigger capture correctement toutes les métadonnées
-- et qu'il ne bloque pas la création de l'utilisateur Auth si les métadonnées sont incomplètes.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_nom TEXT;
    v_prenom TEXT;
    v_role app_role;
BEGIN
    -- Extraction sécurisée des métadonnées avec fallback
    v_nom := COALESCE(NEW.raw_user_meta_data->>'nom', NEW.raw_user_meta_data->>'last_name', 'Non défini');
    v_prenom := COALESCE(NEW.raw_user_meta_data->>'prenom', NEW.raw_user_meta_data->>'first_name', 'Non défini');
    
    -- On essaie aussi d'extraire le rôle si présent (et valide), sinon par défaut
    BEGIN
        v_role := (NEW.raw_user_meta_data->>'role')::app_role;
    EXCEPTION WHEN OTHERS THEN
        v_role := 'operateur_usine'::app_role;
    END;

    -- Insertion dans profiles
    INSERT INTO public.profiles (id, nom, prenom, role, actif)
    VALUES (NEW.id, v_nom, v_prenom, v_role, false)
    ON CONFLICT (id) DO UPDATE
    SET 
        nom = EXCLUDED.nom,
        prenom = EXCLUDED.prenom,
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
