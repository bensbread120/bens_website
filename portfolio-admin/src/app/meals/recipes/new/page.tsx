import { Card } from "@/components/Card"
import RecipeForm from "@/components/meals/RecipeForm"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"

export default async function NewRecipePage() {
  await requireAdminPage()
  const items = await db.groceryItem.findMany({ select: { name: true, category: true }, orderBy: { name: "asc" } })

  return (
    <Card title="New recipe">
      <RecipeForm items={items} />
    </Card>
  )
}
