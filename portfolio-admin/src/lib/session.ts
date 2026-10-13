import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

// For pages: send signed-out visitors to the login page
export async function requireAdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  return session
}

// For server actions, which are callable directly and need their own check
export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  return session
}
