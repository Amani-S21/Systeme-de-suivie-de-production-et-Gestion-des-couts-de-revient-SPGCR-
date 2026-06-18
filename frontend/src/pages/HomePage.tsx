'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, ChevronRight, ShieldCheck,
  TrendingUp, Package, Clock, BarChart2, CheckCircle,
  AlertCircle, Activity, Database, Layers, Lock, ChevronDown
} from 'lucide-react'

// ─────────────────────────────────────────────
// ANIMATIONS UTILITAIRES
// ─────────────────────────────────────────────

const FadeIn = ({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// COMPTEUR ANIMÉ
// ─────────────────────────────────────────────

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1600
    const step = 16
    const increment = target / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, step)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>
}

// ─────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────

const steps = [
  {
    num: '01',
    icon: Lock,
    title: 'Profil Industriel',
    desc: 'Inscription sécurisée et configuration des rôles opérateurs selon la hiérarchie de production.',
  },
  {
    num: '02',
    icon: ShieldCheck,
    title: 'Validation Admin',
    desc: 'Audit des accès par les responsables MSD pour garantir l\'intégrité des données d\'usine.',
  },
  {
    num: '03',
    icon: Database,
    title: 'Connexion Nexus',
    desc: 'Intégration à l\'écosystème de production en temps réel avec synchronisation des flux.',
  },
  {
    num: '04',
    icon: BarChart2,
    title: 'Pilotage des Flux',
    desc: 'Automatisation du calcul des coûts de revient et génération de rapports analytiques.',
  },
]

const metrics = [
  { label: 'Précision calcul coût', value: 99, suffix: '%', icon: TrendingUp, color: 'text-indigo-600' },
  { label: 'Références BOM gérées', value: 1240, suffix: '+', icon: Package, color: 'text-slate-700' },
  { label: 'Sync. temps réel (ms)', value: 340, suffix: '', icon: Clock, color: 'text-slate-700' },
  { label: 'Rapports générés/mois', value: 96, suffix: '', icon: BarChart2, color: 'text-indigo-600' },
]

const features = [
  {
    icon: Layers,
    title: 'Nomenclature BOM Intégrée',
    desc: 'Goutez vos gammes de fabrication avec une arborescence multiniveaux. Matières premières, semi-finis et produits finis reliés en un référentiel unique.',
    badge: 'Production',
  },
  {
    icon: Activity,
    title: 'Coût de Revient en Temps Réel',
    desc: 'Agrégation automatique des charges directes (matières, main-d\'œuvre) et indirectes (frais généraux) selon les sections analytiques configurées.',
    badge: 'Finance',
  },
  {
    icon: Database,
    title: 'Traçabilité des Lots',
    desc: 'Chaque lot de Vin Ushindi est tracé de la cuve au conditionnement. Historique complet pour les audits qualité et contrôles réglementaires.',
    badge: 'Qualité',
  },
  {
    icon: BarChart2,
    title: 'Tableau de Bord Analytique',
    desc: 'Visualisations claires des marges brutes, écarts budgétaires et tendances de consommation pour une prise de décision éclairée.',
    badge: 'Analyse',
  },
]

const faqs = [
  {
    q: 'Comment est calculé le coût de revient ?',
    a: "Le système agrège automatiquement le coût des matières premières, la main-d'œuvre directe et les charges indirectes configurées dans la nomenclature (BOM). Chaque composante est pondérée selon les taux d'utilisation réels saisis par les opérateurs.",
  },
  {
    q: 'Fonctionnement en mode hors-ligne ?',
    a: "Une base de données locale synchronise vos saisies dès que la connexion au cœur de l'usine est rétablie. Aucune donnée n'est perdue lors d'une interruption réseau.",
  },
  {
    q: "Qui peut valider un nouveau compte opérateur ?",
    a: 'Seuls les responsables habilités de la Maison Aux Sources de Dieu valident les nouveaux comptes. Cette procédure garantit une sécurité maximale et une traçabilité complète des accès.',
  },
  {
    q: 'Le système est-il compatible avec les imprimantes de rapports ?',
    a: 'Oui, chaque rapport analytique peut être exporté en PDF structuré ou imprimé directement depuis l\'interface. Les formats sont optimisés pour les formats A4 standard.',
  },
]

// ─────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const containerRef = useRef(null)

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-slate-50 text-slate-900 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white"
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
          @keyframes shimmer { 100% { transform: translateX(100%); } }
          .animate-shimmer { animation: shimmer 1.5s infinite; }
          @keyframes subtle-pulse-zoom { 0%,100%{transform:scale(1.02)} 50%{transform:scale(1.08)} }
          .animate-pulse-zoom { animation: subtle-pulse-zoom 12s ease-in-out infinite; }
          @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
          .animate-blink { animation: blink 1.2s step-end infinite; }
          .font-mono-ibm { font-family: 'IBM Plex Mono', monospace; }
        `
      }} />

      {/* BRUIT SUBTIL */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.012] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ══════════════════════════════════════════
          1. HERO
      ══════════════════════════════════════════ */}
      {(() => {
        const HeroReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
          <div className="relative overflow-hidden" style={{ paddingBottom: '0.12em', paddingTop: '0.05em' }}>
            <motion.span
              initial={{ y: '105%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              {children}
            </motion.span>
          </div>
        )

        return (
          <section className="relative min-h-screen flex flex-col justify-center items-center px-6 py-24 overflow-hidden border-b border-slate-200">

            {/* Halos fond */}
            <div className="absolute top-[-8%] left-[-5%] w-[40%] h-[40%] bg-indigo-100 blur-[140px] rounded-full opacity-60 pointer-events-none" />
            <div className="absolute bottom-[-8%] right-[-5%] w-[40%] h-[40%] bg-blue-50 blur-[140px] rounded-full opacity-50 pointer-events-none" />

            {/* Grille technique */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            {/* Repères angulaires */}
            {[
              'top-10 left-10 border-t border-l',
              'top-10 right-10 border-t border-r',
              'bottom-10 left-10 border-b border-l',
              'bottom-10 right-10 border-b border-r',
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 ${cls} border-slate-300 pointer-events-none hidden sm:block`} />
            ))}

            {/* Indicateur système */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-md border border-slate-200 bg-white text-[10px] font-bold tracking-[0.2em] uppercase text-indigo-600 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              Système Opérationnel — Vin Ushindi · MSD
            </motion.div>

            <div className="max-w-5xl w-full z-10 text-center">

              {/* ── TITRE PRINCIPAL ── */}
              <h1 className="text-[11vw] sm:text-[7vw] font-black leading-[0.9] tracking-tighter uppercase text-slate-950 mb-8">
                <HeroReveal delay={0.1}>
                  Piloter la production.
                </HeroReveal>
                <HeroReveal delay={0.25}>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-slate-700 to-indigo-800">
                    Maîtriser le revient.
                  </span>
                </HeroReveal>
              </h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="max-w-lg mx-auto text-slate-500 text-sm sm:text-[15px] font-medium leading-relaxed mb-10"
              >
                Plateforme industrielle de gestion du coût de revient pour la{' '}
                <span className="text-slate-800 font-semibold">Maison Aux Sources de Dieu</span>.
                Numérisation des flux physiques, automatisation des marges brutes, traçabilité totale.
              </motion.p>

              {/* Diagnostic Système */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, duration: 0.8 }}
                className="max-w-md mx-auto mb-10 bg-slate-950 rounded-md border border-slate-700 text-left overflow-hidden shadow-lg"
              >
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                    SPGCR · Diagnostic Système
                  </span>
                </div>
                <div className="px-4 py-3 space-y-1.5 font-mono-ibm text-[11px]">
                  {[
                    { label: 'MODULE BOM',        status: 'ACTIF',        ok: true },
                    { label: 'CALCUL COÛT',       status: 'OPÉRATIONNEL', ok: true },
                    { label: 'SYNC PRODUCTION',   status: 'EN LIGNE',     ok: true },
                    { label: 'AUDIT TRAÇABILITÉ', status: 'VALIDÉ',       ok: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between">
                      <span className="text-slate-400">› {row.label}</span>
                      <span className={`font-bold flex items-center gap-1 ${row.ok ? 'text-green-400' : 'text-red-400'}`}>
                        {row.ok
                          ? <CheckCircle className="w-3 h-3" />
                          : <AlertCircle className="w-3 h-3" />}
                        {row.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTA Boutons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.78 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link
                  href="/login"
                  className="group relative px-8 py-4 bg-slate-950 text-white font-black uppercase text-[11px] tracking-widest rounded-md overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Connexion Opérateur
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </span>
                </Link>
                <a
                  href="#fonctionnalites"
                  className="px-8 py-4 border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all duration-200 font-black uppercase text-[11px] tracking-widest rounded-md active:scale-[0.98]"
                >
                  Découvrir le système
                </a>
              </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2.2 }}
              className="absolute bottom-8 right-6 flex flex-col items-center gap-2 opacity-60 select-none pointer-events-none"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-slate-400">Défiler</span>
              <div className="w-[1px] h-12 bg-gradient-to-b from-indigo-600 to-transparent" />
            </motion.div>
          </section>
        )
      })()}

      {/* ══════════════════════════════════════════
          2. BANDE MÉTRIQUES
      ══════════════════════════════════════════ */}
      <section className="py-12 bg-white border-b border-slate-200 rounded-full shadow-2xl my-4 mx-2">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
          {metrics.map((m, i) => (
            <FadeIn key={i} delay={i * 0.08} className="bg-white px-8 py-8 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <m.icon className={`w-4 h-4 ${m.color}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{m.label}</span>
              </div>
              <div className={`text-4xl font-black tracking-tight font-mono-ibm ${m.color}`}>
                <AnimatedCounter target={m.value} suffix={m.suffix} />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. WORKFLOW (MARQUEE)
      ══════════════════════════════════════════ */}
      <section id="workflow" className="py-28 bg-slate-50 overflow-hidden border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 mb-14">
          <FadeIn>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] block mb-2">Processus d'intégration</span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950">
              Comment ça fonctionne ?
            </h2>
          </FadeIn>
        </div>

        <div className="flex w-full overflow-hidden relative before:absolute before:left-0 before:top-0 before:z-20 before:h-full before:w-24 before:bg-gradient-to-r before:from-slate-50 before:to-transparent after:absolute after:right-0 after:top-0 after:z-20 after:h-full after:w-24 after:bg-gradient-to-l after:from-slate-50 after:to-transparent">
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            className="flex items-stretch gap-6 py-4 pr-6 whitespace-nowrap hover:[animation-play-state:paused]"
          >
            {[...steps, ...steps].map((step, i) => (
              <div key={i} className="flex items-center gap-6 shrink-0">
                <div className="w-[300px] sm:w-[340px] p-8 rounded-md bg-white border border-slate-200 space-y-5 hover:border-indigo-300 hover:shadow-[4px_4px_0_0_rgba(99,102,241,0.12)] transition-all duration-300 group cursor-default">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-md bg-slate-100 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center transition-colors duration-300">
                      <step.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-300" />
                    </div>
                    <span className="text-3xl font-black text-slate-100 group-hover:text-indigo-100 font-mono-ibm transition-colors duration-300">{step.num}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider whitespace-normal">{step.title}</h3>
                  <p className="text-[12px] text-slate-500 leading-relaxed whitespace-normal font-medium">{step.desc}</p>
                </div>
                <div className="text-slate-300 pointer-events-none flex-shrink-0">
                  <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          4. FONCTIONNALITÉS CLÉS
      ══════════════════════════════════════════ */}
      <section id="fonctionnalites" className="py-28 px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-16">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] block mb-2">Capacités Système</span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 leading-none">
              Un outil pensé<br />pour l'industrie.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.1} className="bg-white p-8 flex flex-col gap-5 group hover:bg-slate-50 transition-colors duration-200 cursor-default">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md bg-slate-100 group-hover:bg-indigo-50 border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center transition-all duration-300">
                    <f.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors duration-300" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 border border-slate-200 px-2 py-1 rounded-sm">
                    {f.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wide leading-tight">{f.title}</h3>
                <p className="text-[12px] text-slate-500 leading-relaxed font-medium flex-1">{f.desc}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>En savoir plus</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. SECTION VISION / CITATION
      ══════════════════════════════════════════ */}
      <section className="py-28 px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] block mb-4">Vision & Rigueur</span>
              <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 leading-none mb-8">
                Zéro Papier.<br />Zéro Latence.<br />
                <span className="text-indigo-600">Traçabilité totale.</span>
              </h3>
              <div className="space-y-3">
                {[
                  'Calcul automatique des marges brutes',
                  'Nomenclature BOM multiniveaux',
                  'Rapports PDF certifiables',
                  'Accès contrôlé par rôle opérateur',
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="relative bg-white border border-slate-200 p-8 rounded-md shadow-sm">
                {/* Accent indigo */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-600 to-transparent rounded-t-md" />
                <div className="mb-6 text-4xl text-indigo-200 font-black leading-none select-none">"</div>
                <p className="text-slate-700 text-[15px] leading-relaxed font-medium italic mb-8">
                  La traçabilité n'est plus une option, c'est le socle de notre vérité financière. Le SPGCR nous permet
                  d'automatiser l'analyse des marges et de sécuriser chaque étape de notre chaîne de valeur.
                </p>
                <div className="border-t border-slate-100 pt-5 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[10px] font-black">MSD</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-slate-900">Direction MSD</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Audit & Contrôle de Gestion</div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          6. FAQ
      ══════════════════════════════════════════ */}
      <section id="faq" className="py-28 px-6 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="mb-14">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.25em] block mb-2">Support</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-950">Questions fréquentes</h2>
          </FadeIn>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, i) => (
              <div key={i} className="py-2">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full py-6 flex items-center justify-between text-left group gap-4 focus:outline-none"
                >
                  <span className="text-sm font-bold uppercase tracking-wide text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown 
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
                      activeFaq === i ? 'rotate-180 text-indigo-600' : ''
                    }`} 
                  />
                </button>
                <AnimatePresence initial={false}>
                  {activeFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
