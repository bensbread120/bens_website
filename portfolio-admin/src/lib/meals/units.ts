// Recipe units and how amounts in them combine. Uses Australian metric measures
// (tablespoon = 20 ml, cup = 250 ml), so tsp + tbsp + cup add up within one volume.

export type UnitDef = {
  value: string
  label: string
  // Units sharing a dimension can be added together after converting to the base amount
  dimension: string
  // Multiplier to the dimension's base unit (g for mass, ml for volume, 1 for counts)
  factor: number
}

export const UNITS: UnitDef[] = [
  { value: "", label: "each", dimension: "each", factor: 1 },
  { value: "g", label: "g", dimension: "mass", factor: 1 },
  { value: "kg", label: "kg", dimension: "mass", factor: 1000 },
  { value: "ml", label: "ml", dimension: "volume", factor: 1 },
  { value: "L", label: "L", dimension: "volume", factor: 1000 },
  { value: "tsp", label: "tsp", dimension: "volume", factor: 5 },
  { value: "tbsp", label: "tbsp", dimension: "volume", factor: 20 },
  { value: "cup", label: "cup", dimension: "volume", factor: 250 },
  { value: "clove", label: "clove", dimension: "clove", factor: 1 },
  { value: "can", label: "can", dimension: "can", factor: 1 },
  { value: "bunch", label: "bunch", dimension: "bunch", factor: 1 },
  { value: "packet", label: "packet", dimension: "packet", factor: 1 },
  { value: "slice", label: "slice", dimension: "slice", factor: 1 },
  { value: "sprig", label: "sprig", dimension: "sprig", factor: 1 },
  { value: "handful", label: "handful", dimension: "handful", factor: 1 },
  { value: "pinch", label: "pinch", dimension: "pinch", factor: 1 },
]

const BY_VALUE = new Map(UNITS.map((u) => [u.value, u]))

export function isUnit(value: string): boolean {
  return BY_VALUE.has(value)
}

export function toBase(quantity: number, unit: string): { dimension: string; amount: number } {
  const def = BY_VALUE.get(unit) ?? BY_VALUE.get("")!
  return { dimension: def.dimension, amount: quantity * def.factor }
}

// Readable amount for a summed base quantity, picking the unit a shopper would expect
export function formatAmount(dimension: string, amount: number): string {
  if (dimension === "mass") {
    return amount >= 1000 ? `${trim(amount / 1000, 2)} kg` : `${Math.round(amount)} g`
  }
  if (dimension === "volume") {
    if (amount < 20) return `${fraction(amount / 5)} tsp`
    if (amount < 125) return `${fraction(amount / 20)} tbsp`
    if (amount < 1000) return `${Math.round(amount)} ml`
    return `${trim(amount / 1000, 2)} L`
  }
  if (dimension === "each") return fraction(amount)
  return `${fraction(amount)} ${amount > 1 ? plural(dimension) : dimension}`
}

function plural(unit: string) {
  return unit === "pinch" ? "pinches" : unit === "bunch" ? "bunches" : `${unit}s`
}

function trim(value: number, places: number) {
  return String(Math.round(value * 10 ** places) / 10 ** places)
}

const FRACTIONS: Record<number, string> = { 0.25: "¼", 0.5: "½", 0.75: "¾" }

// Nearest quarter, e.g. 1.5 -> "1½"
export function fraction(value: number): string {
  const quarters = Math.round(value * 4) / 4
  if (quarters === 0) return trim(value, 2)
  const whole = Math.floor(quarters)
  const part = FRACTIONS[quarters - whole]
  if (!part) return String(whole)
  return whole === 0 ? part : `${whole}${part}`
}

const UNICODE_FRACTIONS: Record<string, number> = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 }

// Accepts "2", "0.5", "1/2", "1 1/2", "½" and "1½". Returns null for blank, NaN for nonsense.
export function parseQuantity(text: string): number | null {
  const value = text.trim()
  if (!value) return null
  const unicode = value.match(/^(\d+)?\s*([¼½¾⅓⅔])$/)
  if (unicode) return Number(unicode[1] ?? 0) + UNICODE_FRACTIONS[unicode[2]]
  const mixed = value.match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$/)
  if (mixed) return Number(mixed[1] ?? 0) + Number(mixed[2]) / Number(mixed[3])
  return /^\d*\.?\d+$/.test(value) ? Number(value) : NaN
}
