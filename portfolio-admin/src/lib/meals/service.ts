// Server-side glue between the database and the pure meal modules.

import type { Prisma } from "@prisma/client"
import { db } from "@/lib/db"
import { addDays, fromISODate, toISODate, todayInZone, type ISODate } from "@/lib/training/dates"
import { getAthleteTimezone } from "@/lib/training/profile"
import { arrangePicks, pickRecipes } from "./pick"
import { buildShoppingList, itemKey, type ListLine, type RecipeForList } from "./shopping"

export async function householdToday(): Promise<ISODate> {
  return todayInZone(await getAthleteTimezone())
}

export const weekInclude = {
  nights: { include: { recipe: { select: { id: true, name: true } } }, orderBy: { date: "asc" } },
  listItems: { include: { groceryItem: { select: { lastPurchasedAt: true } } } },
} satisfies Prisma.MealWeekInclude

export async function getWeek(weekStart: ISODate) {
  return db.mealWeek.findUnique({ where: { weekStart: fromISODate(weekStart) }, include: weekInclude })
}

export async function ensureWeek(weekStart: ISODate) {
  return db.mealWeek.upsert({
    where: { weekStart: fromISODate(weekStart) },
    create: { weekStart: fromISODate(weekStart) },
    update: {},
  })
}

export async function assertEditable(weekStart: ISODate) {
  const week = await ensureWeek(weekStart)
  if (week.confirmedAt) throw new Error("This week is confirmed. Choose \"Edit plan\" to change it.")
  return week
}

export async function findOrCreateItem(name: string, category?: string) {
  const trimmed = name.trim().replace(/\s+/g, " ")
  if (!trimmed) throw new Error("Item name is required")
  return db.groceryItem.upsert({
    where: { nameKey: itemKey(trimmed) },
    create: { name: trimmed, nameKey: itemKey(trimmed), category: category ?? "Other" },
    update: category ? { category } : {},
  })
}

// Combined list for the week's planned dinners plus weekly regulars
export async function buildWeekList(weekId: string): Promise<ListLine[]> {
  const nights = await db.mealNight.findMany({
    where: { mealWeekId: weekId, kind: "recipe", recipeId: { not: null } },
    include: {
      recipe: {
        include: { ingredients: { include: { groceryItem: true }, orderBy: { position: "asc" } } },
      },
    },
  })
  const recipes: RecipeForList[] = nights.flatMap((night) =>
    night.recipe
      ? [
          {
            name: night.recipe.name,
            ingredients: night.recipe.ingredients.map((line) => ({
              itemId: line.groceryItemId,
              itemName: line.groceryItem.name,
              category: line.groceryItem.category,
              pantry: line.groceryItem.pantry,
              quantity: line.quantity,
              unit: line.unit,
            })),
          },
        ]
      : []
  )
  const regulars = await db.groceryItem.findMany({ where: { regular: "weekly" } })
  return buildShoppingList(
    recipes,
    regulars.map((r) => ({ itemId: r.id, name: r.name, category: r.category, quantity: r.regularQuantity }))
  )
}

/**
 * Snapshots the list onto the week. Hand-added extras are kept, and ticks carry
 * over for items still on the list, so re-confirming after an edit loses nothing.
 */
export async function confirmWeek(weekStart: ISODate) {
  const week = await ensureWeek(weekStart)
  const lines = await buildWeekList(week.id)
  const existing = await db.shoppingListItem.findMany({ where: { mealWeekId: week.id, source: { not: "extra" } } })
  const ticks = new Map(existing.filter((i) => i.groceryItemId).map((i) => [i.groceryItemId!, i]))

  await db.$transaction([
    db.shoppingListItem.deleteMany({ where: { mealWeekId: week.id, source: { not: "extra" } } }),
    db.shoppingListItem.createMany({
      data: lines.map((line) => ({
        mealWeekId: week.id,
        groceryItemId: line.itemId,
        name: line.name,
        quantity: line.quantity,
        category: line.category,
        source: line.source,
        usedIn: line.usedIn,
        pantry: line.pantry,
        checkedAt: ticks.get(line.itemId)?.checkedAt ?? null,
        previousLastPurchasedAt: ticks.get(line.itemId)?.previousLastPurchasedAt ?? null,
      })),
    }),
    db.mealWeek.update({ where: { id: week.id }, data: { confirmedAt: new Date() } }),
  ])
  return lines.length
}

// Random recipes for every night that isn't planned yet
export async function fillEmptyNights(weekStart: ISODate, today: ISODate) {
  const week = await assertEditable(weekStart)
  const nights = await db.mealNight.findMany({ where: { mealWeekId: week.id } })
  const dates = weekDates(weekStart)
  // undefined = empty, null = eating out, otherwise the planned recipe
  const slots = dates.map((date) => {
    const night = nights.find((n) => toISODate(n.date) === date)
    return night ? (night.kind === "recipe" ? night.recipeId : null) : undefined
  })
  const emptyCount = slots.filter((s) => s === undefined).length
  if (emptyCount === 0) return 0

  const picks = await pickForWeek(weekStart, today, emptyCount, nights.flatMap((n) => (n.recipeId ? [n.recipeId] : [])))
  if (picks.length === 0) throw new Error("Add some recipes first")

  const arranged = arrangePicks(slots, picks)
  await db.mealNight.createMany({
    data: dates.flatMap((date, i) =>
      slots[i] === undefined ? [{ mealWeekId: week.id, date: fromISODate(date), kind: "recipe", recipeId: arranged[i] }] : []
    ),
  })
  return picks.length
}

export async function pickForWeek(weekStart: ISODate, today: ISODate, count: number, alreadyPlanned: string[]) {
  const recipes = await db.recipe.findMany({ where: { active: true }, select: { id: true } })
  const history = await db.mealNight.groupBy({
    by: ["recipeId"],
    where: { recipeId: { not: null }, date: { lt: fromISODate(weekStart) } },
    _max: { date: true },
  })
  const lastCooked = new Map(history.map((h) => [h.recipeId!, h._max.date ? toISODate(h._max.date) : null]))
  const lastWeek = await db.mealNight.findMany({
    where: { recipeId: { not: null }, date: { gte: fromISODate(addDays(weekStart, -7)), lt: fromISODate(weekStart) } },
    select: { recipeId: true },
  })

  return pickRecipes({
    count,
    recipes: recipes.map((r) => ({ id: r.id, lastCooked: lastCooked.get(r.id) ?? null })),
    exclude: new Set(alreadyPlanned),
    avoid: new Set(lastWeek.map((n) => n.recipeId!)),
    today,
  })
}

export function weekDates(weekStart: ISODate): ISODate[] {
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i))
}
