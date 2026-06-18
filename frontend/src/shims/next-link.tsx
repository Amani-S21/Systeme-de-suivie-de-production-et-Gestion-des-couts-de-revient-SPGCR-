import type { AnchorHTMLAttributes, ReactNode } from 'react'

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
  children: ReactNode
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
        }
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </a>
  )
}
