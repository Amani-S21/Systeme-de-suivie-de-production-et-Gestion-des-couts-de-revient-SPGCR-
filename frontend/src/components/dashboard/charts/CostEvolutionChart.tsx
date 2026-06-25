'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from '@/lib/dashboard/constants'

interface DataPoint {
  numeroLot: string
  coutTotal: number
  margeBrute: number
}

const tooltipStyle = {
  borderRadius: '6px',
  border: '1px solid #f1f5f9',
  fontSize: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

export default function CostEvolutionChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="numeroLot"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} FCFA`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, name) => [
            `${Number(value ?? 0).toFixed(2)} FCFA`,
            name === 'coutTotal' ? 'Coût de revient' : 'Marge brute',
          ]}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
        <Bar
          dataKey="coutTotal"
          name="Coût de revient total"
          fill={CHART_COLORS.primary}
          radius={[2, 2, 0, 0]}
        />
        <Bar
          dataKey="margeBrute"
          name="Marge brute estimée"
          fill={CHART_COLORS.success}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
