'use client'

import { useTransition } from 'react'
import { ChevronRight, LogOut, Settings, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/dashboard/actions'
import { getNavItemsForRole } from '@/lib/dashboard/navigation'
import type { AppRole } from '@/types/spgcr'

interface Props {
  role: AppRole
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function DashboardNavSidebar({ role, collapsed, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const [isSigningOut, startTransition] = useTransition()
  const items = getNavItemsForRole(role)

  const content = (compact: boolean) => (
    <>
      <div className={`flex h-[112px] shrink-0 items-center border-b border-white/5 ${compact ? 'justify-center px-2' : 'gap-3 px-5'}`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center text-blue-400">
          <Settings className="h-11 w-11" strokeWidth={2.5} />
        </span>
        {!compact && (
          <div className="min-w-0 text-white">
            <div className="text-[28px] font-black leading-none">SPCR</div>
            <p className="mt-2 text-[11px] font-medium leading-[1.35] text-white/90">
              Suivi de Production et<br />Gestion des Coûts de Revient
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-2.5 py-5">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              title={compact ? item.label : undefined}
              onClick={onMobileClose}
              className={`group flex h-[50px] items-center rounded-md px-3 text-[15px] font-medium transition-all ${compact ? 'justify-center' : 'gap-3'} ${
                active
                  ? 'bg-gradient-to-r from-[#315be8] to-[#4858e8] text-white shadow-[0_6px_18px_rgba(47,91,232,0.28)]'
                  : 'text-white/90 hover:bg-white/8 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!compact && <span className="truncate">{item.label}</span>}
              {!compact && item.href !== '/dashboard' && <ChevronRight className="ml-auto h-4 w-4 text-white/90" />}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => startTransition(() => signOut())}
          title={compact ? 'Déconnexion' : undefined}
          className={`flex h-12 w-full items-center rounded-md text-white/90 transition-colors hover:bg-white/8 hover:text-white disabled:opacity-50 ${compact ? 'justify-center' : 'gap-3 px-2'}`}
        >
          <LogOut className="h-5 w-5" />
          {!compact && <span className="text-sm">{isSigningOut ? 'Déconnexion...' : 'Déconnexion'}</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className={`hidden h-screen shrink-0 flex-col bg-gradient-to-b from-[#082044] to-[#061a35] transition-[width] duration-300 lg:flex ${collapsed ? 'w-[76px]' : 'w-[270px]'}`}>
        {content(collapsed)}
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onMobileClose}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-gradient-to-b from-[#082044] to-[#061a35] shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button type="button" onClick={onMobileClose} className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white" aria-label="Fermer le menu">
          <X className="h-4 w-4" />
        </button>
        {content(false)}
      </aside>
    </>
  )
}
