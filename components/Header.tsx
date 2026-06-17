'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowRight, ShieldCheck, BarChart2, ChevronRight, LogOut, User2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  admin_msd: 'Administrateur',
  responsable_production: 'Responsable Production',
  operateur_usine: 'Opérateur',
}

const navLinks = [
  { label: 'Accueil',         href: '/' },
  { label: 'Fonctionnement',  href: '/#workflow' },
  { label: 'Fonctionnalités', href: '/#fonctionnalites' },
  { label: 'Contact',         href: '/#contact' },
]

type Props = {
  user: { email: string } | null
  profile: { nom: string; prenom: string; role: string } | null
}

export default function Header({ user, profile }: Props) {
  const [isOpen, setIsOpen]         = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch('/api/auth/signout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setIsOpen(false) }, [pathname])

  return (
    <>
      {/* ═══════════════════════════════════════════
          BANDE STATUT SYSTÈME — desktop uniquement
      ═══════════════════════════════════════════ */}
      <div className="hidden sm:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 h-8 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
              Systèmes opérationnels
            </span>
          </div>
          <span className="text-slate-700 text-[9px] select-none">|</span>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.15em]">
            Vin Ushindi · Maison Aux Sources de Dieu
          </span>
        </div>
        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
          ISIG Goma · TFC {new Date().getFullYear()}
        </span>
      </div>

      {/* ═══════════════════════════════════════════
          BARRE PRINCIPALE
      ═══════════════════════════════════════════ */}
      <header
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-[0.16,1,0.3,1]
          sm:top-8
          top-0
          ${isScrolled
            ? 'sm:mx-6 sm:mt-2 bg-white/92 backdrop-blur-md border border-slate-200 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.10)] sm:rounded-md'
            : 'bg-white border-b border-slate-200'
          }`}
      >
        <div className={`px-5 sm:px-6 flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'}`}>

          {/* ── LOGO ── */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-7 h-7 rounded-md bg-slate-950 group-hover:bg-indigo-600 transition-colors duration-300 flex items-center justify-center">
              <BarChart2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-black uppercase tracking-[0.15em] text-slate-950 italic">
                SPGCR
              </div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                Coût de Revient
              </div>
            </div>
          </Link>

          {/* ── NAV DESKTOP ── */}
          <nav className="hidden md:flex items-center">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative px-4 py-5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 group ${
                    isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 inset-x-0 h-[2px] bg-indigo-600 transition-transform duration-200 origin-left ${
                    isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                  }`} />
                </Link>
              )
            })}
          </nav>

          {/* ── ACTIONS DROITE ── */}
          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {user ? (
              // CONNECTÉ : affichage du profil + déconnexion
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50">
                  <User2 className="w-3 h-3 text-indigo-600 flex-shrink-0" />
                  <div className="leading-tight">
                    <div className="text-[10px] font-black text-slate-800">
                      {profile ? `${profile.prenom} ${profile.nom}` : user.email}
                    </div>
                    {profile && (
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {ROLE_LABELS[profile.role] ?? profile.role}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="group flex items-center gap-2 px-4 py-2 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest rounded-md hover:bg-rose-600 transition-colors duration-200 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Déconnexion
                </button>
              </>
            ) : (
              // NON CONNECTÉ : badge sécurité + bouton connexion
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50">
                  <ShieldCheck className="w-3 h-3 text-indigo-600" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Accès sécurisé
                  </span>
                </div>
                <Link
                  href="/login"
                  className="group relative flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest rounded-md overflow-hidden transition-all duration-300 hover:bg-indigo-600 shadow-sm active:scale-[0.97]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <span className="relative z-10">Connexion</span>
                  <ArrowRight className="relative z-10 w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </>
            )}
          </div>

          {/* ── BURGER MOBILE ── */}
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le menu"
            className="md:hidden flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 rounded-md text-slate-700 hover:border-slate-300 transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

        </div>
      </header>

      {/* ═══════════════════════════════════════════
          MENU MOBILE FULLSCREEN
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 2.5rem) 2.5rem)' }}
            animate={{ opacity: 1, clipPath: 'circle(160% at calc(100% - 2.5rem) 2.5rem)' }}
            exit={{ opacity: 0, clipPath: 'circle(0% at calc(100% - 2.5rem) 2.5rem)' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-50 bg-white flex flex-col md:hidden overflow-hidden"
          >
            {/* Grille déco */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            {/* Halo */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-indigo-50 blur-[100px] opacity-80 rounded-full pointer-events-none" />

            {/* En-tête interne */}
            <div className="relative z-10 flex items-center justify-between px-6 h-16 border-b border-slate-100 flex-shrink-0">
              <Link href="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-950 flex items-center justify-center">
                  <BarChart2 className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[13px] font-black uppercase tracking-[0.15em] italic text-slate-950">
                  SPGCR
                </span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Fermer"
                className="flex items-center justify-center w-9 h-9 border border-slate-200 bg-slate-50 rounded-md text-slate-700 hover:border-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Liens navigation */}
            <nav className="relative z-10 flex flex-col flex-1 justify-center px-8 space-y-1">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between py-4 border-b border-slate-100 group"
                  >
                    <span className="text-4xl font-black uppercase tracking-tighter text-slate-950 group-hover:text-indigo-600 transition-colors duration-200">
                      {link.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Pied mobile */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 px-6 pb-10 pt-4 space-y-4 border-t border-slate-100 flex-shrink-0"
            >
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-rose-600 text-white font-black uppercase text-[11px] tracking-widest rounded-md hover:bg-rose-700 transition-colors duration-300 active:scale-[0.98]"
                >
                  <LogOut className="w-4 h-4" /> Déconnexion
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 w-full py-4 bg-slate-950 text-white font-black uppercase text-[11px] tracking-widest rounded-md hover:bg-indigo-600 transition-colors duration-300 active:scale-[0.98]"
                >
                  Connexion Opérateur <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              <div className="flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                Accès sécurisé · Vin Ushindi · ISIG Goma
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPACER — Mobile: h-16 | Desktop: bande 32px + barre 64px = 96px */}
      <div className="h-16 sm:h-24" />
    </>
  )
}