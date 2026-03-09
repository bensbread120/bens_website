import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { db } from "@/lib/db"

export const authOptions = {
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) return null

        const valid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!valid) return null

        return {
          id: user.id,
          email: user.email
        }
      }
    })
  ],

  session: { strategy: "jwt" as const },

  secret: process.env.NEXTAUTH_SECRET
}

export default NextAuth(authOptions)