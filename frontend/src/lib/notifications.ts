export type NotificationKind = 'success' | 'error'

export interface AppNotification {
  kind: NotificationKind
  message: string
}

export function notify(kind: NotificationKind, message: string) {
  window.dispatchEvent(
    new CustomEvent<AppNotification>('spcr:notify', {
      detail: { kind, message },
    }),
  )
}

