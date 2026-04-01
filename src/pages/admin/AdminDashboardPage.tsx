import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import data from '@/pages/demo-data.json'

export default function AdminDashboardPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <DataTable data={data} />
      </div>
    </div>
  )
}
