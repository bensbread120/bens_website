// Combines a week's recipes and regular items into one shopping list. Pure: no DB access.

import { formatAmount, toBase } from "./units"

// Aisle order for the list
export const CATEGORIES = [
  "Fruit & veg",
  "Meat & seafood",
  "Dairy & eggs",
  "Bakery",
  "Pantry",
  "Herbs & spices",
  "Frozen",
  "Drinks",
  "Household",
  "Other",
] as const

export type IngredientLine = {
  itemId: string
  itemName: string
  category: string
  pantry: boolean
  // Null for "to taste" style lines with no amount
  quantity: number | null
  unit: string
}

export type RecipeForList = {
  name: string
  ingredients: IngredientLine[]
}

export type RegularForList = {
  itemId: string
  name: string
  category: string
  quantity: string | null
}

export type ListLine = {
  itemId: string
  name: string
  category: string
  quantity: string
  // Recipe names (with ×n when cooked more than once) and "Weekly" for regulars
  usedIn: string[]
  // Usually in stock: shown separately as "check the pantry"
  pantry: boolean
  source: "recipe" | "regular"
}

type Accumulator = {
  name: string
  category: string
  pantry: boolean
  amounts: Map<string, number>
  usedIn: Map<string, number>
  regularQuantity: string | null
  isRegular: boolean
  fromRecipe: boolean
}

const DIMENSION_ORDER = ["mass", "volume", "each"]

export function buildShoppingList(recipes: RecipeForList[], regulars: RegularForList[]): ListLine[] {
  const items = new Map<string, Accumulator>()
  const get = (id: string, name: string, category: string, pantry: boolean) => {
    let acc = items.get(id)
    if (!acc) {
      acc = { name, category, pantry, amounts: new Map(), usedIn: new Map(), regularQuantity: null, isRegular: false, fromRecipe: false }
      items.set(id, acc)
    }
    return acc
  }

  for (const recipe of recipes) {
    // A recipe listing the same item twice (e.g. butter for sauce and topping) counts once in "used in"
    const seen = new Set<string>()
    for (const line of recipe.ingredients) {
      const acc = get(line.itemId, line.itemName, line.category, line.pantry)
      acc.fromRecipe = true
      if (line.quantity !== null && line.quantity > 0) {
        const { dimension, amount } = toBase(line.quantity, line.unit)
        acc.amounts.set(dimension, (acc.amounts.get(dimension) ?? 0) + amount)
      }
      if (!seen.has(line.itemId)) {
        acc.usedIn.set(recipe.name, (acc.usedIn.get(recipe.name) ?? 0) + 1)
        seen.add(line.itemId)
      }
    }
  }

  for (const regular of regulars) {
    const acc = get(regular.itemId, regular.name, regular.category, false)
    acc.isRegular = true
    // Something bought every week isn't "check the pantry" even if recipes use it too
    acc.pantry = false
    acc.regularQuantity = regular.quantity
  }

  const lines: ListLine[] = [...items.entries()].map(([itemId, acc]) => {
    const dimensions = [...acc.amounts.keys()].sort(
      (a, b) => rank(DIMENSION_ORDER, a) - rank(DIMENSION_ORDER, b) || a.localeCompare(b)
    )
    const parts = dimensions.map((d) => formatAmount(d, acc.amounts.get(d)!))
    if (acc.isRegular && acc.regularQuantity) parts.push(acc.regularQuantity)

    const usedIn = [...acc.usedIn.entries()].map(([name, n]) => (n > 1 ? `${name} ×${n}` : name))
    if (acc.isRegular) usedIn.push("Weekly")

    return {
      itemId,
      name: acc.name,
      category: acc.category,
      quantity: parts.join(" + "),
      usedIn,
      pantry: acc.pantry,
      source: acc.fromRecipe ? "recipe" : "regular",
    }
  })

  return sortLines(lines)
}

export function sortLines<T extends { category: string; name: string }>(lines: T[]): T[] {
  return [...lines].sort(
    (a, b) =>
      rank(CATEGORIES as readonly string[], a.category) - rank(CATEGORIES as readonly string[], b.category) ||
      a.name.localeCompare(b.name)
  )
}

function rank(order: readonly string[], value: string) {
  const i = order.indexOf(value)
  return i === -1 ? order.length : i
}

// Case- and space-insensitive key so "Ground cumin" and "ground  cumin " are the same item
export function itemKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}
