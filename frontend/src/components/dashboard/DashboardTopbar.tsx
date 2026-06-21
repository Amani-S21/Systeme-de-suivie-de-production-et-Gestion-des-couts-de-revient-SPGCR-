'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, LogOut, Menu, User2 } from 'lucide-react'
import Link from '@/router'
import { signOut } from '@/app/dashboard/actions'
import type { AppRole } from '@/types/spgcr'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'

interface Props {
  prenom: string
  nom: string
  role: AppRole
  email: string
  onSidebarToggle: () => void
}

export default function DashboardTopbar({ prenom, nom, role, email, onSidebarToggle }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)
  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <header className="relative z-30 flex h-[78px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:px-6">
      <button
        type="button"
        onClick={onSidebarToggle}
        className="flex h-10 w-10 items-center justify-center text-[#102544] transition-colors hover:bg-slate-50"
        aria-label="Ouvrir ou fermer le menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="flex items-center gap-5">
        <div ref={ref} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-3 text-sm text-slate-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-bold text-white shadow-sm">
              {initials}
            </span>
            <span className="hidden font-medium sm:block">{prenom}</span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="font-semibold text-slate-900">{prenom} {nom}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
                <p className="mt-1 text-[10px] font-bold uppercase text-blue-600">{ROLE_LABELS[role]}</p>
              </div>
              <Link href="/dashboard/profil" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50">
                <User2 className="h-4 w-4" /> Mon profil
              </Link>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => signOut())}
                className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" /> {isPending ? 'Déconnexion...' : 'Déconnexion'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
