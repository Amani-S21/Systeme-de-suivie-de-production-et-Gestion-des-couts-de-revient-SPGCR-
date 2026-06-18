export function useRouter() {
  return {
    push: (href: string) => {
      window.history.pushState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
    refresh: () => window.dispatchEvent(new CustomEvent('spcr:refresh')),
    replace: (href: string) => {
      window.history.replaceState({}, '', href)
      window.dispatchEvent(new PopStateEvent('popstate'))
    },
  }
}

export function usePathname() {
  return window.location.pathname
}

export function useSearchParams() {
  return new URLSearchParams(window.location.search)
}

export function redirect(href: string): never {
  window.location.href = href
  throw new Error(`Redirected to ${href}`)
}
