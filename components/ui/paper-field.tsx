import { cn } from "@/lib/utils";

/**
 * Page substrate. Replaces the usual blurred colour blobs with something that
 * reads as stock: faint graph ruling, a warm vignette at the edges, and a
 * single hairline margin rule down the left the way a manuscript is set.
 *
 * Pure CSS, no animation — the paper should sit still.
 */
export function PaperField({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="graph-paper mask-fade-y absolute inset-0 opacity-60" />

      {/* Warm vignette — the paper darkens very slightly toward the edges. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,253,247,0.9), transparent 70%)",
        }}
      />

      {/* Margin rule, as on ruled manuscript stock. */}
      <div className="absolute inset-y-0 left-[max(2rem,calc(50%-34rem))] hidden w-px bg-accent/12 lg:block" />
    </div>
  );
}
