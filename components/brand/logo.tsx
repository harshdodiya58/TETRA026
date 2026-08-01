import { cn } from "@/lib/utils";

/**
 * The mark reads as an ink stamp: a solid block with the ECG trace knocked out
 * in paper. Flat on the left (a frozen syllabus), spiking on the right.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-[5px] bg-ink",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[18px]" aria-hidden>
        <path
          d="M2 13h4.2l2-5.4 3.1 10.8 2.4-7.2 1.8 3.4H22"
          stroke="#f4f1ea"
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
      <span className="font-serif text-[19px] leading-none tracking-tight text-ink">
        CurriPulse
      </span>
    </span>
  );
}
