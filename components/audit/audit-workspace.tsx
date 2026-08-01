"use client";

import { useRef, useState, type DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, FileUp, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TelemetryHud } from "@/components/audit/telemetry-hud";
import { StructureReport } from "@/components/audit/structure-report";
import { GapReportView } from "@/components/audit/gap-report";
import { useAuditStream } from "@/lib/audit/use-audit-stream";
import { sampleSyllabusFile, SAMPLE_SYLLABUS_NAME } from "@/lib/syllabus/sample";
import { MARKETS, MARKET_LABELS, type MarketId } from "@/data/job-market";
import { cn } from "@/lib/utils";

export function AuditWorkspace() {
  const { stages, stageOrder, result, error, runState, elapsed, run, reset } = useAuditStream();
  const [market, setMarket] = useState<MarketId>("bengaluru");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = runState === "running";

  function start(file: File) {
    setFileName(file.name);
    void run(file, market);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) start(file);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[22rem_1fr] lg:items-start">
      {/* Configuration */}
      <aside className="space-y-6">
        <section className="panel rounded-lg p-6">
          <h2 className="small-caps text-xs text-accent">Audit configuration</h2>

          <label htmlFor="market" className="mt-5 block text-sm text-ink">
            Target hiring market
          </label>
          <select
            id="market"
            value={market}
            onChange={(e) => setMarket(e.target.value as MarketId)}
            disabled={busy}
            className="mt-2 w-full rounded-md border border-[#d6d0c4] bg-base px-3 py-2.5 text-sm
                       text-ink transition-colors focus:border-accent/50 focus:outline-none
                       focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
          >
            {MARKETS.map((id) => (
              <option key={id} value={id}>
                {MARKET_LABELS[id]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11px] leading-relaxed text-faint">
            Weights the gap analysis toward that market&apos;s hiring demand.
          </p>

          <div className="mt-6 border-t border-[#d6d0c4] pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink">Modification cap</span>
              <span className="font-mono text-sm text-good">15%</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
              Fixed at the Board of Studies fast-track limit. Computed from the contact hours
              recovered during parsing.
            </p>
          </div>
        </section>

        {/* Upload */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            "rounded-lg border border-dashed p-6 text-center transition-colors",
            dragging ? "border-accent bg-accent/[0.05]" : "border-[#cfc8ba] bg-raised",
            busy && "opacity-60",
          )}
        >
          <FileUp className="mx-auto size-5 text-faint" />
          <p className="mt-3 text-sm text-ink">Drop a syllabus here</p>
          <p className="mt-1 text-[11px] text-faint">PDF, DOCX, or plain text · up to 12 MB</p>

          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) start(file);
              e.target.value = "";
            }}
          />

          <div className="mt-5 flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Choose a file
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => start(sampleSyllabusFile())}
              className="justify-center"
            >
              <Sparkles className="size-3.5" />
              Use the sample VTU syllabus
            </Button>
          </div>

          {fileName && (
            <p className="mt-4 truncate font-mono text-[11px] text-faint" title={fileName}>
              {fileName === SAMPLE_SYLLABUS_NAME ? "sample · " : ""}
              {fileName}
            </p>
          )}
        </section>

        {runState !== "idle" && !busy && (
          <Button type="button" variant="ghost" onClick={reset} className="w-full justify-center">
            <RotateCcw className="size-3.5" />
            Start over
          </Button>
        )}
      </aside>

      {/* Readout */}
      <div className="space-y-8">
        <TelemetryHud
          stages={stages}
          stageOrder={stageOrder}
          runState={runState}
          elapsed={elapsed}
        />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-lg border border-bad/30 bg-bad/[0.06] p-5"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" />
                <div>
                  <h3 className="text-sm font-medium text-ink">The audit could not complete</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {busy && !result && (
            <motion.div
              key="busy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 text-sm text-muted"
            >
              <Loader2 className="size-3.5 animate-spin text-accent" />
              Reading the document…
            </motion.div>
          )}

          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              {result.gap && (
                <section className="panel lift rounded-lg p-7">
                  <GapReportView report={result.gap} />
                </section>
              )}
              <section className="panel lift rounded-lg p-7">
                <StructureReport result={result} />
              </section>
            </motion.div>
          )}

          {runState === "idle" && (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-serif text-lg leading-[1.7] text-muted"
            >
              Upload a syllabus, or run the bundled VTU sample. Every figure in the log above is
              measured from work that actually ran — stages that have not been built report as not
              run rather than showing a plausible number.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
