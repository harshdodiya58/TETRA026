import { cn } from "@/lib/utils";

/**
 * The mark is a single ECG-style trace — the "pulse" in CurriPulse — with the
 * flatline on the left (a static syllabus) breaking into a spike on the right.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 items-center justify-center rounded-xl",
        "bg-gradient-to-br from-pulse via-flux to-nova",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
        <path
          d="M2 13h4.2l2-5.4 3.1 10.8 2.4-7.2 1.8 3.4H22"
          stroke="#05070d"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        Curri<span className="text-gradient">Pulse</span>
      </span>
    </span>
  );
}
