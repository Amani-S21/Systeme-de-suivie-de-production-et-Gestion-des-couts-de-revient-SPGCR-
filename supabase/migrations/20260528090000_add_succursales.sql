-- ============================================================
-- SPGCR – Migration : add_succursales (Gestion Multi-site)
-- ============================================================

-- 1. Create table 'succursales'
CREATE TABLE IF NOT EXISTS public.succursales (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom         TEXT NOT NULL,
    adresse     TEXT,
    ville       TEXT NOT NULL,
    code_depot  TEXT UNIQUE NOT NULL,
    responsable_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actif       BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Add succursale_id to profiles and logs_activites
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS succursale_id UUID REFERENCES public.succursales(id) ON DELETE SET NULL;

ALTER TABLE public.logs_activites 
ADD COLUMN IF NOT EXISTS succursale_id UUID REFERENCES public.succursales(id) ON DELETE SET NULL;

-- 3. Create table 'stock_produits_site' (Inventory for each site)
CREATE TABLE IF NOT EXISTS public.stock_produits_site (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    succursale_id   UUID NOT NULL REFERENCES public.succursales(id) ON DELETE CASCADE,
    produit_fini_id UUID NOT NULL REFERENCES public.produits_finis(id) ON DELETE CASCADE,
    quantite        INTEGER NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(succursale_id, produit_fini_id)
);

-- 4. Triggers for updated_at
CREATE TRIGGER handle_succursales_updated_at BEFORE UPDATE ON public.succursales FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();
CREATE TRIGGER handle_stock_produits_site_updated_at BEFORE UPDATE ON public.stock_produits_site FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- 5. RLS Policies

-- succursales table
ALTER TABLE public.succursales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can read active succursales" ON public.succursales
    FOR SELECT USING (is_active_user());

CREATE POLICY "Admins have full access on succursales" ON public.succursales
    FOR ALL USING (has_role(ARRAY['admin_msd'::app_role]));

-- stock_produits_site table
ALTER TABLE public.stock_produits_site ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active users can read stocks" ON public.stock_produits_site
    FOR SELECT USING (is_active_user());

CREATE POLICY "Admin and production responsibles can manage site stocks" ON public.stock_produits_site
    FOR ALL USING (has_role(ARRAY['admin_msd'::app_role, 'responsable_production'::app_role]));

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_succursales_ville ON public.succursales(ville);
CREATE INDEX IF NOT EXISTS idx_profiles_succursale_id ON public.profiles(succursale_id);
CREATE INDEX IF NOT EXISTS idx_stock_produits_site_succursale ON public.stock_produits_site(succursale_id);
