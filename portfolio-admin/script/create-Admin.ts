// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx --env-file=.env script/create-Admin.ts
import bcrypt from "bcrypt"
import { db } from "../src/lib/db"

async function main() {
  const email = process.env.ADMIN_EMAIL
  const plainPassword = process.env.ADMIN_PASSWORD

  if (!email || !plainPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set")
  }

  const password = await bcrypt.hash(plainPassword, 10)

  await db.user.create({
    data: {
      email,
      password
    }
  })

  console.log("Admin user created")
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => db.$disconnect())
