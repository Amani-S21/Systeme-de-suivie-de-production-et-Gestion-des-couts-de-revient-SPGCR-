import { useMemo } from 'react'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
}

function notifyNavigation() {
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function scrollToHash(hash: string) {
  window.setTimeout(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
          notifyNavigation()
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

export function useRouter() {
  return {
    push: (href: string) => {
      window.history.pushState({}, '', href)
      notifyNavigation()
    },
    refresh: () => window.dispatchEvent(new CustomEvent('spcr:refresh')),
    replace: (href: string) => {
      window.history.replaceState({}, '', href)
      notifyNavigation()
    },
  }
}

export function usePathname() {
  return window.location.pathname
}

export function useSearchParams() {
  const search = window.location.search
  return useMemo(() => new URLSearchParams(search), [search])
}

