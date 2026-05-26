import { redirect } from 'next/navigation'
import { User2, Mail, Shield, Calendar, BadgeCheck } from 'lucide-react'
import { createClient } from '@/utils/supabase/server'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'
import { cardBase, cardPadding } from '@/lib/dashboard/design'
import type { AppRole } from '@/types/spgcr'

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
        <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

export default async function ProfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nom, prenom, role, actif, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const role = profile.role as AppRole

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Compte utilisateur
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Mon Profil
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Informations personnelles et privilèges sur la plateforme SPGCR.
        </p>
      </div>

      <div className={`${cardBase} ${cardPadding} flex items-center gap-4`}>
        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-800 text-lg font-bold text-white">
          {profile.prenom.charAt(0)}
          {profile.nom.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {profile.prenom} {profile.nom}
          </h2>
          <p className="text-sm text-slate-500">{ROLE_LABELS[role]}</p>
          {profile.actif ? (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <BadgeCheck className="h-3 w-3" />
              Compte actif
            </span>
          ) : (
            <span className="mt-2 inline-flex rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              En attente de validation
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoRow
          icon={<User2 className="h-4 w-4" />}
          label="Nom complet"
          value={`${profile.prenom} ${profile.nom}`}
        />
        <InfoRow
          icon={<Mail className="h-4 w-4" />}
          label="Adresse e-mail"
          value={user.email ?? '—'}
        />
        <InfoRow
          icon={<Shield className="h-4 w-4" />}
          label="Rôle système"
          value={ROLE_LABELS[role]}
        />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="Compte créé le"
          value={formatDate(profile.created_at)}
        />
      </div>
    </div>
  )
}
