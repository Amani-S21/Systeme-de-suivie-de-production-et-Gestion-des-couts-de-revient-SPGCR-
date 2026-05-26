'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { login, signup } from './actions'
import { Mail, Lock, User, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Home, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type AuthMode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [mode, setMode] = useState<AuthMode>('login')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // État dédié à la redirection sécurisée
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // États pour les champs contrôlés (Validation en temps réel)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // États de validation locale
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [isPasswordStrong, setIsPasswordStrong] = useState(false)

  // Validation dynamique
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsEmailValid(emailRegex.test(email))
  }, [email])

  useEffect(() => {
    setIsPasswordStrong(password.length >= 8)
  }, [password])

  // Redirection contrôlée et initialisée en toute sécurité après le rendu
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/dashboard')
      router.refresh()
    }
  }, [shouldRedirect, router])

  // Nettoyage lors des changements de mode
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
  }

  function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!isEmailValid) {
      setError("Le format de l'adresse email est invalide.")
      return
    }
    if (mode !== 'forgot' && !isPasswordStrong) {
      setError("Le mot de passe doit contenir au moins 8 caractères.")
      return
    }

    setLoading(true)
    const formData = new FormData(event.currentTarget)
    
    // Encapsulation dans startTransition pour stabiliser l'App Router avant le redirect
    startTransition(async () => {
      try {
        if (mode === 'login') {
          const res = await login(null, formData)
          if (res?.success) {
            setShowSuccessModal(true)
            setTimeout(() => setShouldRedirect(true), 2000)
          }
        } else if (mode === 'signup') {
          const res = await signup(null, formData)
          if (res?.success) {
            setShowSuccessModal(true)
            setTimeout(() => setShouldRedirect(true), 2000)
          }
        } else if (mode === 'forgot') {
          setSuccess('Si ce compte est enregistré, un e-mail de réinitialisation a été transmis.')
          setLoading(false)
        }
      } catch (err: any) {
        // LA FIX PRINCIPALE : Relayer l'erreur "NEXT_REDIRECT" que déclenche Server Actions
        if (err?.message === 'NEXT_REDIRECT' || err?.digest?.includes('NEXT_REDIRECT')) {
          setShouldRedirect(false) // Optionnel, on laisse Next.js faire son travail
          throw err
        }
        
        setError(err.message || 'Une erreur système est survenue.')
        setLoading(false)
      }
    })
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 font-sans bg-white">
      {/* SPLIT : haut slate-100, bas white */}
      <div className="absolute inset-0 h-[58vh] w-full bg-slate-100 z-0" />
      {/* HALO bleu clair — coin supérieur gauche */}
      <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[45%] bg-blue-200 blur-[120px] rounded-full opacity-30 pointer-events-none z-0" />
      {/* HALO bleu pastel — coin inférieur droit */}
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[40%] bg-blue-100 blur-[100px] rounded-full opacity-40 pointer-events-none z-0" />
      {/* GRILLE TECHNIQUE claire */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ef_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ef_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />
      {/* SÉPARATEUR HORIZONTAL du split — ligne lumineuse */}
      <div className="absolute top-[58vh] left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300/40 to-transparent z-0" />
      {/* REPÈRES ANGULAIRES clairs */}
      <div className="absolute top-8 left-8 w-5 h-5 border-t border-l border-blue-200 pointer-events-none z-0 hidden sm:block" />
      <div className="absolute top-8 right-8 w-5 h-5 border-t border-r border-blue-200 pointer-events-none z-0 hidden sm:block" />
      <div className="absolute bottom-8 left-8 w-5 h-5 border-b border-l border-blue-200 pointer-events-none z-0 hidden sm:block" />
      <div className="absolute bottom-8 right-8 w-5 h-5 border-b border-r border-blue-200 pointer-events-none z-0 hidden sm:block" />
      
      {/* Composant de formulaire centré et surélevé qui chevauche le split */}
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-slate-200/80 z-10 transition-all duration-300">
        
        {/* En-tête Institutionnel */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 tracking-wide border border-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            Environnement Sécurisé v1.0
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
            SPGCR
          </h2>
          <p className="mt-1.5 text-xs text-slate-500 font-medium uppercase tracking-wider">
            Suivi de Production & Gestion des Coûts de Revient
          </p>
        </div>

        {/* Sélecteur d'onglets asymétriques */}
        {mode !== 'forgot' && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/20'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Créer un compte
            </button>
          </div>
        )}

        {/* Notification d'États */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-100">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Corps du Formulaire */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Section Identité (Inscription uniquement) */}
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Prénom</label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
                    placeholder="Jean"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">Nom</label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    name="lastName"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
                    placeholder="Kambale"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Saisie de l'Adresse Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Adresse Email Professionnelle
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full rounded-xl border py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                  email.length > 0 
                    ? isEmailValid 
                      ? 'border-emerald-200 bg-emerald-50/10 focus:border-emerald-500 focus:ring-emerald-500' 
                      : 'border-rose-200 bg-rose-50/10 focus:border-rose-500 focus:ring-rose-500'
                    : 'border-slate-200 bg-slate-50/50 focus:border-slate-950 focus:ring-slate-950'
                }`}
                placeholder="nom@entreprise.com"
              />
              {email.length > 0 && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  {isEmailValid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Saisie du Mot de passe */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Mot de passe
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-bold text-slate-900 hover:underline"
                  >
                    Oublié ?
                  </button>
                )}
              </div>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full rounded-xl border py-2.5 pl-9 pr-14 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 ${
                    password.length > 0 
                      ? isPasswordStrong 
                        ? 'border-emerald-200 bg-emerald-50/10 focus:border-emerald-500 focus:ring-emerald-500' 
                        : 'border-slate-200 bg-slate-50/50 focus:border-slate-950 focus:ring-slate-950'
                      : 'border-slate-200 bg-slate-50/50 focus:border-slate-950 focus:ring-slate-950'
                  }`}
                  placeholder="••••••••"
                />
                {password.length > 0 && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                      title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="pointer-events-none flex items-center">
                      {isPasswordStrong ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {password.length}/8
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bouton de soumission principal */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || isPending}
              className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:bg-slate-400 transition-colors duration-150 shadow-lg shadow-slate-950/20"
            >
              {loading || isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connexion en cours...
                </span>
              ) : mode === 'login' ? (
                'Connexion'
              ) : mode === 'signup' ? (
                'Créer mon compte'
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </div>

          {/* Lien Header/Navigation de retour vers la landing page publique */}
          <div className="text-center pt-1">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-950 hover:bg-slate-50 transition-all duration-150"
            >
              <Home className="h-3.5 w-3.5" />
              Retour au site principal
            </Link>
          </div>

          {/* Bouton retour contextuel pour mot de passe oublié */}
          {mode === 'forgot' && (
            <div className="text-center pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-950 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à l'écran de connexion
              </button>
            </div>
          )}
        </form>

        {/* Pied de page académique épuré */}
        <div className="border-t border-slate-100 pt-4 text-center">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Travail de Fin de Cycle — ISIG Goma
          </p>
        </div>
      </div>
      {/* Modale de succès */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-2xl bg-white p-8 shadow-2xl max-w-sm w-full mx-4 text-center space-y-4 border border-slate-100">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Connexion réussie !</h3>
            <p className="text-sm text-slate-500">
              Vous allez être redirigé vers votre tableau de bord...
            </p>
            <div className="pt-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}