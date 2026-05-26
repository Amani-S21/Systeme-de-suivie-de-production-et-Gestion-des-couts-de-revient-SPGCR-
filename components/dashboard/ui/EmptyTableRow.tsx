interface EmptyTableRowProps {
  colSpan: number
  message?: string
}

export default function EmptyTableRow({
  colSpan,
  message = 'Aucune donnée pour le moment',
}: EmptyTableRowProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-5 py-10 text-center text-sm text-slate-400"
      >
        {message}
      </td>
    </tr>
  )
}
