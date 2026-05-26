'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { ChevronDown, LogOut, Search, User2 } from 'lucide-react'
import { signOut } from '@/app/dashboard/actions'
import type { AppRole } from '@/types/spgcr'
import { ROLE_LABELS } from '@/lib/dashboard/navigation'

interface DashboardHeaderProps {
  prenom: string
  nom: string
  role: AppRole
  email: string
  sidebarCollapsed: boolean
  onSidebarToggle: () => void
}

function SpgcrLogoMark() {
  return (
    <div className="flex h-4 items-end gap-[3px]" aria-hidden>
      <span className="h-full w-[3px] rounded-full bg-slate-900" />
      <span className="h-[85%] w-[3px] rounded-full bg-slate-600" />
      <span className="h-[70%] w-[3px] rounded-full bg-slate-400" />
    </div>
  )
}

export default function DashboardHeader({
  prenom,
  nom,
  role,
  email,
  sidebarCollapsed,
  onSidebarToggle,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const initials = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()

  function handleSignOut() {
    startTransition(() => {
      signOut()
    })
  }

  return (
    <header className="z-30 w-full shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-14 w-full items-center gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        {/* Gauche — logo + titre */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSidebarToggle}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-800 transition-all duration-300 hover:border-slate-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
            aria-label={sidebarCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          >
            <SpgcrLogoMark />
          </button>
          <Link href="/dashboard" className="leading-none">
            <span className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">
              SPGCR
            </span>
            <span className="mt-0.5 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:block">
              Vin Ushindi
            </span>
          </Link>
        </div>

        {/* Centre — recherche */}
        <div className="flex min-w-0 flex-1 justify-center px-2 sm:px-6">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher un lot, un composant…"
              className="h-10 w-full rounded-full border border-2 shadow-sm border-slate-400 bg-slate-50/80 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-300 focus:border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200/60 sm:h-11"
              aria-label="Recherche globale"
            />
          </div>
        </div>

        {/* Droite — profil */}
        <div className="flex shrink-0 items-center">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={`flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:gap-2.5 sm:pr-3 ${
                menuOpen
                  ? 'border-slate-300 ring-2 ring-slate-200/80'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-600 text-xs font-bold text-white shadow-inner">
                {initials}
              </div>
              <div className="hidden min-w-0 text-left md:block">
                <p className="max-w-[120px] truncate text-sm font-semibold text-slate-900">
                  {prenom}
                </p>
                <p className="max-w-[120px] truncate text-[10px] text-slate-500">
                  {ROLE_LABELS[role]}
                </p>
              </div>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300 ${
                  menuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 origin-top-right overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 shadow-lg ring-1 ring-slate-900/5"
              >
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {prenom} {nom}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{email}</p>
                  <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
                <Link
                  href="/dashboard/profil"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="mx-1.5 mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                    <User2 className="h-4 w-4 text-slate-500" />
                  </span>
                  Mon Profil
                </Link>
                <div className="mx-3 my-1.5 border-t border-slate-100" />
                <button
                  type="button"
                  role="menuitem"
                  disabled={isPending}
                  onClick={handleSignOut}
                  className="mx-1.5 mb-1 flex w-[calc(100%-0.75rem)] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50">
                    <LogOut className="h-4 w-4" />
                  </span>
                  {isPending ? 'Déconnexion…' : 'Se déconnecter'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
