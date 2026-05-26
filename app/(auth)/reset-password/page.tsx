'use client'

import { resetPasswordAction } from './actions'
import { useActionState } from 'react'
import { AlertCircle, Loader2, Save } from 'lucide-react'

type FormState = { error?: string }
const initialState: FormState = {}

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Nouveau Mot de Passe
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Définissez votre nouveau mot de passe pour accéder au portail
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200 dark:border-slate-800">
          
          {state?.error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800/30">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{state.error as string}</span>
            </div>
          )}

          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nouveau Mot de Passe
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirmer le Mot de Passe
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md shadow-sm placeholder-slate-400 dark:bg-slate-950 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer et Continuer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
