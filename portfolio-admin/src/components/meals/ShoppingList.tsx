"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"
import { addExtraItem, addRegularToList, removeListItem, toggleListItem } from "@/actions/meals"
import ActionButton from "@/components/ActionButton"
import ActionForm from "@/components/ActionForm"
import { CATEGORIES } from "@/lib/meals/shopping"
import { daysBetween, type ISODate } from "@/lib/training/dates"

export type ListItemView = {
  id: string
  name: string
  quantity: string
  category: string
  usedIn: string[]
  pantry: boolean
  source: string
  checked: boolean
  lastPurchased: ISODate | null
}

type Props = {
  weekStart: ISODate
  today: ISODate
  items: ListItemView[]
  // Ticking is only possible once the week is confirmed
  checkable: boolean
  suggestions: { id: string; name: string; lastPurchased: ISODate | null }[]
  itemNames: string[]
}

export default function ShoppingList({ weekStart, today, items, checkable, suggestions, itemNames }: Props) {
  const [optimistic, setChecked] = useOptimistic(items, (state, update: { id: string; checked: boolean }) =>
    state.map((item) => (item.id === update.id ? { ...item, checked: update.checked } : item))
  )
  const [, startTransition] = useTransition()

  function toggle(item: ListItemView) {
    startTransition(async () => {
      setChecked({ id: item.id, checked: !item.checked })
      const result = await toggleListItem(item.id, !item.checked)
      if (result && !result.ok) toast.error(result.message)
    })
  }

  const toBuy = optimistic.filter((i) => !i.pantry)
  const pantry = optimistic.filter((i) => i.pantry)
  const groups = CATEGORIES.map((category) => ({ category, items: toBuy.filter((i) => i.category === category) })).filter(
    (g) => g.items.length > 0
  )
  const ticked = optimistic.filter((i) => i.checked).length

  return (
    <div className="space-y-6">
      {checkable && optimistic.length > 0 && (
        <p className="text-sm text-gray-600">
          {ticked} of {optimistic.length} ticked
        </p>
      )}

      {groups.map((group) => (
        <section key={group.category}>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">{group.category}</h3>
          <ul className="divide-y divide-gray-100">
            {group.items.map((item) => (
              <Row key={item.id} item={item} today={today} checkable={checkable} onToggle={() => toggle(item)} />
            ))}
          </ul>
        </section>
      ))}

      {pantry.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Check the pantry</h3>
          <p className="mb-1 text-xs text-gray-500">Usually in stock. Tick only if you buy more.</p>
          <ul className="divide-y divide-gray-100">
            {pantry.map((item) => (
              <Row key={item.id} item={item} today={today} checkable={checkable} onToggle={() => toggle(item)} />
            ))}
          </ul>
        </section>
      )}

      {optimistic.length === 0 && <p className="text-sm text-gray-600">Nothing on the list yet.</p>}

      {suggestions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Anything else?</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <ActionButton
                key={s.id}
                action={addRegularToList}
                args={[weekStart, s.id]}
                className="rounded-full border border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
              >
                + {s.name}
                <span className="ml-1 font-normal text-gray-500">{s.lastPurchased ? `· ${ago(s.lastPurchased, today)}` : "· never bought"}</span>
              </ActionButton>
            ))}
          </div>
        </section>
      )}

      <ActionForm action={addExtraItem} submitLabel="Add" pendingLabel="Adding…" variant="secondary" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="weekStart" value={weekStart} />
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-gray-700">Add an item</span>
          <input name="name" list="grocery-items" required className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="w-28 text-sm">
          <span className="text-gray-700">How much</span>
          <input name="quantity" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <datalist id="grocery-items">
          {itemNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </ActionForm>
    </div>
  )
}

function Row({ item, today, checkable, onToggle }: { item: ListItemView; today: ISODate; checkable: boolean; onToggle: () => void }) {
  return (
    <li className="flex items-start gap-3 py-2">
      {checkable && (
        <input
          type="checkbox"
          checked={item.checked}
          onChange={onToggle}
          aria-label={`Bought ${item.name}`}
          className="mt-1 h-5 w-5 shrink-0 accent-gray-900"
        />
      )}
      <div className={`min-w-0 flex-1 ${item.checked ? "text-gray-400 line-through" : ""}`}>
        <div>
          <span className="font-medium">{item.name}</span>
          {item.quantity && <span className="ml-2 text-sm">{item.quantity}</span>}
        </div>
        <div className="text-xs text-gray-500 no-underline">
          {[item.usedIn.join(", "), item.lastPurchased ? `last bought ${ago(item.lastPurchased, today)}` : null]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      {item.source === "extra" && (
        <ActionButton
          action={removeListItem}
          args={[item.id]}
          announce={false}
          title={`Remove ${item.name}`}
          className="text-gray-400 hover:text-red-600"
        >
          ✕
        </ActionButton>
      )}
    </li>
  )
}

function ago(date: ISODate, today: ISODate) {
  const days = daysBetween(date, today)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 14) return `${days} days ago`
  return `${Math.round(days / 7)} weeks ago`
}
