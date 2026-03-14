"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function DeleteToast() {
  const router = useRouter();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current) return; // only show once
    shownRef.current = true;

    toast.success("Post deleted");

    // remove query param to avoid showing again on refresh
    router.replace("/blog");
  }, [router]);

  return null;
}
