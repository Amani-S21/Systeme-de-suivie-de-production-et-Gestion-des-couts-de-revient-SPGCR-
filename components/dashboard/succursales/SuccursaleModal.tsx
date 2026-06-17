'use client'

import { useState, useEffect } from 'react'
import MultiStepModal from '@/components/dashboard/modals/MultiStepModal'
import { FormField, formInputClass } from '@/components/dashboard/ui/FormField'
import { SuccursaleRow, upsertSuccursale } from '@/app/dashboard/actions/succursales'

interface Props {
  open: boolean
  onClose: () => void
  target: SuccursaleRow | null
  profiles: { id: string; nom: string; prenom: string }[]
  onSuccess: (data: SuccursaleRow) => void
}

export default function SuccursaleModal({ open, onClose, target, profiles, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<SuccursaleRow>>({
    nom: '',
    adresse: '',
    ville: '',
    code_depot: '',
    responsable_id: '',
    actif: true
  })

  useEffect(() => {
    if (target) {
      setFormData(target)
    } else {
      setFormData({
        nom: '',
        adresse: '',
        ville: '',
        code_depot: '',
        responsable_id: '',
        actif: true
      })
    }
    setError(null)
  }, [target, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await upsertSuccursale(formData)
      // On récupère le nom du responsable pour l'affichage immédiat dans le tableau
      const resp = profiles.find(p => p.id === formData.responsable_id)
      onSuccess({ 
        ...formData as SuccursaleRow, 
        responsable_nom: resp ? `${resp.prenom} ${resp.nom}` : 'Non assigné' 
      })
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MultiStepModal
      open={open}
      onClose={onClose}
      title={target ? 'Modifier la Succursale' : 'Ajouter une Succursale'}
      steps={['Informations Générales']}
      currentStep={1}
      isDirty={true}
      footer={
        <div className="flex w-full justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-slate-950 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 p-1">
        {error && <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-600 border border-rose-100">{error}</div>}
        
        <div className="grid grid-cols-2 gap-4">
           <FormField label="Nom de la succursale" required>
            <input 
              value={formData.nom} 
              onChange={e => setFormData(p => ({ ...p, nom: e.target.value }))}
              placeholder="Ex: Dépôt Central Goma"
              className={formInputClass(false)}
            />
          </FormField>
          <FormField label="Code Dépôt" required>
            <input 
              value={formData.code_depot} 
              onChange={e => setFormData(p => ({ ...p, code_depot: e.target.value.toUpperCase() }))}
              placeholder="Ex: GOMA-01"
              className={formInputClass(false) + " font-mono uppercase"}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Ville" required>
            <input 
              value={formData.ville} 
              onChange={e => setFormData(p => ({ ...p, ville: e.target.value }))}
              placeholder="Ex: Goma"
              className={formInputClass(false)}
            />
          </FormField>
          <FormField label="Responsable du site">
            <select 
              value={formData.responsable_id || ''}
              onChange={e => setFormData(p => ({ ...p, responsable_id: e.target.value }))}
              className={formInputClass(false)}
            >
              <option value="">— Non assigné —</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Adresse complète">
          <textarea 
            value={formData.adresse || ''} 
            onChange={e => setFormData(p => ({ ...p, adresse: e.target.value }))}
            placeholder="Ex: 12 Av. du Port, Q/Les Volcans"
            rows={2}
            className={formInputClass(false)}
          />
        </FormField>
      </div>
    </MultiStepModal>
  )
}
