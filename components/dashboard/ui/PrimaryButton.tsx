import { Loader2 } from 'lucide-react'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'outline'
}

export default function PrimaryButton({
  children,
  loading,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: PrimaryButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0'
  const variants = {
    primary: 'bg-slate-800 text-white hover:bg-slate-900',
    outline:
      'border border-slate-100 bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50',
  }

  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
