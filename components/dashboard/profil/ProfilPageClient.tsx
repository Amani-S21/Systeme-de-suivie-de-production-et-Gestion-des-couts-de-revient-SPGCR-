'use client'

import { useState, useTransition } from 'react'
import { User2, Mail, Shield, Calendar, BadgeCheck, Pencil, X, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'
import { cardBase, cardPadding } from '@/lib/dashboard/design'
import type { AppRole } from '@/types/spgcr'
import { updateProfile } from '@/app/dashboard/actions/profil'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className={`${cardBase} ${cardPadding} flex items-start gap-4`}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-slate-50 text-slate-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900 truncate">{value}</p>
      </div>
    </div>
  )
}

interface Props {
  profile: any
  email: string
}

export default function ProfilPageClient({ profile, email }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    prenom: profile.prenom,
    nom: profile.nom,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setIsEditing(false)
      }
    })
  }

  const initials = `${formData.prenom.charAt(0)}${formData.nom.charAt(0)}`.toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Compte utilisateur
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Mon Profil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gérez vos informations personnelles et vérifiez vos privilèges.
          </p>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier mes informations
          </button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs font-semibold text-emerald-700 animate-fadeIn">
          <CheckCircle2 className="h-4 w-4" />
          Vos modifications ont été enregistrées avec succès.
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-semibold text-rose-700 animate-fadeIn">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className={`${cardBase} ${cardPadding} flex items-center gap-4`}>
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white shadow-lg">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {formData.prenom} {formData.nom}
          </h2>
          <p className="text-sm text-slate-500">{ROLE_LABELS[profile.role as AppRole]}</p>
          <div className="mt-2 flex items-center gap-2">
            {profile.actif ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                <BadgeCheck className="h-3 w-3" />
                Compte vérifié
              </span>
            ) : (
              <span className="inline-flex rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                En attente
              </span>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className={`${cardBase} ${cardPadding} space-y-4 animate-fadeIn`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Prénom</label>
              <input
                type="text"
                required
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Nom de famille</label>
              <input
                type="text"
                required
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false)
                setFormData({ prenom: profile.prenom, nom: profile.nom })
              }}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
            >
              {isPending ? <span className="animate-spin text-xs">...</span> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<User2 className="h-4 w-4" />}
            label="Nom complet"
            value={`${formData.prenom} ${formData.nom}`}
          />
          <InfoRow
            icon={<Mail className="h-4 w-4" />}
            label="Adresse e-mail"
            value={email}
          />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="Rôle système"
            value={ROLE_LABELS[profile.role as AppRole]}
          />
          <InfoRow
            icon={<Calendar className="h-4 w-4" />}
            label="Membre depuis le"
            value={formatDate(profile.created_at)}
          />
        </div>
      )}
    </div>
  )
}
