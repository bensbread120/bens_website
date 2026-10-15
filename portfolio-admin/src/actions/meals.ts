"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { db } from "@/lib/db"
import { runAction, type ActionResult } from "@/lib/action"
import { CATEGORIES, itemKey } from "@/lib/meals/shopping"
import {
  assertEditable,
  confirmWeek as confirmWeekList,
  ensureWeek,
  fillEmptyNights,
  findOrCreateItem,
  householdToday,
  pickForWeek,
} from "@/lib/meals/service"
import { isUnit } from "@/lib/meals/units"
import { fromISODate, weekStartOf } from "@/lib/training/dates"

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const category = z.enum(CATEGORIES)
const run = (action: () => Promise<string>) => runAction("/meals", action)

// ---- Week plan ----

// value: "" clears the night, "out" marks eating out, anything else is a recipe id
export async function setNight(date: string, value: string, note?: string): Promise<ActionResult> {
  return run(async () => {
    const day = isoDate.parse(date)
    const week = await assertEditable(weekStartOf(day))
    const where = { mealWeekId_date: { mealWeekId: week.id, date: fromISODate(day) } }

    if (value === "") {
      await db.mealNight.deleteMany({ where: { mealWeekId: week.id, date: fromISODate(day) } })
      return "Night cleared"
    }
    const data =
      value === "out"
        ? { kind: "out", recipeId: null, note: note?.trim() || null }
        : { kind: "recipe", recipeId: (await db.recipe.findUniqueOrThrow({ where: { id: value } })).id, note: null }
    await db.mealNight.upsert({ where, create: { mealWeekId: week.id, date: fromISODate(day), ...data }, update: data })
    return "Saved"
  })
}

export async function rerollNight(date: string): Promise<ActionResult> {
  return run(async () => {
    const day = isoDate.parse(date)
    const weekStart = weekStartOf(day)
    const week = await assertEditable(weekStart)
    const nights = await db.mealNight.findMany({ where: { mealWeekId: week.id } })
    const [recipeId] = await pickForWeek(
      weekStart,
      await householdToday(),
      1,
      nights.flatMap((n) => (n.recipeId ? [n.recipeId] : []))
    )
    if (!recipeId) throw new Error("Add some recipes first")
    const data = { kind: "recipe", recipeId, note: null }
    await db.mealNight.upsert({
      where: { mealWeekId_date: { mealWeekId: week.id, date: fromISODate(day) } },
      create: { mealWeekId: week.id, date: fromISODate(day), ...data },
      update: data,
    })
    return "New pick"
  })
}

export async function randomiseWeek(weekStart: string): Promise<ActionResult> {
  return run(async () => {
    const filled = await fillEmptyNights(isoDate.parse(weekStart), await householdToday())
    return filled ? `Picked ${filled} dinner${filled === 1 ? "" : "s"}` : "Every night is already planned"
  })
}

export async function clearWeek(weekStart: string): Promise<ActionResult> {
  return run(async () => {
    const week = await assertEditable(isoDate.parse(weekStart))
    await db.mealNight.deleteMany({ where: { mealWeekId: week.id } })
    return "Week cleared"
  })
}

export async function confirmWeek(weekStart: string): Promise<ActionResult> {
  return run(async () => {
    const count = await confirmWeekList(isoDate.parse(weekStart))
    return `Confirmed. ${count} items on the shopping list.`
  })
}

export async function editWeek(weekStart: string): Promise<ActionResult> {
  return run(async () => {
    const week = await ensureWeek(isoDate.parse(weekStart))
    await db.mealWeek.update({ where: { id: week.id }, data: { confirmedAt: null } })
    return "Editing. Confirm again to update the list; ticked items are kept."
  })
}

// ---- Shopping list ----

// Ticking records the purchase on the item; unticking restores the previous date
export async function toggleListItem(id: string, checked: boolean): Promise<ActionResult> {
  return run(async () => {
    const item = await db.shoppingListItem.findUniqueOrThrow({ where: { id }, include: { groceryItem: true } })
    if (checked && !item.checkedAt) {
      const now = new Date()
      await db.$transaction([
        db.shoppingListItem.update({
          where: { id },
          data: { checkedAt: now, previousLastPurchasedAt: item.groceryItem?.lastPurchasedAt ?? null },
        }),
        ...(item.groceryItemId
          ? [db.groceryItem.update({ where: { id: item.groceryItemId }, data: { lastPurchasedAt: now } })]
          : []),
      ])
    } else if (!checked && item.checkedAt) {
      // Only roll back if nothing has recorded a newer purchase since this tick
      const rollBack = item.groceryItem?.lastPurchasedAt?.getTime() === item.checkedAt.getTime()
      await db.$transaction([
        db.shoppingListItem.update({ where: { id }, data: { checkedAt: null, previousLastPurchasedAt: null } }),
        ...(item.groceryItemId && rollBack
          ? [db.groceryItem.update({ where: { id: item.groceryItemId }, data: { lastPurchasedAt: item.previousLastPurchasedAt } })]
          : []),
      ])
    }
    return checked ? "Ticked" : "Unticked"
  })
}

const extraSchema = z.object({
  weekStart: isoDate,
  name: z.string().trim().min(1, "Enter an item").max(100),
  quantity: z.string().trim().max(50),
})

export async function addExtraItem(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const parsed = extraSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const { weekStart, name, quantity } = parsed.data
    await addExtra(weekStart, name, quantity)
    return `Added ${name}`
  })
}

// One-click add for an occasional regular
export async function addRegularToList(weekStart: string, itemId: string): Promise<ActionResult> {
  return run(async () => {
    const item = await db.groceryItem.findUniqueOrThrow({ where: { id: itemId } })
    await addExtra(isoDate.parse(weekStart), item.name, item.regularQuantity ?? "")
    return `Added ${item.name}`
  })
}

async function addExtra(weekStart: string, name: string, quantity: string) {
  const week = await ensureWeek(weekStart)
  const item = await findOrCreateItem(name)
  const already = await db.shoppingListItem.findFirst({ where: { mealWeekId: week.id, groceryItemId: item.id } })
  if (already) throw new Error(`${item.name} is already on the list`)
  await db.shoppingListItem.create({
    data: {
      mealWeekId: week.id,
      groceryItemId: item.id,
      name: item.name,
      quantity,
      category: item.category,
      source: "extra",
      usedIn: [],
      pantry: false,
    },
  })
}

export async function removeListItem(id: string): Promise<ActionResult> {
  return run(async () => {
    await db.shoppingListItem.delete({ where: { id } })
    return "Removed"
  })
}

// ---- Recipes ----

const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(100),
  quantity: z.number({ message: "amount must be a number" }).positive().nullable(),
  unit: z.string().refine(isUnit, "Unknown unit"),
  note: z.string().trim().max(100).optional(),
  category,
})

const recipeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  notes: z.string().trim().max(5000).transform((v) => v || null),
  ingredients: z
    .string()
    .transform((v) => JSON.parse(v))
    .pipe(z.array(ingredientSchema).min(1, "Add at least one ingredient")),
})

export async function saveRecipe(_: ActionResult, formData: FormData): Promise<ActionResult> {
  const result = await run(async () => {
    const parsed = recipeSchema.safeParse(Object.fromEntries(formData))
    if (!parsed.success) throw new Error(recipeError(parsed.error.issues[0], formData))
    const { name, notes, ingredients } = parsed.data
    const id = formData.get("id")?.toString() || null

    // Sequential so two lines naming a new item don't race to create it
    const items: { id: string }[] = []
    for (const line of ingredients) items.push(await findOrCreateItem(line.name, line.category))
    const lines = ingredients.map((line, position) => ({
      groceryItemId: items[position].id,
      quantity: line.quantity,
      unit: line.unit,
      note: line.note || null,
      position,
    }))

    if (id) {
      await db.$transaction([
        db.recipeIngredient.deleteMany({ where: { recipeId: id } }),
        db.recipe.update({ where: { id }, data: { name, notes, ingredients: { create: lines } } }),
      ])
    } else {
      await db.recipe.create({ data: { name, notes, ingredients: { create: lines } } })
    }
    return `Saved ${name}`
  })
  if (result?.ok) redirect("/meals/recipes")
  return result
}

// "Ingredient 2 (rice): amount must be a number" rather than "ingredients 1 quantity ..."
function recipeError(issue: z.core.$ZodIssue, formData: FormData) {
  const [field, index] = issue.path
  if (field === "ingredients" && typeof index === "number") {
    const lines = JSON.parse(String(formData.get("ingredients")))
    return `Ingredient ${index + 1} (${lines[index]?.name ?? "?"}): ${issue.message}`
  }
  return issue.message
}

export async function setRecipeActive(id: string, active: boolean): Promise<ActionResult> {
  return run(async () => {
    const recipe = await db.recipe.update({ where: { id }, data: { active } })
    return active ? `${recipe.name} is back in the rotation` : `${recipe.name} archived`
  })
}

// ---- Items ----

const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required").max(100),
  category,
  regular: z.enum(["", "weekly", "occasional"]).transform((v) => v || null),
  regularQuantity: z.string().trim().max(50).transform((v) => v || null),
  pantry: z.preprocess((v) => v === "on", z.boolean()),
})

export async function saveItem(_: ActionResult, formData: FormData): Promise<ActionResult> {
  return run(async () => {
    const parsed = itemSchema.safeParse({ ...Object.fromEntries(formData), pantry: formData.get("pantry") })
    if (!parsed.success) throw new Error(parsed.error.issues[0].message)
    const { id, name, ...rest } = parsed.data

    if (id) {
      const clash = await db.groceryItem.findUnique({ where: { nameKey: itemKey(name) } })
      if (clash && clash.id !== id) throw new Error(`There's already an item called ${clash.name}`)
      await db.groceryItem.update({ where: { id }, data: { name, nameKey: itemKey(name), ...rest } })
    } else {
      const item = await findOrCreateItem(name, rest.category)
      await db.groceryItem.update({ where: { id: item.id }, data: rest })
    }
    return `Saved ${name}`
  })
}

export async function markItemBought(id: string): Promise<ActionResult> {
  return run(async () => {
    const item = await db.groceryItem.update({ where: { id }, data: { lastPurchasedAt: new Date() } })
    return `${item.name} marked as bought today`
  })
}

export async function deleteItem(id: string): Promise<ActionResult> {
  return run(async () => {
    const uses = await db.recipeIngredient.count({ where: { groceryItemId: id } })
    if (uses > 0) throw new Error(`Used in ${uses} recipe${uses === 1 ? "" : "s"}; remove it from those first`)
    const item = await db.groceryItem.delete({ where: { id } })
    return `Deleted ${item.name}`
  })
}
