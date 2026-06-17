'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CHART_COLORS } from '@/lib/dashboard/constants'

interface DataPoint {
  name: string
  stock: number
  unite: string
}

const tooltipStyle = {
  borderRadius: '6px',
  border: '1px solid #f1f5f9',
  fontSize: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
}

export default function StockBarChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={100}
          tick={{ fontSize: 10, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value, _name, props) => {
            const payload = props?.payload as DataPoint | undefined
            return [`${Number(value ?? 0)} ${payload?.unite ?? ''}`, 'Stock actuel']
          }}
        />
        <Bar dataKey="stock" fill={CHART_COLORS.primaryLight} radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
