import { daysBetween, type ISODate } from "../training/dates"

export type RotationRecipe = {
  id: string
  // Date of the most recent planned night using it, null if never
  lastCooked: ISODate | null
}

type PickInput = {
  count: number
  recipes: RotationRecipe[]
  // Already planned this week
  exclude: Set<string>
  // Cooked recently (e.g. last week): only used when nothing else is left
  avoid: Set<string>
  today: ISODate
  random?: () => number
}

const MAX_WEIGHT = 8

/**
 * Random dinners for `count` nights. Recipes not cooked for a while are more likely
 * (weight grows a step per week, capped). Repeats within the week only happen once
 * every recipe has been used.
 */
export function pickRecipes({ count, recipes, exclude, avoid, today, random = Math.random }: PickInput): string[] {
  if (recipes.length === 0 || count <= 0) return []

  const fresh = recipes.filter((r) => !exclude.has(r.id))
  const preferred = fresh.filter((r) => !avoid.has(r.id))
  let pool = preferred.length >= count ? preferred : fresh.length > 0 ? fresh : recipes

  const picked: string[] = []
  while (picked.length < count) {
    if (pool.length === 0) pool = recipes
    const choice = weightedChoice(pool, (r) => weight(r, today), random)
    picked.push(choice.id)
    pool = pool.filter((r) => r.id !== choice.id)
  }
  return picked
}

function weight(recipe: RotationRecipe, today: ISODate) {
  if (!recipe.lastCooked) return MAX_WEIGHT
  return Math.min(MAX_WEIGHT, 1 + Math.max(0, daysBetween(recipe.lastCooked, today)) / 7)
}

function weightedChoice<T>(items: T[], weightOf: (item: T) => number, random: () => number): T {
  const weights = items.map(weightOf)
  let target = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    target -= weights[i]
    if (target < 0) return items[i]
  }
  return items[items.length - 1]
}

/**
 * Places picked recipes into the week's empty nights (undefined slots), ordering them so
 * the same dinner isn't on consecutive nights, since that means it for lunch and dinner.
 * Fixed nights (recipe ids, or null for nights out) stay where they are.
 */
export function arrangePicks(slots: (string | null | undefined)[], picks: string[]): (string | null)[] {
  const remaining = [...picks]
  const result = [...slots]
  for (let i = 0; i < result.length && remaining.length > 0; i++) {
    if (result[i] !== undefined) continue
    const before = i > 0 ? result[i - 1] : null
    const after = i < result.length - 1 ? result[i + 1] : null
    // Placing the most-repeated recipe first stops it piling up at the end of the week
    let index = mostRepeated(remaining, (id) => id !== before && id !== after)
    if (index === -1) index = mostRepeated(remaining, (id) => id !== before)
    if (index === -1) index = 0
    result[i] = remaining.splice(index, 1)[0]
  }
  return result.map((slot) => slot ?? null)
}

// Index of the first allowed id with the most copies left, or -1
function mostRepeated(ids: string[], allowed: (id: string) => boolean): number {
  const counts = new Map<string, number>()
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1)
  let best = -1
  ids.forEach((id, i) => {
    if (allowed(id) && (best === -1 || counts.get(id)! > counts.get(ids[best])!)) best = i
  })
  return best
}
