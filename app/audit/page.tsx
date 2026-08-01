import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuditWorkspace } from "@/components/audit/audit-workspace";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "New audit",
};

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  if (!isSupabaseConfigured) redirect("/login?notice=not-configured");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Faudit");

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="no-print flex items-center justify-between border-b border-[#d6d0c4] pb-5">
          <Link href="/dashboard">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-faint sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        <div className="no-print mt-10 max-w-2xl">
          <p className="small-caps text-xs text-accent">New audit</p>
          <h1 className="mt-3 text-4xl leading-tight">Read a syllabus</h1>
          <p className="mt-5 font-serif text-lg leading-[1.7] text-muted">
            Upload the document your department already submitted. CurriPulse extracts its units,
            lecture hours, and Course Outcomes, and reports exactly what it measured while doing so.
          </p>
        </div>

        <div className="mt-12">
          <AuditWorkspace />
        </div>
      </div>
    </main>
  );
}
