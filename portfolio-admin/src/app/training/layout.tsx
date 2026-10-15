import SectionNav from "@/components/SectionNav"
import { requireAdminPage } from "@/lib/session"

// Everything under /training is private
export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SectionNav
        items={[
          { name: "Dashboard", path: "/training" },
          { name: "Plan", path: "/training/plan" },
          { name: "Races", path: "/training/races" },
          { name: "Activities", path: "/training/activities" },
          { name: "Settings", path: "/training/settings" },
        ]}
      />
      {children}
    </div>
  )
}
