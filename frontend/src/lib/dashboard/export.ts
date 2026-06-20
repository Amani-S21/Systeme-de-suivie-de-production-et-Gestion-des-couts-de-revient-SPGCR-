import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Shared client-side export helpers.
 * - exportToCsv  → triggers a CSV download
 * - exportToPdf  → opens the browser print dialog (the table must be visible in the page)
 */

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return

  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v).replace(/"/g, '""')
    return /[",\n\r]/.test(s) ? `"${s}"` : s
  }

  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function visibleTableRows(): Record<string, unknown>[] {
  const table = Array.from(document.querySelectorAll('table')).find((item) => item.getClientRects().length > 0)
  if (!table) return []
  const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => String(cell.textContent || '').trim()).filter(Boolean)
  return Array.from(table.querySelectorAll('tbody tr')).map((row) => Object.fromEntries(
    Array.from(row.querySelectorAll('td')).slice(0, headers.length).map((cell, index) => [headers[index] || `Colonne ${index + 1}`, String(cell.textContent || '').replace(/\s+/g, ' ').trim()])
  )).filter((row) => Object.values(row).some(Boolean))
}

export function exportToPrint(title: string, suppliedRows?: Record<string, unknown>[]) {
  const rows = suppliedRows?.length ? suppliedRows : visibleTableRows()
  const headers = rows.length ? Object.keys(rows[0]) : ['Information']
  const body = rows.length
    ? rows.map((row) => headers.map((header) => formatPdfValue(row[header])))
    : [['Aucune donnée disponible pour la période sélectionnée.']]
  const orientation = headers.length > 6 ? 'landscape' : 'portrait'
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
  const now = new Date()
  const reportCode = `SPGCR-RPT-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const drawHeader = () => {
    doc.setFillColor(8, 32, 68)
    doc.rect(0, 0, pageWidth, 31, 'F')
    doc.setFillColor(49, 91, 232)
    doc.circle(16, 15.5, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('SPGCR', 28, 12)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text('Système de Pilotage et de Gestion du Coût de Revient', 28, 17)
    doc.text('Maison Aux Sources de Dieu · Unité industrielle Vin Ushindi', 28, 21.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('RAPPORT OFFICIEL', pageWidth - 14, 12, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.text(reportCode, pageWidth - 14, 17, { align: 'right' })
    doc.text(now.toLocaleString('fr-FR'), pageWidth - 14, 21.5, { align: 'right' })
  }

  drawHeader()
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(cleanReportTitle(title), 14, 42)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(100, 116, 139)
  doc.text(`${rows.length} enregistrement(s) · Données extraites de PostgreSQL via FastAPI`, 14, 47.5)
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 50.5, pageWidth - 14, 50.5)

  const foot = buildTotals(headers, rows)
  autoTable(doc, {
    head: [headers],
    body,
    foot: foot ? [foot] : undefined,
    startY: 55,
    margin: { top: 38, right: 14, bottom: 18, left: 14 },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: headers.length > 6 ? 6.5 : 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
      textColor: [51, 65, 85],
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 44, 82],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left',
      minCellHeight: 9,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    footStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) drawHeader()
    },
  })

  const totalPages = doc.getNumberOfPages()
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text('Document confidentiel · Usage interne MSD · Généré automatiquement par SPGCR', 14, pageHeight - 8)
    doc.text(`Page ${page} / ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }

  doc.setProperties({ title: cleanReportTitle(title), subject: 'Rapport SPGCR', author: 'SPGCR - Maison Aux Sources de Dieu', creator: 'SPGCR' })
  doc.save(`${slugify(title) || 'rapport-spgcr'}.pdf`)
}

function cleanReportTitle(title: string) {
  return title.replace(/\s*[—-]\s*SPGCR\s*$/i, '').trim()
}

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatPdfValue(value: unknown) {
  if (typeof value === 'number') return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  if (value == null || value === '') return '—'
  return String(value)
}

function buildTotals(headers: string[], rows: Record<string, unknown>[]) {
  if (!rows.length) return null
  const totalPattern = /(montant|valeur|quantité|quantite|stock|nombre|total)/i
  let hasTotal = false
  const totals = headers.map((header, index) => {
    if (index === 0) return 'TOTAL'
    if (!totalPattern.test(header)) return ''
    const values = rows.map((row) => Number(row[header])).filter(Number.isFinite)
    if (!values.length) return ''
    hasTotal = true
    return values.reduce((sum, value) => sum + value, 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
  })
  return hasTotal ? totals : null
}
