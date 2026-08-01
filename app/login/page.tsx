import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Wordmark } from "@/components/brand/logo";
import { PaperField } from "@/components/ui/paper-field";
import { LoginForm } from "@/components/auth/login-form";
import { allowedEmailDomains } from "@/lib/env";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Institutional sign-in for CurriPulse AI.",
};

export default function LoginPage() {
  return (
    <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
      <PaperField />

      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-faint transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back to overview
        </Link>

        <Wordmark />

        <h1 className="mt-7 text-3xl leading-tight">Sign in to your institution</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          CurriPulse is scoped to accredited institutions. Syllabi you upload stay private to your
          institution and are never used to train public models.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="panel h-72 animate-pulse rounded-lg" aria-hidden />}>
            <LoginForm />
          </Suspense>
        </div>

        {allowedEmailDomains.length > 0 && (
          <p className="mt-6 text-center text-xs text-faint">
            Accepted domains: {allowedEmailDomains.join(" · ")}
          </p>
        )}
      </div>
    </main>
  );
}
