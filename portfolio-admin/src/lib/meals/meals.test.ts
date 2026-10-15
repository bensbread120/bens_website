import { describe, expect, it } from "vitest"
import { arrangePicks, pickRecipes } from "./pick"
import { buildShoppingList, itemKey, type RecipeForList } from "./shopping"
import { formatAmount, fraction, parseQuantity, toBase } from "./units"

const item = (itemId: string, category = "Pantry", pantry = false) => ({ itemId, itemName: itemId, category, pantry })

describe("units", () => {
  it("converts Australian spoon and cup measures to ml", () => {
    expect(toBase(1, "tbsp")).toEqual({ dimension: "volume", amount: 20 })
    expect(toBase(2, "tsp")).toEqual({ dimension: "volume", amount: 10 })
    expect(toBase(1, "cup")).toEqual({ dimension: "volume", amount: 250 })
    expect(toBase(0.5, "kg")).toEqual({ dimension: "mass", amount: 500 })
  })

  it("formats amounts in the unit a shopper expects", () => {
    expect(formatAmount("volume", 7.5)).toBe("1½ tsp")
    expect(formatAmount("volume", 40)).toBe("2 tbsp")
    expect(formatAmount("volume", 500)).toBe("500 ml")
    expect(formatAmount("volume", 1500)).toBe("1.5 L")
    expect(formatAmount("mass", 750)).toBe("750 g")
    expect(formatAmount("mass", 1250)).toBe("1.25 kg")
    expect(formatAmount("each", 3)).toBe("3")
    expect(formatAmount("clove", 1)).toBe("1 clove")
    expect(formatAmount("clove", 4)).toBe("4 cloves")
    expect(formatAmount("bunch", 2)).toBe("2 bunches")
  })

  it("rounds to quarters", () => {
    expect(fraction(0.5)).toBe("½")
    expect(fraction(2.25)).toBe("2¼")
    expect(fraction(3)).toBe("3")
    expect(fraction(0.1)).toBe("0.1")
  })

  it("parses fractions people type in recipes", () => {
    expect(parseQuantity("2")).toBe(2)
    expect(parseQuantity("0.5")).toBe(0.5)
    expect(parseQuantity("1/2")).toBe(0.5)
    expect(parseQuantity("1 1/2")).toBe(1.5)
    expect(parseQuantity("½")).toBe(0.5)
    expect(parseQuantity("1½")).toBe(1.5)
    expect(parseQuantity("  ")).toBeNull()
    expect(parseQuantity("a pinch")).toBeNaN()
  })

  it("normalises item names", () => {
    expect(itemKey("  Ground  Cumin ")).toBe(itemKey("ground cumin"))
  })
})

describe("buildShoppingList", () => {
  const tacos: RecipeForList = {
    name: "Tacos",
    ingredients: [
      { ...item("cumin", "Herbs & spices"), quantity: 2, unit: "tsp" },
      { ...item("beef mince", "Meat & seafood"), quantity: 500, unit: "g" },
      { ...item("garlic", "Fruit & veg"), quantity: 2, unit: "clove" },
      { ...item("salt", "Pantry", true), quantity: null, unit: "" },
    ],
  }
  const curry: RecipeForList = {
    name: "Curry",
    ingredients: [
      { ...item("cumin", "Herbs & spices"), quantity: 1, unit: "tbsp" },
      { ...item("garlic", "Fruit & veg"), quantity: 1, unit: "tbsp" },
      { ...item("chicken thigh", "Meat & seafood"), quantity: 0.6, unit: "kg" },
      { ...item("coconut milk", "Pantry"), quantity: 1, unit: "can" },
    ],
  }

  it("combines the same ingredient across recipes, converting units", () => {
    const list = buildShoppingList([tacos, curry], [])
    const cumin = list.find((l) => l.itemId === "cumin")!
    // 2 tsp (10 ml) + 1 tbsp (20 ml) = 30 ml
    expect(cumin.quantity).toBe("1½ tbsp")
    expect(cumin.usedIn).toEqual(["Tacos", "Curry"])
  })

  it("lists amounts in unrelated units side by side", () => {
    const garlic = buildShoppingList([tacos, curry], []).find((l) => l.itemId === "garlic")!
    expect(garlic.quantity).toBe("1 tbsp + 2 cloves")
  })

  it("counts recipes cooked twice", () => {
    const list = buildShoppingList([tacos, tacos], [])
    expect(list.find((l) => l.itemId === "beef mince")).toMatchObject({ quantity: "1 kg", usedIn: ["Tacos ×2"] })
  })

  it("keeps pantry items flagged and lines without amounts", () => {
    expect(buildShoppingList([tacos], []).find((l) => l.itemId === "salt")).toMatchObject({ quantity: "", pantry: true })
  })

  it("adds weekly regulars and merges them with recipe use", () => {
    const withYoghurt: RecipeForList = { name: "Curry", ingredients: [{ ...item("yoghurt", "Dairy & eggs"), quantity: 200, unit: "g" }] }
    const list = buildShoppingList([withYoghurt], [
      { itemId: "yoghurt", name: "yoghurt", category: "Dairy & eggs", quantity: "1 kg tub" },
      { itemId: "toilet paper", name: "toilet paper", category: "Household", quantity: null },
    ])
    expect(list.find((l) => l.itemId === "yoghurt")).toMatchObject({ quantity: "200 g + 1 kg tub", usedIn: ["Curry", "Weekly"], source: "recipe" })
    expect(list.find((l) => l.itemId === "toilet paper")).toMatchObject({ quantity: "", usedIn: ["Weekly"], source: "regular" })
  })

  it("sorts by aisle then name", () => {
    const list = buildShoppingList([tacos, curry], [])
    expect(list.map((l) => l.category)).toEqual([
      "Fruit & veg",
      "Meat & seafood",
      "Meat & seafood",
      "Pantry",
      "Pantry",
      "Herbs & spices",
    ])
  })
})

describe("pickRecipes", () => {
  // Deterministic sequence for repeatable tests
  function seeded(seed: number) {
    const next = () => {
      seed = (seed * 16807) % 2147483647
      return (seed - 1) / 2147483646
    }
    // Small seeds give near-zero first outputs; discard a few
    for (let i = 0; i < 5; i++) next()
    return next
  }
  const recipes = ["a", "b", "c", "d", "e", "f", "g", "h"].map((id) => ({ id, lastCooked: null }))

  it("picks distinct recipes when there are enough", () => {
    const picked = pickRecipes({ count: 5, recipes, exclude: new Set(), avoid: new Set(), today: "2026-10-15", random: seeded(1) })
    expect(picked).toHaveLength(5)
    expect(new Set(picked).size).toBe(5)
  })

  it("skips recipes already planned and last week's when possible", () => {
    for (let seed = 1; seed < 30; seed++) {
      const picked = pickRecipes({
        count: 3,
        recipes,
        exclude: new Set(["a", "b"]),
        avoid: new Set(["c", "d"]),
        today: "2026-10-15",
        random: seeded(seed),
      })
      expect(picked.some((id) => ["a", "b", "c", "d"].includes(id))).toBe(false)
    }
  })

  it("falls back to recent recipes, then repeats, when the collection is small", () => {
    const small = recipes.slice(0, 3)
    const picked = pickRecipes({ count: 5, recipes: small, exclude: new Set(), avoid: new Set(["a"]), today: "2026-10-15", random: seeded(3) })
    expect(picked).toHaveLength(5)
    expect(new Set(picked.slice(0, 3)).size).toBe(3)
  })

  it("favours recipes not cooked for a while", () => {
    const history = [
      { id: "recent", lastCooked: "2026-10-10" },
      { id: "old", lastCooked: "2026-06-01" },
    ]
    let oldCount = 0
    for (let seed = 1; seed <= 200; seed++) {
      const [pick] = pickRecipes({ count: 1, recipes: history, exclude: new Set(), avoid: new Set(), today: "2026-10-15", random: seeded(seed) })
      if (pick === "old") oldCount++
    }
    expect(oldCount).toBeGreaterThan(140)
  })

  it("returns nothing without recipes", () => {
    expect(pickRecipes({ count: 3, recipes: [], exclude: new Set(), avoid: new Set(), today: "2026-10-15" })).toEqual([])
  })
})

describe("arrangePicks", () => {
  const consecutive = (week: (string | null)[]) => week.some((id, i) => i > 0 && id !== null && id === week[i - 1])

  it("keeps fixed nights and fills the empty ones", () => {
    const week = arrangePicks(["tacos", undefined, null, undefined, undefined, undefined, undefined], ["a", "b", "c", "d", "e"])
    expect(week[0]).toBe("tacos")
    expect(week[2]).toBeNull()
    expect(week.filter((id) => id && id !== "tacos")).toHaveLength(5)
  })

  it("separates repeats when there are too few recipes", () => {
    // The case seen in testing: tacos and curry fixed, only bolognese left for four nights
    const week = arrangePicks(["tacos", "curry", null, undefined, undefined, undefined, undefined], ["bol", "bol", "curry", "tacos"])
    expect(consecutive(week)).toBe(false)
  })

  it("places the most repeated recipe first so it doesn't pile up at the end", () => {
    // Seen in the browser: greedy order left bolognese for Saturday and Sunday
    const week = arrangePicks(["tacos", "curry", undefined, undefined, undefined, undefined, undefined], ["bol", "curry", "tacos", "bol", "bol"])
    expect(consecutive(week)).toBe(false)
  })

  it("avoids clashing with a fixed night after the gap", () => {
    const week = arrangePicks([undefined, "curry", undefined, undefined, undefined, undefined, undefined], ["curry", "a", "b", "c", "d", "e"])
    expect(consecutive(week)).toBe(false)
  })

  it("still fills every night when a repeat is unavoidable", () => {
    const week = arrangePicks([undefined, undefined, undefined], ["only", "only", "only"])
    expect(week).toEqual(["only", "only", "only"])
  })
})
