'use client'

import { Download, FileText } from 'lucide-react'

interface ExportButtonsProps {
  onExportExcel: () => void
  onExportPdf: () => void
}

export default function ExportButtons({ onExportExcel, onExportPdf }: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onExportExcel}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
      >
        <Download className="h-3.5 w-3.5 text-emerald-600" />
        Excel
      </button>
      <button
        type="button"
        onClick={onExportPdf}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300"
      >
        <FileText className="h-3.5 w-3.5 text-rose-500" />
        PDF
      </button>
    </div>
  )
}
