import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

export default function ClimateChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis yAxisId="rain" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="temp" orientation="right" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip contentStyle={{ background: '#0a1220', border: '1px solid #ffffff15', borderRadius: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar yAxisId="rain" dataKey="rain" name="Rainfall (mm)" fill="#2dd4bf" fillOpacity={0.55} radius={[4, 4, 0, 0]} />
          <Line yAxisId="temp" dataKey="temp" name="Temperature (°C)" stroke="#34d399" strokeWidth={2.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
