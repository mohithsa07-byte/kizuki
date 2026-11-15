import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts'

const C = {
  rainfall: '#79b7a5',
  temperature: '#c58b6d',
  muted: '#94a6a8',
  grid: '#35444b'
}

const tooltip = {
  backgroundColor: '#19262d',
  border: '1px solid #405157',
  borderRadius: 6,
  boxShadow: 'none',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 11
}

export default function ClimateChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 14, left: 0, bottom: 8 }}
          barCategoryGap="30%"
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
          />

          <YAxis
            yAxisId="rain"
            tickLine={false}
            axisLine={false}
            tick={{ fill: C.muted, fontSize: 10 }}
            tickFormatter={value => `${value}`}
            width={38}
          />

          <YAxis
            yAxisId="temp"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fill: C.muted, fontSize: 10 }}
            tickFormatter={value => `${value}°`}
            domain={['dataMin - 2', 'dataMax + 2']}
            width={42}
          />

          <Tooltip
            contentStyle={tooltip}
            labelStyle={{ color: '#e0e8e7' }}
            cursor={{ stroke: '#6e8589', strokeDasharray: '3 4' }}
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

          <Bar
            yAxisId="rain"
            dataKey="rain"
            name="Rainfall · mm"
            fill={C.rainfall}
            fillOpacity={0.72}
            radius={0}
            maxBarSize={24}
          />

          <Line
            yAxisId="temp"
            type="linear"
            dataKey="temp"
            name="Temperature · °C"
            stroke={C.temperature}
            strokeWidth={1.8}
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