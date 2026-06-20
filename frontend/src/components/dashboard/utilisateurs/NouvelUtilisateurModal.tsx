'use client'

import { useState, useTransition } from 'react'
import { AtSign, Eye, EyeOff, X, UserPlus, Shield, Mail, User, Lock as LockIcon } from 'lucide-react'
import PrimaryButton from '@/components/dashboard/ui/PrimaryButton'
import { adminCreateUser } from '@/app/dashboard/actions/utilisateurs'
import type { AppRole } from '@/types/spgcr'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'

interface NouvelUtilisateurModalProps {
  open: boolean
  onClose: () => void
}

const ROLES: AppRole[] = ['admin_msd', 'responsable_production', 'operateur_usine']

export default function NouvelUtilisateurModal({ open, onClose }: NouvelUtilisateurModalProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      login: formData.get('login') as string,
      password: formData.get('password') as string,
      role: formData.get('role') as AppRole,
    }

    startTransition(async () => {
      const result = await adminCreateUser(data)
      if (result.error) {
        setError(result.error)
      } else {
        window.dispatchEvent(new CustomEvent('spcr:refresh'))
        onClose()
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose} />

      {/* Modal */}
      <div className="relative max-h-[90vh] w-full max-w-md animate-scaleIn overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Nouvel Utilisateur</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {error && (
            <div className="rounded-md border border-rose-100 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Prénom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input name="prenom" required type="text" autoComplete="off" placeholder="Prénom"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nom</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input name="nom" required type="text" autoComplete="off" placeholder="Nom"
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nom d'utilisateur</label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input name="login" required minLength={3} type="text" autoComplete="off" placeholder="Nom d'utilisateur"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">Identifiant utilisé avec le mot de passe pour se connecter.</p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Professionnel</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input name="email" required type="email" autoComplete="off" placeholder="Adresse email"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mot de passe temporaire</label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input name="password" required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Mot de passe"
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-10 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Rôle Système</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <select name="role" required
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 appearance-none">
                <option value="">Sélectionner un rôle</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
            <PrimaryButton type="submit" loading={isPending} className="flex-1">
              Créer le profil
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
