import SectionNav from "@/components/SectionNav"
import { requireAdminPage } from "@/lib/session"

// Everything under /meals is private
export default async function MealsLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <SectionNav
        items={[
          { name: "This week", path: "/meals" },
          { name: "Recipes", path: "/meals/recipes" },
          { name: "Items", path: "/meals/items" },
        ]}
      />
      {children}
    </div>
  )
}
