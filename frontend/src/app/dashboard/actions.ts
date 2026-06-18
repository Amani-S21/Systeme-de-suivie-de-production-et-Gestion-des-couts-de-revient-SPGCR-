export async function signOut() {
  localStorage.removeItem('spcr_token')
  localStorage.removeItem('spcr_user')
  window.history.pushState({}, '', '/login')
  window.dispatchEvent(new PopStateEvent('popstate'))
}
