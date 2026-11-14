import PageHeader from '../components/PageHeader'
import Card from '../components/Card'

export default function Vegetation() {
  return (
    <div>
      <PageHeader title="Vegetation Change" description="Compare vegetation greenness (NDVI) between two periods." />
      <Card title="Coming soon" subtitle="Built in Batch 4">
        <p className="text-sm text-gray-400">
          This page is a placeholder. Its full content is built in a later batch.
        </p>
      </Card>
    </div>
  )
}
