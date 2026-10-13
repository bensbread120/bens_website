-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "averageHeartrate" DOUBLE PRECISION,
ADD COLUMN     "maxHeartrate" DOUBLE PRECISION,
ADD COLUMN     "sportType" TEXT,
ADD COLUMN     "startDateLocal" TIMESTAMP(3),
ADD COLUMN     "trainingLoad" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "StravaAuth" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "athleteId" BIGINT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "maxHr" INTEGER,
    "restingHr" INTEGER,
    "trimpFactor" DOUBLE PRECISION NOT NULL DEFAULT 1.92,
    "runDaysPerWeek" INTEGER NOT NULL DEFAULT 5,
    "longRunDay" INTEGER NOT NULL DEFAULT 5,
    "backToBack" BOOLEAN NOT NULL DEFAULT true,
    "maxWeeklyHours" DOUBLE PRECISION,
    "timezone" TEXT,
    "coachNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "elevationGainM" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'A',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RaceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanWeek" (
    "id" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "phase" TEXT NOT NULL,
    "targetHours" DOUBLE PRECISION NOT NULL,
    "targetDistanceKm" DOUBLE PRECISION NOT NULL,
    "targetVertM" DOUBLE PRECISION NOT NULL,
    "longRunMinutes" INTEGER NOT NULL,
    "isDownWeek" BOOLEAN NOT NULL DEFAULT false,
    "targetRaceId" TEXT,
    "rationale" JSONB NOT NULL,
    "aiNotes" TEXT,
    "aiNotesAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanWeek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedWorkout" (
    "id" TEXT NOT NULL,
    "planWeekId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "vertM" DOUBLE PRECISION,

    CONSTRAINT "PlannedWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RaceEvent_date_idx" ON "RaceEvent"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PlanWeek_weekStart_key" ON "PlanWeek"("weekStart");

-- CreateIndex
CREATE INDEX "PlannedWorkout_planWeekId_idx" ON "PlannedWorkout"("planWeekId");

-- CreateIndex
CREATE INDEX "Activity_startDate_idx" ON "Activity"("startDate");

-- AddForeignKey
ALTER TABLE "PlannedWorkout" ADD CONSTRAINT "PlannedWorkout_planWeekId_fkey" FOREIGN KEY ("planWeekId") REFERENCES "PlanWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
