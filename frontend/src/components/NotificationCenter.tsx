import { useEffect, useState } from 'react'
import { CheckCircle2, CircleX, X } from 'lucide-react'
import type { AppNotification } from '@/lib/notifications'

export default function NotificationCenter() {
  const [notification, setNotification] = useState<AppNotification | null>(null)

  useEffect(() => {
    let timer: number | undefined
    const show = (event: Event) => {
      const next = (event as CustomEvent<AppNotification>).detail
      window.clearTimeout(timer)
      setNotification(next)
      timer = window.setTimeout(() => setNotification(null), 5000)
    }

    window.addEventListener('spcr:notify', show)
    return () => {
      window.removeEventListener('spcr:notify', show)
      window.clearTimeout(timer)
    }
  }, [])

  if (!notification) return null

  const success = notification.kind === 'success'
  const Icon = success ? CheckCircle2 : CircleX

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-sm" role="status" aria-live="polite">
      <div className={`pointer-events-auto flex items-start gap-3 rounded-md border bg-white p-4 shadow-xl ${success ? 'border-emerald-200' : 'border-red-200'}`}>
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${success ? 'text-emerald-600' : 'text-red-600'}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${success ? 'text-emerald-800' : 'text-red-800'}`}>
            {success ? 'Action confirmée' : 'Action impossible'}
          </p>
          <p className="mt-0.5 break-words text-sm text-slate-600">{notification.message}</p>
        </div>
        <button type="button" onClick={() => setNotification(null)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer la notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

