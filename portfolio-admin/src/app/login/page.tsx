"use client"

import Background from "@/src/components/Background"
import { signIn } from "next-auth/react"
import { useState } from "react"

export default function LoginPage() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/admin"
    })
  }

  return (
    <div className="p-10 max-w-md mx-auto">

      <h1 className="text-2xl mb-6">Admin Login</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="border p-2"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="border p-2"
        />

        <button className="bg-black text-white p-2">
          Login
        </button>

      </form>

    </div>
  )
}