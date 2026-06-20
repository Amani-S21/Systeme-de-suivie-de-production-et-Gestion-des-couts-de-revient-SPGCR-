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

function pdfAscii(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, ' ')
}

function pdfEscape(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function visibleTableRows(): Record<string, unknown>[] {
  const table = Array.from(document.querySelectorAll('table')).find((item) => item.getClientRects().length > 0)
  if (!table) return []
  const headers = Array.from(table.querySelectorAll('thead th')).map((cell) => pdfAscii(cell.textContent).trim()).filter(Boolean)
  return Array.from(table.querySelectorAll('tbody tr')).map((row) => Object.fromEntries(
    Array.from(row.querySelectorAll('td')).slice(0, headers.length).map((cell, index) => [headers[index] || `Colonne ${index + 1}`, pdfAscii(cell.textContent).trim()])
  )).filter((row) => Object.values(row).some(Boolean))
}

export function exportToPrint(title: string, suppliedRows?: Record<string, unknown>[]) {
  const rows = suppliedRows?.length ? suppliedRows : visibleTableRows()
  const lines = [pdfAscii(title), `Genere le ${new Date().toLocaleString('fr-FR')}`, '', ...rows.map((row, index) => `${index + 1}. ${Object.entries(row).map(([key, value]) => `${pdfAscii(key)}: ${pdfAscii(value)}`).join(' | ')}`)]
  if (!rows.length) lines.push('Aucune donnee disponible pour ce rapport.')
  const wrapped = lines.flatMap((line) => line.length <= 105 ? [line] : Array.from({ length: Math.ceil(line.length / 105) }, (_, index) => line.slice(index * 105, (index + 1) * 105)))
  const pages = Array.from({ length: Math.max(1, Math.ceil(wrapped.length / 50)) }, (_, index) => wrapped.slice(index * 50, (index + 1) * 50))
  const pageIds = pages.map((_, index) => 4 + index * 2)
  const objects: string[] = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
  pages.forEach((page, index) => {
    const pageId = pageIds[index]
    const contentId = pageId + 1
    const content = `BT /F1 9 Tf 40 800 Td 14 TL ${page.map((line) => `(${pdfEscape(line)}) Tj T*`).join(' ')} ET`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`
    objects[contentId] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
  })
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  for (let id = 1; id < objects.length; id += 1) { offsets[id] = pdf.length; pdf += `${id} 0 obj\n${objects[id]}\nendobj\n` }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  const blob = new Blob([pdf], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${pdfAscii(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rapport'}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
