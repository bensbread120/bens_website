"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import type { ActionResult } from "@/lib/action"

type Props<A extends unknown[]> = {
  action: (...args: A) => Promise<ActionResult>
  args: A
  children: React.ReactNode
  className?: string
  title?: string
  // Toast on success too, not just on failure
  announce?: boolean
}

const BASE = "rounded-md px-3 py-1.5 text-sm font-medium transition disabled:opacity-50"

// Calls a server action with fixed arguments and reports failures as a toast
export default function ActionButton<A extends unknown[]>({ action, args, children, className, title, announce = true }: Props<A>) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={`${BASE} ${className ?? "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50"}`}
      onClick={() =>
        startTransition(async () => {
          const result = await action(...args)
          if (result && !result.ok) toast.error(result.message)
          else if (result && announce) toast.success(result.message)
        })
      }
    >
      {children}
    </button>
  )
}
