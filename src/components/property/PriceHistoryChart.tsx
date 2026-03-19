'use client'
// src/components/property/PriceHistoryChart.tsx
// Price history line chart using recharts — shows past sold/listed prices from Repliers history
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PriceEvent {
  listDate?: string
  listPrice?: number
  soldPrice?: number
  event?: string
}

interface PriceHistoryChartProps {
  history: PriceEvent[]
  currentPrice: number
}

export function PriceHistoryChart({ history, currentPrice }: PriceHistoryChartProps) {
  // Build chart data from history events + current listing price
  const chartData = [
    ...history
      .filter((h) => h.listPrice || h.soldPrice)
      .map((h) => ({
        date: h.listDate
          ? new Date(h.listDate).toLocaleDateString('en-CA', { year: '2-digit', month: 'short' })
          : '—',
        price: h.soldPrice ?? h.listPrice ?? 0,
        event: h.event ?? (h.soldPrice ? 'Sold' : 'Listed'),
      })),
    { date: 'Now', price: currentPrice, event: 'Listed' },
  ]

  if (chartData.length <= 1) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl bg-secondary-50 text-sm text-secondary-400">
        No price history available
      </div>
    )
  }

  const formatPrice = (value: number) =>
    value >= 1_000_000
      ? `$${(value / 1_000_000).toFixed(1)}M`
      : `$${Math.round(value / 1000)}k`

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatPrice} tick={{ fontSize: 12 }} width={60} />
        <Tooltip
          formatter={(value) =>
            typeof value === 'number' ? [`$${value.toLocaleString()}`, 'Price'] : [value, 'Price']
          }
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ fill: '#2563eb', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
