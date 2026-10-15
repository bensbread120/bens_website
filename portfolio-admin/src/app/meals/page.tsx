import Link from "next/link"
import { clearWeek, confirmWeek, editWeek, randomiseWeek } from "@/actions/meals"
import ActionButton from "@/components/ActionButton"
import { Card } from "@/components/Card"
import ShoppingList, { type ListItemView } from "@/components/meals/ShoppingList"
import WeekPlanner, { type NightView } from "@/components/meals/WeekPlanner"
import { db } from "@/lib/db"
import { buildWeekList, getWeek, householdToday, weekDates } from "@/lib/meals/service"
import { sortLines } from "@/lib/meals/shopping"
import { requireAdminPage } from "@/lib/session"
import { addDays, toISODate, todayInZone, weekStartOf, type ISODate } from "@/lib/training/dates"
import { longDate } from "@/lib/training/format"
import { getAthleteTimezone } from "@/lib/training/profile"

type Props = {
  searchParams: Promise<{ week?: string }>
}

export default async function MealWeekPage({ searchParams }: Props) {
  await requireAdminPage()
  const timezone = await getAthleteTimezone()
  const today = await householdToday()
  const { week: weekParam } = await searchParams
  const weekStart = weekStartOf(weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam) ? weekParam : today)

  const [week, previousWeek, recipes, regulars, allItems] = await Promise.all([
    getWeek(weekStart),
    getWeek(addDays(weekStart, -7)),
    db.recipe.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.groceryItem.findMany({ where: { regular: "occasional" }, orderBy: { lastPurchasedAt: { sort: "asc", nulls: "first" } } }),
    db.groceryItem.findMany({ select: { name: true }, orderBy: { name: "asc" } }),
  ])
  const confirmed = Boolean(week?.confirmedAt)
  const localDate = (d: Date | null | undefined) => (d ? todayInZone(timezone, d) : null)

  const nightFor = (nights: NonNullable<typeof week>["nights"] | undefined, date: ISODate): NightView => {
    const night = nights?.find((n) => toISODate(n.date) === date)
    return {
      date,
      kind: (night?.kind as NightView["kind"]) ?? null,
      recipeId: night?.recipeId ?? null,
      recipeName: night?.recipe?.name ?? null,
      note: night?.note ?? null,
    }
  }
  const nights = weekDates(weekStart).map((date) => nightFor(week?.nights, date))
  const previousNight = previousWeek ? nightFor(previousWeek.nights, addDays(weekStart, -1)) : null

  // Confirmed weeks show the saved list; drafts preview what confirming would produce
  const extras = (week?.listItems ?? []).filter((i) => i.source === "extra")
  const saved = confirmed ? week!.listItems : extras
  const savedViews: ListItemView[] = saved.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    category: i.category,
    usedIn: i.usedIn,
    pantry: i.pantry,
    source: i.source,
    checked: Boolean(i.checkedAt),
    lastPurchased: localDate(i.groceryItem?.lastPurchasedAt),
  }))
  let previewViews: ListItemView[] = []
  if (!confirmed && week) {
    const lines = await buildWeekList(week.id)
    const purchased = await db.groceryItem.findMany({
      where: { id: { in: lines.map((l) => l.itemId) } },
      select: { id: true, lastPurchasedAt: true },
    })
    const lastBought = new Map(purchased.map((p) => [p.id, localDate(p.lastPurchasedAt)]))
    previewViews = lines
      .filter((l) => !extras.some((e) => e.groceryItemId === l.itemId))
      .map((l) => ({ ...l, id: `preview-${l.itemId}`, checked: false, lastPurchased: lastBought.get(l.itemId) ?? null }))
  }
  const listItems = sortLines([...savedViews, ...previewViews])
  const onList = new Set(saved.map((i) => i.groceryItemId))
  const suggestions = regulars
    .filter((r) => !onList.has(r.id))
    .map((r) => ({ id: r.id, name: r.name, lastPurchased: localDate(r.lastPurchasedAt) }))

  const planned = nights.filter((n) => n.kind).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-white">
        <Link href={`/meals?week=${addDays(weekStart, -7)}`} className="rounded-full bg-black/30 px-4 py-1.5 text-sm hover:bg-black/50">
          ← Previous week
        </Link>
        <h1 className="text-2xl font-semibold">Week of {longDate(weekStart)}</h1>
        <Link href={`/meals?week=${addDays(weekStart, 7)}`} className="rounded-full bg-black/30 px-4 py-1.5 text-sm hover:bg-black/50">
          Next week →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card
          title="Dinners"
          action={
            confirmed ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-900">Confirmed</span>
            ) : (
              <span className="text-sm text-gray-500">{planned} of 7 planned</span>
            )
          }
        >
          {recipes.length === 0 && !confirmed && (
            <p className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              No recipes yet.{" "}
              <Link href="/meals/recipes/new" className="font-medium underline">
                Add your first recipe
              </Link>{" "}
              to start planning.
            </p>
          )}
          <WeekPlanner nights={nights} previousNight={previousNight} recipes={recipes} today={today} editable={!confirmed} />

          <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {confirmed ? (
              <ActionButton action={editWeek} args={[weekStart]}>
                Edit plan
              </ActionButton>
            ) : (
              <>
                <ActionButton action={randomiseWeek} args={[weekStart]}>
                  🎲 Fill empty nights
                </ActionButton>
                <ActionButton action={clearWeek} args={[weekStart]} className="text-gray-600 hover:text-red-600">
                  Clear week
                </ActionButton>
                <ActionButton action={confirmWeek} args={[weekStart]} className="ml-auto bg-black text-white hover:bg-gray-800">
                  Confirm and make list
                </ActionButton>
              </>
            )}
          </div>
        </Card>

        <Card title={confirmed ? "Shopping list" : "Shopping list preview"}>
          {!confirmed && (
            <p className="mb-4 text-xs text-gray-500">Confirm the week to tick items off. Items you tick are recorded as bought.</p>
          )}
          <ShoppingList
            weekStart={weekStart}
            today={today}
            items={listItems}
            checkable={confirmed}
            suggestions={suggestions}
            itemNames={allItems.map((i) => i.name)}
          />
        </Card>
      </div>
    </div>
  )
}
