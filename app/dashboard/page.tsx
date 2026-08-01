import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Aurora } from "@/components/ui/aurora";
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
  { title: "Audit sessions", body: "Course, degree, target hiring market, and the 15% cap." },
  { title: "Syllabus ingestion", body: "PDF and DOCX parsing into units, hours, and Course Outcomes." },
  { title: "Live telemetry HUD", body: "Measured parsing, embedding, vector, and graph metrics." },
  { title: "Gap dashboard", body: "Alignment score, obsolete-topic heatmap, missing skills." },
  { title: "15% patch generation", body: "Bloom's-validated COs inside a computed hour budget." },
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
      <Aurora className="opacity-40" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-center justify-between">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-faint sm:inline">{user.email}</span>
            <SignOutButton />
          </div>
        </header>

        <div className="mt-16 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-pulse">Signed in</p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">Your audit workspace</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            The authentication shell is live. The audit engine lands milestone by milestone — each
            tile below becomes a working surface as it ships.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-3">
          {UPCOMING.map((item, i) => (
            <div key={item.title} className="bg-base p-7">
              <span className="font-mono text-xs text-faint">
                M{i + 1}
              </span>
              <h2 className="mt-3 text-base font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              <span className="mt-4 inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-faint">
                In progress
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
