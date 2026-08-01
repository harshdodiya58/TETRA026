import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PaperField } from "@/components/ui/paper-field";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Never prerender or cache an auth-gated page. Without this, a build run with
 * no Supabase credentials present statically bakes in the redirect branch.
 */
export const dynamic = "force-dynamic";

/** Milestone tiles — each becomes a real surface as the engine lands. */
const UPCOMING = [
  { title: "Audit sessions", body: "Course, degree, target hiring market, and the fifteen per cent cap." },
  { title: "Syllabus ingestion", body: "PDF and DOCX parsing into units, hours, and Course Outcomes." },
  { title: "Live telemetry", body: "Measured parsing, embedding, vector, and graph metrics." },
  { title: "Gap dashboard", body: "Alignment score, obsolete-topic heatmap, missing skills." },
  { title: "Patch generation", body: "Bloom's-validated COs inside a computed hour budget." },
  { title: "BoS proposal export", body: "Formatted revision proposal as PDF or DOCX." },
];

export default async function DashboardPage() {
  // proxy.ts already guards this route; this is defence in depth for the case
  // where the matcher is ever narrowed.
  if (!isSupabaseConfigured) redirect("/login?notice=not-configured");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fdashboard");

  return (
    <main className="relative isolate flex-1 overflow-hidden">
      <PaperField />

      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between border-b border-[#d6d0c4] pb-5">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-faint sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        <div className="mt-14 max-w-2xl">
          <p className="small-caps text-xs text-accent">Signed in</p>
          <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">Your audit workspace</h1>
          <p className="mt-6 font-serif text-lg leading-[1.7] text-muted">
            The authentication shell is live. The audit engine lands milestone by milestone — each
            entry below becomes a working surface as it ships.
          </p>
        </div>

        <ol className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.map((item, i) => (
            <li key={item.title} className="border-t border-[#d6d0c4] pt-4">
              <span className="font-mono text-[11px] text-faint">M{i + 1}</span>
              <h2 className="mt-2 text-lg text-ink">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
              <span className="small-caps mt-3 inline-block text-[10px] text-accent">
                In progress
              </span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
