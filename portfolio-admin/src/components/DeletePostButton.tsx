"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { deletePost } from "@/actions/blog";

export default function DeletePostButton({ id }: { id: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  function confirmDelete() {
    toast("Delete this post?", {
      action: {
        label: "Delete",
        onClick: () => {
          formRef.current?.requestSubmit();
        },
      },
    });
  }

  return (
    <>
      <form ref={formRef} action={deletePost}>
        <input type="hidden" name="id" value={id} />
      </form>

      <button
        onClick={confirmDelete}
        className="text-red-500 hover:text-red-700"
      >
        Delete
      </button>
    </>
  );
}
