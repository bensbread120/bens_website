import Link from "next/link"
import { setRecipeActive } from "@/actions/meals"
import ActionButton from "@/components/ActionButton"
import { Card } from "@/components/Card"
import { db } from "@/lib/db"
import { requireAdminPage } from "@/lib/session"
import { toISODate } from "@/lib/training/dates"
import { shortDate } from "@/lib/training/format"

export default async function RecipesPage() {
  await requireAdminPage()
  const recipes = await db.recipe.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { ingredients: true } },
      nights: { select: { date: true }, orderBy: { date: "desc" }, take: 1 },
    },
  })
  const active = recipes.filter((r) => r.active)
  const archived = recipes.filter((r) => !r.active)

  return (
    <div className="space-y-6">
      <Card
        title={`Recipes (${active.length})`}
        action={
          <Link href="/meals/recipes/new" className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            New recipe
          </Link>
        }
      >
        {active.length === 0 ? (
          <p className="text-gray-600">Add the dinners you cook regularly; random weeks are picked from these.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {active.map((recipe) => (
              <li key={recipe.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/meals/recipes/${recipe.id}`} className="font-medium text-blue-600 hover:underline">
                    {recipe.name}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {recipe._count.ingredients} ingredients ·{" "}
                    {recipe.nights[0] ? `last planned ${shortDate(toISODate(recipe.nights[0].date))}` : "not planned yet"}
                  </div>
                </div>
                <ActionButton action={setRecipeActive} args={[recipe.id, false]} className="text-sm text-gray-500 hover:text-red-600">
                  Archive
                </ActionButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {archived.length > 0 && (
        <Card title="Archived">
          <p className="mb-2 text-sm text-gray-500">Not picked for new weeks, but kept on past ones.</p>
          <ul className="divide-y divide-gray-100">
            {archived.map((recipe) => (
              <li key={recipe.id} className="flex items-center justify-between gap-3 py-2">
                <Link href={`/meals/recipes/${recipe.id}`} className="text-gray-700 hover:underline">
                  {recipe.name}
                </Link>
                <ActionButton action={setRecipeActive} args={[recipe.id, true]}>
                  Restore
                </ActionButton>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
