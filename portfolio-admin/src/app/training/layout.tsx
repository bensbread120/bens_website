import TrainingNav from "@/components/training/TrainingNav"
import { requireAdminPage } from "@/lib/session"

// Everything under /training is private
export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <TrainingNav />
      {children}
    </div>
  )
}
