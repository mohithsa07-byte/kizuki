import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function TrendChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="year" stroke="#6b7280" fontSize={12} tickLine={false} />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 0.3', 'dataMax + 0.3']} />
          <Tooltip contentStyle={{ background: '#0a1220', border: '1px solid #ffffff15', borderRadius: 12 }} />
          <Area dataKey="temp" name="Mean temp (°C)" stroke="#34d399" strokeWidth={2.5} fill="url(#tempFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
