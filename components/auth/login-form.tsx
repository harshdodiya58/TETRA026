"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { AlertTriangle, Loader2, MailCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { institutionalEmailError } from "@/lib/auth/institutions";
import { isSupabaseConfigured, siteUrl } from "@/lib/env";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Supabase's built-in mail service permits only a couple of messages per hour,
 * and its raw error text ("For security purposes, you can only request this
 * after 47 seconds") reads as a fault rather than a quota. Rewrite it into
 * something a user can act on.
 */
function readableAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("only request this after")) {
    const seconds = message.match(/(\d+)\s*seconds?/)?.[1];
    return seconds
      ? `Too many requests. Try again in ${seconds} seconds — or enter the code from the email already sent to you.`
      : "Email sending is rate limited right now. If a link was already sent, use the code from that message instead.";
  }

  if (lower.includes("invalid") && lower.includes("token")) {
    return "That code is not valid. Check for a typo, or request a fresh link.";
  }

  if (lower.includes("expired")) {
    return "That code or link has expired. Request a new one.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const notice = params.get("notice");
  const next = params.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  /** Code entry, for when the emailed link is mangled or blocked in transit. */
  async function onVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setMessage("Enter the six digits from the email.");
      return;
    }

    setVerifying(true);
    setMessage(null);

    const { error } = await createClient().auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    if (error) {
      setMessage(readableAuthError(error.message));
      setVerifying(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage(null);

    // Attempted before the domain check so the configured address works
    // regardless of the institutional whitelist. Every other address gets a
    // 403 or 404 here and continues to the normal magic-link flow below.
    try {
      const bypass = await fetch("/api/auth/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (bypass.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
    } catch {
      // Network failure here is not fatal — fall through to the magic link.
    }

    const domainError = institutionalEmailError(email.trim());
    if (domainError) {
      setStatus("error");
      setMessage(domainError);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(readableAuthError(error.message));
      return;
    }

    setCode("");
    setStatus("sent");
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="rule rounded-lg bg-warn/[0.07] p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
          <div>
            <h2 className="text-sm font-medium text-ink">Authentication is not configured yet</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No Supabase credentials are present in this environment, so no one can hold a valid
              session. Copy <code className="font-mono text-[12px] text-accent">.env.local.example</code>{" "}
              to <code className="font-mono text-[12px] text-accent">.env.local</code>, fill in{" "}
              <code className="font-mono text-[12px] text-accent">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono text-[12px] text-accent">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>,
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="panel lift rounded-lg p-7 text-center"
      >
        <span className="mx-auto flex size-11 items-center justify-center rounded-full border border-accent/30 bg-accent/[0.07]">
          <MailCheck className="size-4 text-accent" />
        </span>
        <h2 className="mt-5 text-xl text-ink">Check your inbox</h2>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          A sign-in link is on its way to <span className="text-ink">{email}</span>. It expires
          shortly, and opening it signs you in on this device.
        </p>

        {/* Institutional mail gateways rewrite long links and sometimes break
            them, so the emailed code is a genuine second route in. */}
        <form onSubmit={onVerify} className="mt-7 border-t border-[#d6d0c4] pt-6">
          <label htmlFor="code" className="block text-[13px] text-muted">
            Link not working? Enter the six-digit code from the email.
          </label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setMessage(null);
            }}
            className="mt-3 w-full rounded-md border border-[#d6d0c4] bg-base px-4 py-3 text-center
                       font-mono text-xl tracking-[0.5em] text-ink placeholder:text-faint/60
                       transition-colors focus:border-accent/50 focus:outline-none
                       focus:ring-2 focus:ring-accent/20"
          />

          {message && (
            <p className="mt-3 flex items-start gap-2 text-left text-xs text-bad">
              <AlertTriangle className="mt-px size-3.5 shrink-0" />
              {message}
            </p>
          )}

          <Button
            type="submit"
            variant="outline"
            disabled={verifying || code.replace(/\D/g, "").length !== 6}
            className="mt-4 w-full py-2.5"
          >
            {verifying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying
              </>
            ) : (
              "Sign in with code"
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage(null);
            setCode("");
          }}
          className="mt-6 text-sm text-faint underline underline-offset-4 transition-colors hover:text-ink"
        >
          Use a different address
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel lift rounded-lg p-7">
      {notice === "not-configured" && (
        <p className="mb-5 rounded-md border border-warn/30 bg-warn/[0.08] px-3.5 py-2.5 text-xs text-warn">
          That page requires a signed-in institutional account.
        </p>
      )}
      {notice === "auth-failed" && (
        <p className="mb-5 rounded-md border border-bad/30 bg-bad/[0.07] px-3.5 py-2.5 text-xs text-bad">
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
        className="mt-4 w-full rounded-md border border-[#d6d0c4] bg-base px-4 py-3 text-sm text-ink
                   placeholder:text-faint/80 transition-colors focus:border-accent/50 focus:outline-none
                   focus:ring-2 focus:ring-accent/20"
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
