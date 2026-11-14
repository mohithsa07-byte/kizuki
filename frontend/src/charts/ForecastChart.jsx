import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function ForecastChart({ data }) {
  const chartData = data.map((d) => ({
    ...d,
    band: d.low !== null ? [d.low, d.high] : null,
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip contentStyle={{ background: '#0a1220', border: '1px solid #ffffff15', borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area dataKey="band" name="Uncertainty range" stroke="none" fill="#2dd4bf" fillOpacity={0.18} />
          <Line dataKey="actual" name="Historical (°C)" stroke="#34d399" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
          <Line dataKey="forecast" name="Forecast (°C)" stroke="#2dd4bf" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
