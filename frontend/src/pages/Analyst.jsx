import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Analyst() {
  return (
    <div>
      <PageHeader title="AI Climate Analyst" description="Ask questions about the data for the selected region and period." />
      <Card title="Coming soon" subtitle="Built in Batch 4">
        <p className="text-sm text-gray-400">
          This page is a placeholder. Its full content is built in a later batch.
        </p>
      </Card>
    </div>
  )
}
