"use client"

import { useTransition } from "react"
import { deletePost } from "@/actions/blog"

export default function DeletePostButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        if (confirm("Delete this post?")) {
          startTransition(() => deletePost(id))
        }
      }}
      className="text-red-500"
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  )
}
