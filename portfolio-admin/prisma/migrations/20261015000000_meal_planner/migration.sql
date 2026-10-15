-- CreateTable
CREATE TABLE "GroceryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Other',
    "regular" TEXT,
    "regularQuantity" TEXT,
    "pantry" BOOLEAN NOT NULL DEFAULT false,
    "lastPurchasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroceryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT NOT NULL DEFAULT '',
    "note" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RecipeIngredient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealWeek" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "MealWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealNight" (
    "id" TEXT NOT NULL,
    "mealWeekId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "recipeId" TEXT,
    "note" TEXT,

    CONSTRAINT "MealNight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" TEXT NOT NULL,
    "mealWeekId" TEXT NOT NULL,
    "groceryItemId" TEXT,
    "name" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "usedIn" TEXT[],
    "pantry" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3),
    "previousLastPurchasedAt" TIMESTAMP(3),

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroceryItem_nameKey_key" ON "GroceryItem"("nameKey");

-- CreateIndex
CREATE INDEX "RecipeIngredient_recipeId_idx" ON "RecipeIngredient"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeIngredient_groceryItemId_idx" ON "RecipeIngredient"("groceryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MealWeek_weekStart_key" ON "MealWeek"("weekStart");

-- CreateIndex
CREATE INDEX "MealNight_recipeId_idx" ON "MealNight"("recipeId");

-- CreateIndex
CREATE UNIQUE INDEX "MealNight_mealWeekId_date_key" ON "MealNight"("mealWeekId", "date");

-- CreateIndex
CREATE INDEX "ShoppingListItem_mealWeekId_idx" ON "ShoppingListItem"("mealWeekId");

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealNight" ADD CONSTRAINT "MealNight_mealWeekId_fkey" FOREIGN KEY ("mealWeekId") REFERENCES "MealWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealNight" ADD CONSTRAINT "MealNight_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_mealWeekId_fkey" FOREIGN KEY ("mealWeekId") REFERENCES "MealWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "GroceryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
