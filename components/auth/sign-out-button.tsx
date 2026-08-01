"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted",
        "transition-colors hover:bg-surface hover:text-ink disabled:opacity-50",
        className,
      )}
    >
      <LogOut className="size-3.5" />
      {busy ? "Signing out" : "Sign out"}
    </button>
  );
}
