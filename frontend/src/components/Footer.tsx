import Link from 'next/link'
import { Server, Lock, Cpu, BarChart2, ArrowRight, ShieldCheck, Activity } from 'lucide-react'

// ─────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────
const guarantees = [
  {
    icon: Lock,
    label: 'Chiffrement Terminal',
    sub: 'Protocole TLS 1.3 actif',
    accent: true,
  },
  {
    icon: Server,
    label: 'Base de Données Locale',
    sub: 'Synchro hors-ligne active',
    accent: false,
  },
  {
    icon: Cpu,
    label: 'Noyau de Calcul BOM',
    sub: 'Précision certifiée 99.9 %',
    accent: false,
  },
  {
    icon: Activity,
    label: 'Statut Écosystème',
    sub: 'Systèmes opérationnels',
    ping: true,
    accent: false,
  },
]

const footerLinks = [
  { label: 'Confidentialité',     href: '#' },
  { label: "Conditions d'accès",  href: '#' },
  { label: 'Documentation',       href: '#' },
]

const navCols = [
  {
    title: 'Plateforme',
    links: [
      { label: 'Fonctionnement',  href: '/#workflow' },
      { label: 'Fonctionnalités', href: '/#fonctionnalites' },
      { label: 'FAQ',             href: '/#faq' },
    ],
  },
  {
    title: 'Accès',
    links: [
      { label: 'Connexion',         href: '/login' },
      { label: 'Créer un compte',   href: '/login' },
      { label: 'Mot de passe oublié', href: '/login' },
    ],
  },
  {
    title: 'Institutionnel',
    links: [
      { label: 'ISIG Goma',                  href: '#' },
      { label: 'Maison Aux Sources de Dieu', href: '#' },
      { label: 'Contact',                    href: '/#contact' },
    ],
  },
]

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────
export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 font-sans mt-auto selection:bg-indigo-500">

      {/* ═══════════════════════════════════════════
          BANDE GARANTIES TECHNIQUES
      ═══════════════════════════════════════════ */}
      <div className="border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200">
          {guarantees.map((g) => (
            <div
              key={g.label}
              className="group bg-white px-6 py-6 flex items-center gap-4 hover:bg-slate-50 transition-colors duration-200 cursor-default"
            >
              <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 border transition-colors duration-200 ${
                g.accent
                  ? 'bg-indigo-50 border-indigo-100 group-hover:bg-indigo-100'
                  : 'bg-slate-100 border-slate-200 group-hover:bg-slate-200'
              }`}>
                {g.ping ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                ) : (
                  <g.icon className={`w-4 h-4 ${g.accent ? 'text-indigo-600' : 'text-slate-500'}`} />
                )}
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                  {g.label}
                </p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{g.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CORPS PRINCIPAL
      ═══════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

        {/* ── Colonne Marque (lg:col-span-2) ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-950 flex items-center justify-center flex-shrink-0">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div className="leading-none">
              <div className="text-[14px] font-black uppercase tracking-[0.15em] text-slate-950 italic">SPGCR</div>
              <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Coût de Revient</div>
            </div>
          </div>

          {/* Nom complet */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-1">
              Système de Pilotage et de Gestion du Coût de Revient
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-medium max-w-xs">
              Automatisation de l'analyse des marges brutes et numérisation
              des flux physiques de production. Suivi rigoureux des matières
              premières, de la main-d'œuvre et des charges indirectes.
              Calcul BOM fiabilisé en temps réel.
            </p>
          </div>

          {/* Badge sécurité */}
          <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-slate-50">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Accès restreint au personnel MSD
            </span>
          </div>

          {/* CTA connexion */}
          <Link
            href="/login"
            className="group inline-flex items-center gap-2.5 px-5 py-3 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest rounded-md hover:bg-indigo-600 transition-colors duration-300 active:scale-[0.98]"
          >
            Connexion Opérateur
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* ── Colonnes Nav (lg:col-span-3) ── */}
        {navCols.map((col) => (
          <div key={col.title} className="space-y-4">
            <h4 className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 pb-2 border-b border-slate-100">
              {col.title}
            </h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-colors duration-150 uppercase tracking-wider"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════
          BARRE INFÉRIEURE
      ═══════════════════════════════════════════ */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">

          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center sm:text-left">
            © {new Date().getFullYear()} — Projet Tutoré ·{' '}
            <span className="text-slate-700">ISIG Goma</span>
            {' '}·{' '}
            <span className="text-slate-700">Maison Aux Sources de Dieu</span>
            {' '}(Vin Ushindi)
          </p>

          <div className="flex items-center gap-5">
            {footerLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors duration-150"
              >
                {l.label}
              </a>
            ))}
          </div>

        </div>
      </div>

    </footer>
  )
}