'use client'

import { useState } from 'react'
import type { AppRole } from '@/types/spgcr'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar'
import DashboardMiniFooter from '@/components/dashboard/DashboardMiniFooter'

interface DashboardShellProps {
  role: AppRole
  prenom: string
  nom: string
  email: string
  children: React.ReactNode
}

export default function DashboardShell({
  role,
  prenom,
  nom,
  email,
  children,
}: DashboardShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function handleSidebarToggle() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((o) => !o)
    } else {
      setSidebarCollapsed((c) => !c)
    }
  }

  function handleCollapseToggle() {
    setSidebarCollapsed((c) => !c)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <DashboardHeader
        prenom={prenom}
        nom={nom}
        role={role}
        email={email}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
      />

      <div className="flex min-h-0 flex-1">
        <DashboardSidebar
          role={role}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
          onToggleCollapse={handleCollapseToggle}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
          <DashboardMiniFooter />
        </div>
      </div>
    </div>
  )
}
