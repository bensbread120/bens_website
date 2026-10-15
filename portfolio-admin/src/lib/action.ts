import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/session"

export type ActionResult = { ok: boolean; message: string } | null

// Wraps an admin-only server action: auth check, error-to-message, revalidation
export async function runAction(revalidate: string, action: () => Promise<string>): Promise<ActionResult> {
  try {
    await requireAdmin()
    const message = await action()
    revalidatePath(revalidate, "layout")
    return { ok: true, message }
  } catch (error) {
    console.error(error)
    return { ok: false, message: error instanceof Error ? error.message : "Something went wrong" }
  }
}
