'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Settings, X } from 'lucide-react'
import type { AppRole } from '@/types/spgcr'
import { getNavItemsForRole } from '@/lib/dashboard/navigation'

interface DashboardSidebarProps {
  role: AppRole
  collapsed: boolean
  mobileOpen: boolean
  onMobileClose: () => void
  onToggleCollapse: () => void
}

export default function DashboardSidebar({
  role,
  collapsed,
  mobileOpen,
  onMobileClose,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const navItems = getNavItemsForRole(role)

  const renderNav = (iconOnly: boolean) => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            title={iconOnly ? item.label : undefined}
            onClick={onMobileClose}
            className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
              iconOnly ? 'justify-center px-2' : ''
            } ${
              isActive
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-slate-800" />
            )}
            <Icon
              className={`h-4 w-4 shrink-0 ${
                isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-700'
              }`}
            />
            {!iconOnly && <span className="truncate leading-snug">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )

  const sidebarFooter = (iconOnly: boolean) => (
    <div className="border-t border-slate-100 p-2">
      <Link
        href="/"
        title={iconOnly ? 'Retour au site' : undefined}
        onClick={onMobileClose}
        className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-500 transition-all duration-300 hover:bg-slate-50 hover:text-slate-800 ${
          iconOnly ? 'justify-center px-2' : ''
        }`}
      >
        <Settings className="h-3.5 w-3.5 shrink-0" />
        {!iconOnly && <span>Retour au site</span>}
      </Link>
    </div>
  )

  const collapseToggle = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="absolute -right-3 top-0 z-50 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md transition-all duration-300 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-lg lg:flex"
      aria-label={collapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
    >
      {collapsed ? (
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      ) : (
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
      )}
    </button>
  )

  const desktopAside = (
    <div
      className={`relative hidden shrink-0 transition-[width] duration-300 lg:block ${
        collapsed ? 'w-[4.5rem]' : 'w-64'
      }`}
    >
      {collapseToggle}
      <aside className="flex h-full w-full flex-col border-r border-slate-200 bg-white shadow-[2px_0_8px_-2px_rgba(0,0,0,0.06)]">
        {renderNav(collapsed)}
        {sidebarFooter(collapsed)}
      </aside>
    </div>
  )

  const mobileDrawer = mobileOpen && (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
        onClick={onMobileClose}
        aria-hidden
      />
      <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
          <span className="text-sm font-bold tracking-tight text-slate-900">Navigation</span>
          <button
            type="button"
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-100 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {renderNav(false)}
        {sidebarFooter(false)}
      </aside>
    </div>
  )

  return (
    <>
      {desktopAside}
      {mobileDrawer}
    </>
  )
}
