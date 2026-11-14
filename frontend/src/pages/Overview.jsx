import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Overview() {
  return (
    <div>
      <PageHeader title="Overview" description="A snapshot of temperature, rainfall and vegetation for the selected region." />
      <Card title="Coming soon" subtitle="Built in Batch 2">
        <p className="text-sm text-gray-400">
          This page is a placeholder. Its full content is built in a later batch.
        </p>
      </Card>
    </div>
  )
}
