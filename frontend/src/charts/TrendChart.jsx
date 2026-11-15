import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'

const muted = '#94a6a8'
const grid = '#35444b'
const copper = '#c58b6d'

export default function TrendChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 18, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid
            stroke={grid}
            strokeWidth={0.6}
            vertical={false}
          />

          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 10 }}
            tickMargin={12}
            minTickGap={22}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: muted, fontSize: 10 }}
            tickFormatter={value => `${value}°`}
            domain={['dataMin - 0.3', 'dataMax + 0.3']}
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
            formatter={value => [
              `${Number(value).toFixed(2)} °C`,
              'Mean temperature'
            ]}
          />

          <Line
            type="linear"
            dataKey="temp"
            name="Mean temperature"
            stroke={copper}
            strokeWidth={1.8}
            dot={false}
            activeDot={{ r: 3 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}