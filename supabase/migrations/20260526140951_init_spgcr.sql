-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE app_role AS ENUM ('admin_msd', 'responsable_production', 'operateur_usine');

-- 2. FUNCS & TRIGGERS (Common)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. TABLES DEFINITION

-- TABLE profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    role app_role DEFAULT 'operateur_usine'::app_role,
    actif BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE composants
CREATE TABLE public.composants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    categorie TEXT CHECK (categorie IN ('matiere_premiere', 'intrant', 'emballage', 'charge_indirecte')),
    unite_mesure TEXT CHECK (unite_mesure IN ('litre', 'kg', 'unite')),
    cout_unitaire_moyen_pondere NUMERIC(12,2) DEFAULT 0.00,
    stock_actuel NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE produits_finis
CREATE TABLE public.produits_finis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    volume_litre NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE nomenclatures_bom
CREATE TABLE public.nomenclatures_bom (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_fini_id UUID REFERENCES public.produits_finis(id) ON DELETE CASCADE,
    composant_id UUID REFERENCES public.composants(id) ON DELETE RESTRICT,
    quantite_requise NUMERIC(12,4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(produit_fini_id, composant_id)
);

-- TABLE lots_production
CREATE TABLE public.lots_production (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_lot TEXT UNIQUE NOT NULL,
    produit_fini_id UUID REFERENCES public.produits_finis(id) ON DELETE RESTRICT,
    quantite_produite INTEGER NOT NULL,
    statut TEXT CHECK (statut IN ('en_cours', 'termine', 'annule')) DEFAULT 'en_cours',
    date_production TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operateur_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLE couts_revient
CREATE TABLE public.couts_revient (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID UNIQUE REFERENCES public.lots_production(id) ON DELETE CASCADE,
    cout_direct_matieres NUMERIC(12,2) NOT NULL,
    cout_direct_main_oeuvre NUMERIC(12,2) NOT NULL,
    charges_indirectes NUMERIC(12,2) NOT NULL,
    cout_revient_total NUMERIC(12,2) NOT NULL,
    cout_unitaire_theorique NUMERIC(12,2) NOT NULL,
    marge_brute_estimee NUMERIC(12,2),
    calcule_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. APPLY UPDATED_AT TRIGGERS
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_composants_updated_at BEFORE UPDATE ON public.composants FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_produits_finis_updated_at BEFORE UPDATE ON public.produits_finis FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_nomenclatures_bom_updated_at BEFORE UPDATE ON public.nomenclatures_bom FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_lots_production_updated_at BEFORE UPDATE ON public.lots_production FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 5. TRIGGER ON NEW AUTH USER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nom, prenom, role, actif)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nom', 'Non défini'),
        COALESCE(NEW.raw_user_meta_data->>'prenom', 'Non défini'),
        'operateur_usine'::app_role,
        false
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.composants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits_finis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomenclatures_bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couts_revient ENABLE ROW LEVEL SECURITY;

-- Helper functions for policies (SECURITY DEFINER évite la récursion infinie)
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND actif = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(required_roles app_role[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND actif = true AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Utilisateurs lisent leur profil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins lisent tous les profils" ON public.profiles FOR SELECT USING (has_role(ARRAY['admin_msd'::app_role]));
CREATE POLICY "Admins modifient les profils" ON public.profiles FOR UPDATE USING (has_role(ARRAY['admin_msd'::app_role]));
CREATE POLICY "Admins suppriment les profils" ON public.profiles FOR DELETE USING (has_role(ARRAY['admin_msd'::app_role]));

-- Composants Policies
CREATE POLICY "Lecture agents actifs" ON public.composants FOR SELECT USING (is_active_user());
CREATE POLICY "Modification responsables" ON public.composants FOR ALL USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));

-- Produits Finis Policies
CREATE POLICY "Lecture agents actifs" ON public.produits_finis FOR SELECT USING (is_active_user());
CREATE POLICY "Modification responsables" ON public.produits_finis FOR ALL USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));

-- Nomenclatures BOM Policies
CREATE POLICY "Lecture agents actifs" ON public.nomenclatures_bom FOR SELECT USING (is_active_user());
CREATE POLICY "Modification responsables" ON public.nomenclatures_bom FOR ALL USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));

-- Lots de Production Policies
CREATE POLICY "Lecture agents actifs" ON public.lots_production FOR SELECT USING (is_active_user());
CREATE POLICY "Creation tous actifs" ON public.lots_production FOR INSERT WITH CHECK (is_active_user());
CREATE POLICY "Mise à jour tous actifs" ON public.lots_production FOR UPDATE USING (is_active_user());
CREATE POLICY "Suppression responsables" ON public.lots_production FOR DELETE USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));

-- Couts de Revient Policies (Correction avec WITH CHECK pour l'insertion)
CREATE POLICY "Lecture agents actifs" ON public.couts_revient FOR SELECT USING (is_active_user());
CREATE POLICY "Insertion responsables et edge functions" ON public.couts_revient FOR INSERT WITH CHECK (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));
CREATE POLICY "Modification responsables" ON public.couts_revient FOR UPDATE USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));
CREATE POLICY "Suppression responsables" ON public.couts_revient FOR DELETE USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));