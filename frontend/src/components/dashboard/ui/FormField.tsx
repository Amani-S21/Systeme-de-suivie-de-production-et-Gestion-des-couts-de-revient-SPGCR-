import { inputBase } from '@/lib/dashboard/design'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  children?: React.ReactNode
  required?: boolean
}

export function FormField({ label, htmlFor, error, children, required }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

export function formInputClass(hasError?: boolean) {
  return `${inputBase} h-11 w-full ${hasError ? 'border-rose-300 ring-rose-100' : ''}`
}
