'use client'

import { useState } from 'react'
import type { AppRole } from '@/types/spgcr'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'
import DashboardNavSidebar from '@/components/dashboard/DashboardNavSidebar'

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
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  function handleSidebarToggle() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileSidebarOpen((o) => !o)
    } else {
      setDesktopSidebarOpen((open) => !open)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f7fb]">
      <div
        className="fixed inset-y-0 left-0 z-40 hidden w-3 cursor-pointer bg-[#082044] lg:block"
        onMouseEnter={() => setDesktopSidebarOpen(true)}
        aria-hidden
      />
      <DashboardNavSidebar
        role={role}
        collapsed={false}
        desktopOpen={desktopSidebarOpen}
        onDesktopClose={() => setDesktopSidebarOpen(false)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardTopbar
          prenom={prenom}
          nom={nom}
          role={role}
          email={email}
          onSidebarToggle={handleSidebarToggle}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <div className="mx-auto max-w-[1500px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
