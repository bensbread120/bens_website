import type { GroceryItem } from "@prisma/client"
import { deleteItem, markItemBought, saveItem } from "@/actions/meals"
import ActionButton from "@/components/ActionButton"
import ActionForm from "@/components/ActionForm"
import { Card } from "@/components/Card"
import { db } from "@/lib/db"
import { CATEGORIES } from "@/lib/meals/shopping"
import { requireAdminPage } from "@/lib/session"
import { todayInZone } from "@/lib/training/dates"
import { shortDate } from "@/lib/training/format"
import { getAthleteTimezone } from "@/lib/training/profile"

const input = "w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"

type ItemWithUse = GroceryItem & { _count: { recipeLines: number } }

export default async function ItemsPage() {
  await requireAdminPage()
  const timezone = await getAthleteTimezone()
  const items = await db.groceryItem.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { recipeLines: true } } },
  })
  const regulars = items.filter((i) => i.regular)
  const lastBought = (item: GroceryItem) =>
    item.lastPurchasedAt ? `Last bought ${shortDate(todayInZone(timezone, item.lastPurchasedAt))}` : "Never bought"

  return (
    <div className="space-y-6">
      <Card title="Add an item">
        <p className="mb-4 text-sm text-gray-600">
          For things that aren&apos;t in a recipe, like yoghurt or toilet paper. Weekly items go on every list; occasional ones are
          suggested with when you last bought them.
        </p>
        <ItemForm />
      </Card>

      <Card title={`Regulars (${regulars.length})`}>
        {regulars.length === 0 ? (
          <p className="text-sm text-gray-600">No regular items yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {regulars.map((item) => (
              <ItemRow key={item.id} item={item} lastBought={lastBought(item)} />
            ))}
          </ul>
        )}
      </Card>

      <Card title={`All items (${items.length})`}>
        {CATEGORIES.map((category) => {
          const inCategory = items.filter((i) => i.category === category)
          if (inCategory.length === 0) return null
          return (
            <section key={category} className="mb-4">
              <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{category}</h3>
              <ul className="divide-y divide-gray-100">
                {inCategory.map((item) => (
                  <ItemRow key={item.id} item={item} lastBought={lastBought(item)} />
                ))}
              </ul>
            </section>
          )
        })}
      </Card>
    </div>
  )
}

function ItemRow({ item, lastBought }: { item: ItemWithUse; lastBought: string }) {
  const tags = [
    item.regular === "weekly" ? "Weekly" : item.regular === "occasional" ? "Occasional" : null,
    item.regularQuantity,
    item.pantry ? "Pantry" : null,
    item._count.recipeLines ? `in ${item._count.recipeLines} recipe${item._count.recipeLines === 1 ? "" : "s"}` : null,
  ].filter(Boolean)

  return (
    <li className="py-2">
      <details>
        <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
          <span>
            <span className="font-medium text-gray-900">{item.name}</span>
            {tags.length > 0 && <span className="ml-2 text-sm text-gray-500">{tags.join(" · ")}</span>}
          </span>
          <span className="text-sm text-gray-500">{lastBought}</span>
        </summary>
        <div className="mt-3 space-y-3 rounded-lg bg-gray-50 p-3">
          <ItemForm item={item} />
          <div className="flex flex-wrap gap-2">
            <ActionButton action={markItemBought} args={[item.id]}>
              Bought today
            </ActionButton>
            {item._count.recipeLines === 0 && (
              <ActionButton action={deleteItem} args={[item.id]} className="text-red-600 hover:text-red-800">
                Delete
              </ActionButton>
            )}
          </div>
        </div>
      </details>
    </li>
  )
}

function ItemForm({ item }: { item?: GroceryItem }) {
  return (
    <ActionForm
      action={saveItem}
      submitLabel={item ? "Save" : "Add item"}
      pendingLabel="Saving…"
      variant={item ? "secondary" : "primary"}
      className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_10rem_9rem_8rem_auto_auto]"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <label className="text-sm">
        <span className="text-gray-700">Name</span>
        <input name="name" required defaultValue={item?.name} className={input} />
      </label>
      <label className="text-sm">
        <span className="text-gray-700">Aisle</span>
        <select name="category" defaultValue={item?.category ?? "Household"} className={input}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="text-gray-700">Regular</span>
        <select name="regular" defaultValue={item?.regular ?? (item ? "" : "weekly")} className={input}>
          <option value="">No</option>
          <option value="weekly">Every week</option>
          <option value="occasional">Occasionally</option>
        </select>
      </label>
      <label className="text-sm">
        <span className="text-gray-700">Usual amount</span>
        <input name="regularQuantity" placeholder="1 kg tub" defaultValue={item?.regularQuantity ?? ""} className={input} />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm" title="Usually in stock; shown under 'check the pantry'">
        <input type="checkbox" name="pantry" defaultChecked={item?.pantry} />
        <span className="text-gray-700">Pantry staple</span>
      </label>
    </ActionForm>
  )
}
