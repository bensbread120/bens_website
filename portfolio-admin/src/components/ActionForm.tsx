"use client"

import { useActionState, useEffect } from "react"
import { toast } from "sonner"
import type { ActionResult } from "@/lib/action"

type Props = {
  action: (state: ActionResult, formData: FormData) => Promise<ActionResult>
  submitLabel: string
  pendingLabel?: string
  variant?: "primary" | "secondary" | "danger"
  className?: string
  children?: React.ReactNode
}

const VARIANTS = {
  primary: "bg-black text-white hover:bg-gray-800",
  secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  danger: "text-red-600 hover:text-red-800",
}

// Form bound to a server action, reporting the result as a toast
export default function ActionForm({ action, submitLabel, pendingLabel, variant = "primary", className, children }: Props) {
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (!state) return
    if (state.ok) toast.success(state.message)
    else toast.error(state.message)
  }, [state])

  return (
    <form action={formAction} className={className}>
      {children}
      <button
        type="submit"
        disabled={pending}
        className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${VARIANTS[variant]}`}
      >
        {pending ? (pendingLabel ?? "Working…") : submitLabel}
      </button>
    </form>
  )
}
