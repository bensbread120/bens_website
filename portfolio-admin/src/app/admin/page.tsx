import { redirect } from "next/navigation"
import { createPost } from "@/actions/blog"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Background from "@/src/components/Background"

export default async function AdminPage() {

  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }
  return (
    <div className="p-10">
      <h1 className="text-2xl mb-6">Admin Dashboard</h1>

      <p>Welcome {session.user?.email}</p>
      <h1 className="text-2xl mb-6">Create Blog Post</h1>

      <form action={createPost} className="flex flex-col gap-4">
        <input name="title" placeholder="Title" className="border p-2"/>
        <textarea name="content" placeholder="Content" className="border p-2"/>
        <input name="excerpt" placeholder="Excerpt" className="border p-2"/>
        <input type="file" name="image"/>
        <button className="bg-black text-white p-2">Publish</button>
      </form>
    </div>
  )
}