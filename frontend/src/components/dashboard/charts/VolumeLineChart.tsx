'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from '@/lib/dashboard/constants'

interface DataPoint {
  month: string
  litres: number
}

const tooltipStyle = {
  borderRadius: '6px',
  border: '1px solid #f1f5f9',
  fontSize: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

export default function VolumeLineChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.25} />
            <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} L`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value) => [`${Number(value ?? 0)} L`, 'Volume produit']}
        />
        <Area
          type="monotone"
          dataKey="litres"
          stroke={CHART_COLORS.accent}
          strokeWidth={2}
          fill="url(#volumeGradient)"
          dot={{ r: 3, fill: CHART_COLORS.accent, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: CHART_COLORS.accent }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
