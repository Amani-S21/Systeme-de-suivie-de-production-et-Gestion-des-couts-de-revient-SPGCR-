import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function AttenteValidationPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-amber-500">
          <ShieldAlert className="w-16 h-16" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Compte en attente
        </h2>
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-sm sm:rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
            <p className="text-slate-600 dark:text-slate-400">
              Votre compte a bien été créé, mais il doit d&apos;abord être validé par un Administrateur ({' '}
              <span className="font-semibold">actif = false</span> ).
            </p>
            <p className="text-slate-600 dark:text-slate-400">
              Veuillez contacter le responsable de production ou la direction MSF pour faire activer vos droits d&apos;accès au système.
            </p>
            
            <div className="pt-6">
              <Link 
                href="/login" 
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                &larr; Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
