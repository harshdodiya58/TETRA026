import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/button";
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
const MILESTONES = [
  {
    title: "Syllabus ingestion",
    body: "PDF, DOCX, and text parsing into units, lecture hours, and Course Outcomes.",
    live: true,
  },
  {
    title: "Live telemetry",
    body: "Measured parsing and chunking metrics. Later stages report as not run.",
    live: true,
  },
  {
    title: "Audit sessions",
    body: "Saved courses, target hiring market, and the fifteen per cent cap.",
    live: false,
  },
  {
    title: "Gap dashboard",
    body: "Alignment score, obsolete-topic heatmap, missing skills.",
    live: false,
  },
  {
    title: "Patch generation",
    body: "Bloom's-validated COs inside a computed hour budget.",
    live: false,
  },
  {
    title: "BoS proposal export",
    body: "Formatted revision proposal as PDF or DOCX.",
    live: false,
  },
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
            Syllabus ingestion is live — upload a document and watch it parse. The remaining stages
            land milestone by milestone, and each reports as not run until it does.
          </p>
          <div className="mt-8">
            <ButtonLink href="/audit" variant="primary" className="px-6 py-3">
              Start an audit
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </ButtonLink>
          </div>
        </div>

        <ol className="mt-12 grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONES.map((item) => (
            <li key={item.title} className="border-t border-[#d6d0c4] pt-4">
              <h2 className="text-lg text-ink">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
              <span
                className={`small-caps mt-3 inline-block text-[10px] ${
                  item.live ? "text-good" : "text-faint"
                }`}
              >
                {item.live ? "Live" : "Not built yet"}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
