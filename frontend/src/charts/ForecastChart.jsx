import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'

const C = {
  historical: '#c58b6d',
  forecast: '#79b7a5',
  muted: '#94a6a8',
  grid: '#35444b'
}

export default function ForecastChart({ data }) {
  const chartData = data.map(d => ({
    ...d,
    band:
      d.low != null && d.high != null
        ? [d.low, d.high]
        : null
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 18, right: 20, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            stroke={C.grid}
            strokeWidth={0.6}
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: C.muted, fontSize: 10 }}
            tickMargin={12}
            minTickGap={15}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: C.muted, fontSize: 10 }}
            tickFormatter={value => `${value}°`}
            domain={['dataMin - 1', 'dataMax + 1']}
            width={45}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#19262d',
              border: '1px solid #405157',
              borderRadius: 6,
              boxShadow: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11
            }}
            labelStyle={{ color: '#e0e8e7' }}
            cursor={{
              stroke: '#6e8589',
              strokeDasharray: '3 4'
            }}
          />

          <Legend
            verticalAlign="top"
            align="right"
            height={35}
            iconType="plainline"
            wrapperStyle={{
              fontSize: 11,
              color: C.muted
            }}
          />

          <Area
            dataKey="band"
            name="Illustrative uncertainty"
            stroke="none"
            fill={C.forecast}
            fillOpacity={0.10}
            connectNulls={false}
            isAnimationActive={false}
          />

          <Line
            type="linear"
            dataKey="actual"
            name="Historical"
            stroke={C.historical}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />

          <Line
            type="linear"
            dataKey="forecast"
            name="Projection"
            stroke={C.forecast}
            strokeWidth={1.8}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}