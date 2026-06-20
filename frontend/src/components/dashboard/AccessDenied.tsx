import { ShieldX } from 'lucide-react'
import Link from 'next/link'

export default function AccessDenied() {
  return <div className="mx-auto mt-12 max-w-lg rounded-md border border-red-100 bg-white p-8 text-center shadow-sm"><ShieldX className="mx-auto h-10 w-10 text-red-500" /><h1 className="mt-4 text-xl font-bold text-slate-900">Accès non autorisé</h1><p className="mt-2 text-sm text-slate-500">Votre rôle ne possède pas la permission nécessaire pour consulter cette section.</p><Link href="/dashboard" className="mt-6 inline-flex rounded-md bg-[#102544] px-4 py-2 text-sm font-bold text-white">Retour au tableau de bord</Link></div>
}
