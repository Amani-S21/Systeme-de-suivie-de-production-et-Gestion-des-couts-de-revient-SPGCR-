import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
}

function scrollToHash(hash: string) {
  if (!hash) {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 0)
    return
  }
  window.setTimeout(() => {
    const target = document.querySelector(hash)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 0)
}

export default function Link({ href, children, onClick, ...props }: LinkProps) {
  return (
    <a
      href={href}
      onClick={(event) => {
        if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && href.startsWith('/')) {
          event.preventDefault()
          window.history.pushState({}, '', href)
          window.dispatchEvent(new PopStateEvent('popstate'))
          scrollToHash(new URL(href, window.location.origin).hash)
        }
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </a>
  )
}
