"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Loader2, MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { institutionalEmailError } from "@/lib/auth/institutions";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const params = useSearchParams();
  const notice = params.get("notice");
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const domainError = institutionalEmailError(email.trim());
    if (domainError) {
      setStatus("error");
      setMessage(domainError);
      return;
    }

    setStatus("sending");
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rule rounded-2xl bg-warn/[0.06] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warn" />
          <div>
            <h2 className="text-sm font-semibold text-ink">Authentication is not configured yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No Supabase credentials are present in this environment, so no one can hold a valid
              session. Copy <code className="font-mono text-xs text-pulse">.env.local.example</code>{" "}
              to <code className="font-mono text-xs text-pulse">.env.local</code>, fill in{" "}
              <code className="font-mono text-xs text-pulse">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono text-xs text-pulse">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
              then restart the dev server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="panel rounded-2xl p-7 text-center"
      >
        <span className="glow-pulse mx-auto flex size-12 items-center justify-center rounded-full bg-pulse/10">
          <MailCheck className="size-5 text-pulse" />
        </span>
        <h2 className="mt-5 text-lg font-semibold text-ink">Check your inbox</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          A sign-in link is on its way to{" "}
          <span className="font-medium text-ink">{email}</span>. It expires shortly, and opening it
          signs you in on this device.
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage(null);
          }}
          className="mt-6 text-sm text-faint underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Use a different address
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel rounded-2xl p-7">
      {notice === "not-configured" && (
        <p className="mb-5 rounded-lg border border-warn/20 bg-warn/[0.07] px-3.5 py-2.5 text-xs text-warn">
          That page requires a signed-in institutional account.
        </p>
      )}
      {notice === "auth-failed" && (
        <p className="mb-5 rounded-lg border border-bad/20 bg-bad/[0.07] px-3.5 py-2.5 text-xs text-bad">
          That sign-in link was invalid or has already been used. Request a fresh one below.
        </p>
      )}

      <label htmlFor="email" className="block text-sm font-medium text-ink">
        Institutional email
      </label>
      <p className="mt-1.5 text-xs text-faint">
        Passwordless. We send a one-time link — there is no password to leak.
      </p>

      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        placeholder="a.sharma@university.edu.in"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") {
            setStatus("idle");
            setMessage(null);
          }
        }}
        className="mt-4 w-full rounded-xl border border-white/10 bg-base/70 px-4 py-3 text-sm text-ink
                   placeholder:text-faint/70 transition-colors focus:border-pulse/50 focus:outline-none
                   focus:ring-2 focus:ring-pulse/25"
      />

      {status === "error" && message && (
        <p className="mt-3 flex items-start gap-2 text-xs text-bad">
          <AlertTriangle className="mt-px size-3.5 shrink-0" />
          {message}
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "sending" || email.length === 0}
        className="mt-6 w-full py-3"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Sending link
          </>
        ) : (
          <>
            Send sign-in link
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}
