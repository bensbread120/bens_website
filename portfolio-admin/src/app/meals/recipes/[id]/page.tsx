import { notFound } from "next/navigation"
import { Card } from "@/components/Card"
import RecipeForm from "@/components/meals/RecipeForm"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: Props) {
  await requireAdminPage()
  const { id } = await params
  const [recipe, items] = await Promise.all([
    db.recipe.findUnique({
      where: { id },
      include: { ingredients: { include: { groceryItem: true }, orderBy: { position: "asc" } } },
    }),
    db.groceryItem.findMany({ select: { name: true, category: true }, orderBy: { name: "asc" } }),
  ])
  if (!recipe) notFound()

  return (
    <Card title={`Edit ${recipe.name}`}>
      <RecipeForm
        items={items}
        recipe={{
          id: recipe.id,
          name: recipe.name,
          notes: recipe.notes,
          ingredients: recipe.ingredients.map((line) => ({
            name: line.groceryItem.name,
            quantity: line.quantity,
            unit: line.unit,
            note: line.note,
            category: line.groceryItem.category,
          })),
        }}
      />
      <p className="mt-4 text-xs text-gray-500">
        Changes apply to weeks you confirm from now on. Already-confirmed shopping lists don&apos;t change.
      </p>
    </Card>
  )
}
