import { cn } from "@/lib/utils";

/**
 * Ambient background: three slow-drifting colour fields behind a masked dot
 * grid. Pure CSS animation — no JS, no canvas, no scroll listener — so it
 * costs nothing on the main thread and respects prefers-reduced-motion via
 * the global media query in globals.css.
 */
export function Aurora({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-pulse/18 blur-[130px] animate-drift" />
      <div className="absolute -right-32 top-24 h-[32rem] w-[32rem] rounded-full bg-flux/18 blur-[130px] animate-drift-slow" />
      <div className="absolute -left-32 top-64 h-[30rem] w-[30rem] rounded-full bg-nova/14 blur-[130px] animate-drift" />
      <div className="dot-grid mask-fade-y absolute inset-0 opacity-[0.5]" />
    </div>
  );
}
