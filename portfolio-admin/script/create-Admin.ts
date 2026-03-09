import bcrypt from "bcrypt"
import { db } from "../src/lib/db"

async function main() {

  const password = await bcrypt.hash("Vgeh2071?", 10)

  await db.user.create({
    data: {
      email: "bhatfield120@gmail.com",
      password
    }
  })

  console.log("Admin user created")
}

main()