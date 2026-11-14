import { TriangleAlert } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import SampleBadge from '../components/SampleBadge'
import ForecastChart from '../charts/ForecastChart'
import { forecastSeries, modelMetrics } from '../data/sampleData2'

export default function Forecast() {
  return (
    <div>
      <PageHeader
        title="AI Forecast"
        description="Short-term temperature forecasts with uncertainty and model evaluation. Real models are trained in Milestone 6."
      />

      <div className="mb-4 flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4">
        <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-300" />
        <p className="text-sm leading-relaxed text-amber-100/80">
          The forecast below is an illustration of the layout only. It is not produced by a trained model
          and must not be read as a prediction.
        </p>
      </div>

      <Card title="Monthly temperature: history and forecast" subtitle="Shaded band shows the uncertainty range" action={<SampleBadge />}>
        <ForecastChart data={forecastSeries} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Model evaluation" subtitle="Chronological train/test split" action={<SampleBadge label="Placeholder" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-2 pr-4 font-medium">Model</th>
                  <th className="pb-2 pr-4 font-medium">MAE</th>
                  <th className="pb-2 font-medium">RMSE</th>
                </tr>
              </thead>
              <tbody>
                {modelMetrics.map((m) => (
                  <tr key={m.name} className="border-t border-white/5">
                    <td className="py-2.5 pr-4 text-gray-200">{m.name}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{m.mae}</td>
                    <td className="py-2.5 text-gray-500">{m.rmse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Limitations">
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-glow" />Forecasts cover the short term only. Long-term climate projection needs far more than a local time series.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-glow" />Models are tested on later data than they were trained on, to avoid data leakage.</li>
            <li className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-glow" />Wider uncertainty bands mean lower confidence in the forecast.</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
