"use client"

import { useState } from "react"
import { saveRecipe } from "@/actions/meals"
import ActionForm from "@/components/ActionForm"
import { CATEGORIES, itemKey } from "@/lib/meals/shopping"
import { parseQuantity, UNITS } from "@/lib/meals/units"

type Line = { key: number; name: string; quantity: string; unit: string; note: string; category: string }

type Props = {
  recipe?: {
    id: string
    name: string
    notes: string | null
    ingredients: { name: string; quantity: number | null; unit: string; note: string | null; category: string }[]
  }
  items: { name: string; category: string }[]
}

const input = "w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
let nextKey = 0
const blank = (): Line => ({ key: nextKey++, name: "", quantity: "", unit: "", note: "", category: "Other" })

export default function RecipeForm({ recipe, items }: Props) {
  const [lines, setLines] = useState<Line[]>(() =>
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({
          key: nextKey++,
          name: i.name,
          quantity: i.quantity === null ? "" : String(i.quantity),
          unit: i.unit,
          note: i.note ?? "",
          category: i.category,
        }))
      : [blank(), blank(), blank()]
  )
  const known = new Map(items.map((i) => [itemKey(i.name), i]))

  function update(key: number, patch: Partial<Line>) {
    setLines((current) =>
      current.map((line) => {
        if (line.key !== key) return line
        const next = { ...line, ...patch }
        // Picking an existing item brings its aisle with it
        if (patch.name !== undefined) {
          const match = known.get(itemKey(patch.name))
          if (match) next.category = match.category
        }
        return next
      })
    )
  }

  const filled = lines.filter((l) => l.name.trim())
  const invalid = filled.find((l) => Number.isNaN(parseQuantity(l.quantity)))
  const payload = JSON.stringify(
    filled.map(({ name, quantity, unit, note, category }) => {
      // Unreadable amounts go as text so the server rejects them rather than saving "to taste"
      const parsed = parseQuantity(quantity)
      return { name, quantity: Number.isNaN(parsed) ? quantity : parsed, unit, note, category }
    })
  )

  return (
    <ActionForm action={saveRecipe} submitLabel={recipe ? "Save recipe" : "Add recipe"} pendingLabel="Saving…" className="space-y-5">
      {recipe && <input type="hidden" name="id" value={recipe.id} />}
      <input type="hidden" name="ingredients" value={payload} />

      <label className="block text-sm">
        <span className="text-gray-700">Name</span>
        <input name="name" required defaultValue={recipe?.name} className={input} />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm text-gray-700">
          Ingredients for one night: dinner for two plus lunch the next day
        </legend>
        <div className="hidden grid-cols-[1fr_5rem_6rem_8rem_9rem_2rem] gap-2 text-xs text-gray-500 md:grid">
          <span>Item</span>
          <span>Amount</span>
          <span>Unit</span>
          <span>Note</span>
          <span>Aisle</span>
        </div>
        <ul className="space-y-3 md:space-y-2">
          {lines.map((line, i) => (
            <li key={line.key} className="grid grid-cols-[1fr_5rem_6rem] gap-2 md:grid-cols-[1fr_5rem_6rem_8rem_9rem_2rem]">
              <input
                aria-label={`Ingredient ${i + 1}`}
                list="recipe-items"
                placeholder="e.g. ground cumin"
                value={line.name}
                onChange={(e) => update(line.key, { name: e.target.value })}
                className={`${input} col-span-3 md:col-span-1`}
              />
              <input
                aria-label={`Amount ${i + 1}`}
                inputMode="decimal"
                placeholder="2"
                value={line.quantity}
                onChange={(e) => update(line.key, { quantity: e.target.value })}
                className={input}
              />
              <select aria-label={`Unit ${i + 1}`} value={line.unit} onChange={(e) => update(line.key, { unit: e.target.value })} className={input}>
                {UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              <input
                aria-label={`Note ${i + 1}`}
                placeholder="diced"
                value={line.note}
                onChange={(e) => update(line.key, { note: e.target.value })}
                className={input}
              />
              <select
                aria-label={`Aisle ${i + 1}`}
                value={line.category}
                onChange={(e) => update(line.key, { category: e.target.value })}
                className={`${input} col-span-2 md:col-span-1`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Remove ingredient ${i + 1}`}
                onClick={() => setLines((current) => current.filter((l) => l.key !== line.key))}
                className="text-gray-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {invalid && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            Can&apos;t read the amount &quot;{invalid.quantity}&quot; for {invalid.name}. Use a number like 2, 0.5, 1/2 or 1½.
          </p>
        )}
        <button type="button" onClick={() => setLines((current) => [...current, blank()])} className="mt-3 text-sm text-blue-600 hover:underline">
          + Add ingredient
        </button>
        <p className="mt-2 text-xs text-gray-500">
          Leave the amount blank for &quot;to taste&quot; items. Spoons and cups are Australian measures (1 tbsp = 20 ml). Changing an
          item&apos;s aisle here changes it everywhere.
        </p>
        <datalist id="recipe-items">
          {items.map((item) => (
            <option key={item.name} value={item.name} />
          ))}
        </datalist>
      </fieldset>

      <label className="block text-sm">
        <span className="text-gray-700">Notes or method</span>
        <textarea name="notes" rows={5} defaultValue={recipe?.notes ?? ""} className={input} />
      </label>
    </ActionForm>
  )
}
