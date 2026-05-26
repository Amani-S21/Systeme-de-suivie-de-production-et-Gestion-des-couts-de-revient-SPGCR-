import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

declare const Deno: any;

interface CalculateCostRequest {
  lot_id: string;
  cout_direct_main_oeuvre: number;
  charges_indirectes_fixes: number;
}

serve(async (req) => {
  // 1. Initialisation CORS (pour requêtes OPTIONS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Vérification de la méthode HTTP
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), { 
        status: 405, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Parse payload JSON de la requête
    const reqBody: CalculateCostRequest = await req.json()
    const { lot_id, cout_direct_main_oeuvre, charges_indirectes_fixes } = reqBody

    if (!lot_id || cout_direct_main_oeuvre === undefined || charges_indirectes_fixes === undefined) {
      return new Response(
        JSON.stringify({ error: "Les paramètres lot_id, cout_direct_main_oeuvre et charges_indirectes_fixes sont requis." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 3. Initialisation du client Supabase (avec Service Role Key pour contourner RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variables d'environnement manquantes (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 4. Étape A : Vérifier l'état du lot
    const { data: lot, error: lotError } = await supabase
      .from('lots_production')
      .select('id, produit_fini_id, quantite_produite, statut')
      .eq('id', lot_id)
      .single()

    if (lotError || !lot) {
      return new Response(
        JSON.stringify({ error: "Lot introuvable ou erreur de récupération." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    if (lot.statut === 'termine') {
       return new Response(
        JSON.stringify({ error: "Ce lot de production est déjà terminé et clôturé." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 5. Étape B : Récupérer la nomenclature (BOM) rattachée avec infos sur les composants
    const { data: nomenclatures, error: nomError } = await supabase
      .from('nomenclatures_bom')
      .select(`
        quantite_requise,
        composants (
          id,
          nom,
          cout_unitaire_moyen_pondere
        )
      `)
      .eq('produit_fini_id', lot.produit_fini_id)

    if (nomError || !nomenclatures || nomenclatures.length === 0) {
      return new Response(
        JSON.stringify({ error: "Impossible d'obtenir la nomenclature (BOM) pour ce produit fini." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // 6. Étape C : Calculer le Coût Direct des Matières
    let cout_direct_matieres = 0
    nomenclatures.forEach((bomItem: any) => {
      const qteRequise = parseFloat(bomItem.quantite_requise)
      const qteProduite = parseInt(lot.quantite_produite)
      // Array if one-to-many, object if unique FK; composants being 1 table
      // It returns a single object `composants: { ... }` since the relationship is many-to-one (bom -> composant)
      const composant = Array.isArray(bomItem.composants) ? bomItem.composants[0] : bomItem.composants;
      const coutUnitaire = parseFloat(composant?.cout_unitaire_moyen_pondere) || 0
      
      const coutPourComposant = (qteRequise * qteProduite) * coutUnitaire
      cout_direct_matieres += coutPourComposant
    })

    // 7. Étape D : Calculer les indicateurs finaux de coût de revient
    const cout_revient_total = cout_direct_matieres + cout_direct_main_oeuvre + charges_indirectes_fixes
    const quantiteProduite = parseInt(lot.quantite_produite)
    const cout_unitaire_theorique = quantiteProduite > 0 ? (cout_revient_total / quantiteProduite) : 0

    // 8. Enregistrement transactionnel : on fait upsert d'abord
    const { data: coutData, error: coutError } = await supabase
      .from('couts_revient')
      .upsert({
        lot_id: lot.id,
        cout_direct_matieres: cout_direct_matieres,
        cout_direct_main_oeuvre: cout_direct_main_oeuvre,
        charges_indirectes: charges_indirectes_fixes,
        cout_revient_total: cout_revient_total,
        cout_unitaire_theorique: cout_unitaire_theorique,
      }, { onConflict: 'lot_id' })
      .select()
      .single()

    if (coutError) {
      throw new Error("Erreur lors de la sauvegarde du coût : " + coutError.message)
    }

    // 9. Mise à jour du statut du lot ('termine')
    const { error: updateLotError } = await supabase
      .from('lots_production')
      .update({ statut: 'termine' })
      .eq('id', lot.id)

    if (updateLotError) {
       // Logiquement il faudrait annuler l'étape 8, mais par simplicité on remonte l'erreur console
       throw new Error("Coût calculé mais échec de la clôture du lot : " + updateLotError.message)
    }

    // 10. Renvoi du succès (JSON Response)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Coût de revient calculé et lot clôturé avec succès", 
        data: coutData 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )

  } catch (err: any) {
    console.error("Erreur d'exécution de la requête:", err.message)
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur lors du calcul", details: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
