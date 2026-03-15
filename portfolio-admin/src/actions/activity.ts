"use server"

import { db } from "@/lib/db"

export async function getActivities() {
  return db.activity.findMany({
    orderBy: {
      startDate: "desc",
    },
  })
}
