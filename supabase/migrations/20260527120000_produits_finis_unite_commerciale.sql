-- Unité commerciale du catalogue produits finis (bouteille, carton).
ALTER TABLE public.produits_finis
  ADD COLUMN IF NOT EXISTS unite_commerciale TEXT;

ALTER TABLE public.produits_finis
  DROP CONSTRAINT IF EXISTS produits_finis_unite_commerciale_check;

ALTER TABLE public.produits_finis
  ADD CONSTRAINT produits_finis_unite_commerciale_check
  CHECK (
    unite_commerciale IS NULL
    OR unite_commerciale IN ('bouteille', 'carton')
  );

COMMENT ON COLUMN public.produits_finis.unite_commerciale IS
  'Unité de vente / dénomination catalogue : bouteille ou carton.';
