'use client'

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CHART_COLORS } from '@/lib/dashboard/constants'

interface Slice {
  name: string
  value: number
}

const PIE_COLORS = [
  CHART_COLORS.primaryLight,
  CHART_COLORS.accentSoft,
  CHART_COLORS.successSoft,
]

const PIE_COLORS_ACTIVE = [
  CHART_COLORS.primary,
  CHART_COLORS.accent,
  CHART_COLORS.success,
]

const tooltipStyle = {
  borderRadius: '6px',
  border: '1px solid #f1f5f9',
  fontSize: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

export default function CostBreakdownPie({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const isEmpty = total === 0

  const chartData = data.map((d) => ({
    name: d.name,
    value: isEmpty ? 1 : d.value,
    realValue: d.value,
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={isEmpty ? 0 : 2}
          dataKey="value"
          nameKey="name"
          stroke="#fff"
          strokeWidth={2}
        >
          {chartData.map((_, i) => (
            <Cell
              key={i}
              fill={isEmpty ? PIE_COLORS[i % PIE_COLORS.length] : PIE_COLORS_ACTIVE[i % PIE_COLORS_ACTIVE.length]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(_value, _name, item) => {
            const real = (item?.payload as { realValue?: number })?.realValue ?? 0
            return [`${Number(real).toFixed(2)} FCFA`, item?.name ?? '']
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
