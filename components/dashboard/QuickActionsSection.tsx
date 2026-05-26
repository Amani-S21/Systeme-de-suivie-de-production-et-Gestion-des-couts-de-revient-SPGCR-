import { fetchQuickActionsOptions } from '@/lib/dashboard/quick-actions-queries'
import QuickActionsGrid from '@/components/dashboard/QuickActionsGrid'
import type { AppRole } from '@/types/spgcr'

interface QuickActionsSectionProps {
  role: AppRole
  userId: string
}

export default async function QuickActionsSection({
  role,
  userId,
}: QuickActionsSectionProps) {
  const { produitsFinis, operateurs, composants, activeLot } =
    await fetchQuickActionsOptions(userId)

  return (
    <QuickActionsGrid
      role={role}
      currentUserId={userId}
      produitsFinis={produitsFinis}
      operateurs={operateurs}
      composants={composants}
      activeLot={activeLot}
    />
  )
}
