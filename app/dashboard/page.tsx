import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { ButtonLink } from "@/components/ui/button";
import { PaperField } from "@/components/ui/paper-field";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { listAudits, loadProfile, type AuditSummary } from "@/lib/db/audit";
import { MARKET_LABELS, type MarketId } from "@/data/job-market";
import { ROLE_LABELS, type Role } from "@/lib/auth/institutions";

export const metadata: Metadata = {
  title: "Dashboard",
};

/**
 * Never prerender or cache an auth-gated page. Without this, a build run with
 * no Supabase credentials present statically bakes in the redirect branch.
 */
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSupabaseConfigured) redirect("/login?notice=not-configured");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=%2Fdashboard");

  // RLS scopes this to the signed-in user's institution; no filter is needed
  // here, and adding one would imply the query is trusted to enforce it.
  const [profile, audits] = await Promise.all([
    loadProfile(supabase, user.id),
    listAudits(supabase),
  ]);

  return (
    <main className="relative isolate flex-1 overflow-hidden">
      <PaperField />

      <div className="relative mx-auto max-w-6xl px-6 py-8">
        <header className="flex items-center justify-between border-b border-[#d6d0c4] pb-5">
          <Link href="/">
            <Wordmark />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-faint sm:inline">
              {user.email}
              {profile?.role && (
                <span className="ml-2 text-[11px] text-muted">
                  {ROLE_LABELS[profile.role as Role] ?? profile.role}
                </span>
              )}
            </span>
            <SignOutButton />
          </div>
        </header>

        <div className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="small-caps text-xs text-accent">Your institution</p>
            <h1 className="mt-3 text-4xl leading-tight sm:text-5xl">Audit workspace</h1>
            <p className="mt-5 font-serif text-lg leading-[1.7] text-muted">
              {audits.length === 0
                ? "No audits yet. Upload a syllabus and CurriPulse will measure it against live hiring data."
                : `${audits.length} audit${audits.length === 1 ? "" : "s"} on record for your institution.`}
            </p>
          </div>

          <ButtonLink href="/audit" variant="primary" className="px-6 py-3">
            New audit
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </ButtonLink>
        </div>

        <section className="mt-12">
          <h2 className="small-caps text-xs text-accent">Recent audits</h2>

          {audits.length === 0 ? (
            <div className="rule mt-5 rounded-lg bg-raised p-10 text-center">
              <FileText className="mx-auto size-5 text-faint" />
              <p className="mt-3 text-sm text-ink">Nothing audited yet</p>
              <p className="mx-auto mt-1.5 max-w-md text-[12.5px] leading-relaxed text-faint">
                Run one against the bundled VTU sample to see the whole path — parse, gap analysis,
                prerequisite graph, and a Board of Studies amendment.
              </p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[#e2ddd2] border-y border-[#d6d0c4]">
              {audits.map((audit) => (
                <AuditRow key={audit.id} audit={audit} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function AuditRow({ audit }: { audit: AuditSummary }) {
  const alignmentTone =
    audit.alignment === null
      ? "text-faint"
      : audit.alignment < 50
        ? "text-bad"
        : audit.alignment < 70
          ? "text-warn"
          : "text-good";

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4">
      <div className="min-w-0">
        <p className="text-sm text-ink">
          {audit.courseCode ?? "Unknown code"}
          {audit.courseTitle ? ` · ${audit.courseTitle}` : ""}
        </p>
        <p className="mt-1 text-[11.5px] text-faint">
          {MARKET_LABELS[audit.market as MarketId] ?? audit.market}
          {audit.filename && ` · ${audit.filename}`}
          {audit.totalHours !== null && ` · ${audit.totalHours} h`}
        </p>
      </div>

      <div className="flex shrink-0 items-baseline gap-6">
        <span className="small-caps text-[10px] text-muted">{audit.status}</span>
        <span className={`font-mono text-lg ${alignmentTone}`}>
          {audit.alignment !== null ? `${audit.alignment.toFixed(0)}%` : "—"}
        </span>
        <time
          dateTime={audit.createdAt}
          className="w-24 text-right font-mono text-[11px] text-faint"
        >
          {new Date(audit.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
    </li>
  );
}
