import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function ClimateExplorer() {
  return (
    <div>
      <PageHeader title="Climate Explorer" description="Explore climate layers on an interactive map of Bengaluru." />
      <Card title="Coming soon" subtitle="Built in Batch 3">
        <p className="text-sm text-gray-400">
          This page is a placeholder. Its full content is built in a later batch.
        </p>
      </Card>
    </div>
  )
}
