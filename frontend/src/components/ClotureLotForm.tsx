'use client';

import React, { useState } from 'react';
import { DollarSign, Loader2, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { api } from '@/api';

interface ClotureLotFormProps {
  lotId: string;
  numeroLot: string;
  quantiteProduite: number;
  onSuccess?: (data: any) => void;
}

export default function ClotureLotForm({ lotId, numeroLot, quantiteProduite, onSuccess }: ClotureLotFormProps) {
  const [coutMainOeuvre, setCoutMainOeuvre] = useState<string>('');
  const [chargesIndirectes, setChargesIndirectes] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Extraction et validation des données numériques
    const mainOeuvreVal = parseFloat(coutMainOeuvre);
    const chargesIndVal = parseFloat(chargesIndirectes);

    if (isNaN(mainOeuvreVal) || isNaN(chargesIndVal)) {
      setError("Veuillez saisir des montants valides.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.calculateCost(Number(lotId), {
        labor_cost: mainOeuvreVal,
        overhead_cost: chargesIndVal,
        other_cost: 0,
      });
      await api.updateProduction(lotId, { status: 'terminee' });

      // Traitement du succès
      setSuccess("Lot clôturé et calculs enregistrés avec succès.");
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur inattendue est survenue lors de la clôture.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* En-tête de la carte d'assistance au calcul */}
      <div className="bg-slate-50 dark:bg-slate-800/40 px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-slate-500" />
          Clôture de Production
        </h2>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400 flex flex-col gap-1.5 bg-white dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-slate-200">Numéro de lot :</span> 
            <span className="font-mono text-indigo-600 dark:text-indigo-400">{numeroLot}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-900 dark:text-slate-200">Quantité conditionnée :</span> 
            <span className="font-semibold text-slate-800 dark:text-slate-300">{quantiteProduite} unités</span>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Bannière d'avertissement */}
        <div className="flex bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg mb-6 text-sm items-start gap-3 border border-amber-200 dark:border-amber-800/30">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong className="font-semibold">Attention :</strong> Cette action passera le statut du lot à &quot;terminé&quot; et verrouillera les calculs financiers. Assurez-vous des montants avant de valider.
          </p>
        </div>

        {/* Retours visuels (Erreur / Succès) */}
        {error && (
          <div className="flex bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-5 text-sm items-center gap-2 border border-red-200 dark:border-red-800/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-3 rounded-lg mb-5 text-sm items-center gap-2 border border-emerald-200 dark:border-emerald-800/30">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{success}</span>
          </div>
        )}

        {/* Formulaire Principal */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="coutMainOeuvre" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Coût direct de la Main d&apos;œuvre <span className="font-normal text-slate-400">($)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="coutMainOeuvre"
                type="number"
                step="0.01"
                min="0"
                required
                disabled={isLoading || !!success}
                placeholder="Ex : 150.00"
                className="pl-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                value={coutMainOeuvre}
                onChange={(e) => setCoutMainOeuvre(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="chargesIndirectes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Charges indirectes fixes <span className="font-normal text-slate-400">($)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
              <input
                id="chargesIndirectes"
                type="number"
                step="0.01"
                min="0"
                required
                disabled={isLoading || !!success}
                placeholder="Ex : 50.00"
                className="pl-10 w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                value={chargesIndirectes}
                onChange={(e) => setChargesIndirectes(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !!success}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 disabled:bg-indigo-600 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Calcul et enregistrement...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Validation terminée</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Clôturer le lot & Calculer le coût</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
