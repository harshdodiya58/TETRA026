"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  FileDown,
  FileText,
  FileUp,
  Loader2,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TelemetryHud } from "@/components/audit/telemetry-hud";
import { StructureReport } from "@/components/audit/structure-report";
import { GapReportView } from "@/components/audit/gap-report";
import { PatchView } from "@/components/audit/patch-view";
import { GraphInsightView } from "@/components/audit/graph-insight";
import { ProposalDocument } from "@/components/audit/proposal-document";
import { buildProposal, proposalFilename } from "@/lib/export/proposal";
import { useAuditStream } from "@/lib/audit/use-audit-stream";
import { sampleSyllabusFile, SAMPLE_SYLLABUS_NAME } from "@/lib/syllabus/sample";
import { MARKETS, MARKET_LABELS, type MarketId } from "@/data/job-market";
import { cn } from "@/lib/utils";

export function AuditWorkspace() {
  const {
    stages,
    stageOrder,
    result,
    patch,
    error,
    patchError,
    runState,
    patchState,
    elapsed,
    run,
    runPatch,
    reset,
  } = useAuditStream();
  const [market, setMarket] = useState<MarketId>("bengaluru");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  // Stamped once when the proposal is opened so the previewed document, the
  // printed page, and the filename all carry the same date.
  const [proposalAt, setProposalAt] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = runState === "running";

  const proposalBlocks = useMemo(() => {
    if (!result?.gap || !patch || !proposalAt) return null;
    return buildProposal({
      structure: result.structure,
      gap: result.gap,
      patch,
      generatedAt: proposalAt,
    });
  }, [result, patch, proposalAt]);

  async function downloadDocx() {
    if (!result?.gap || !patch) return;
    setExporting(true);
    setExportError(null);

    try {
      const response = await fetch("/api/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structure: result.structure, gap: result.gap, patch }),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? `Export failed (${response.status}).`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = proposalFilename(
        {
          structure: result.structure,
          gap: result.gap,
          patch,
          generatedAt: proposalAt ?? new Date().toISOString(),
        },
        "docx",
      );
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "The export failed.");
    } finally {
      setExporting(false);
    }
  }

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
    <>
    {/* minmax(0,1fr) rather than 1fr: a 1fr track defaults to min-width:auto,
        so long unbreakable strings in the audit log size the column to
        max-content and push the whole page into horizontal scroll. */}
    <div className="no-print grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
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
      <div className="min-w-0 space-y-8">
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

              {result.graph && (
                <section className="panel lift rounded-lg p-7">
                  <GraphInsightView insight={result.graph} />
                </section>
              )}

              {result.gap && !patch && (
                <div className="flex flex-col items-start gap-2">
                  <Button
                    type="button"
                    onClick={() => runPatch(result.structure, result.gap!)}
                    disabled={patchState === "running"}
                    className="px-6 py-3"
                  >
                    {patchState === "running" ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Drafting amendment
                      </>
                    ) : (
                      <>
                        <Sparkles className="size-4" />
                        Generate BoS fast-track amendment
                      </>
                    )}
                  </Button>
                  <p className="text-[11px] text-faint">
                    Sized to {result.gap.modifiableHours ?? "—"} h — 15% of{" "}
                    {result.gap.totalHours ?? "—"} h. The budget and Bloom&apos;s levels are
                    re-checked in code after generation.
                  </p>
                </div>
              )}

              {patchError && (
                <div className="rounded-lg border border-bad/30 bg-bad/[0.06] p-5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-bad" />
                    <div>
                      <h3 className="text-sm font-medium text-ink">
                        The amendment could not be generated
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted">{patchError}</p>
                    </div>
                  </div>
                </div>
              )}

              {patch && (
                <section className="panel lift rounded-lg p-7">
                  <PatchView patch={patch} />
                </section>
              )}

              {patch && !proposalBlocks && (
                <Button
                  type="button"
                  onClick={() => setProposalAt(new Date().toISOString())}
                  className="px-6 py-3"
                >
                  <FileText className="size-4" />
                  Prepare Board of Studies proposal
                </Button>
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

    {/* The proposal sits outside the no-print grid: printing this page should
        yield the document alone, without the workspace around it. */}
    {proposalBlocks && (
      <section className="mt-12">
        <div className="no-print mb-5 flex flex-wrap items-center gap-2.5">
          <Button type="button" onClick={downloadDocx} disabled={exporting} className="px-5 py-2.5">
            {exporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Preparing
              </>
            ) : (
              <>
                <FileDown className="size-4" />
                Download Word (.docx)
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="px-5 py-2.5"
          >
            <Printer className="size-4" />
            Print / Save as PDF
          </Button>

          <p className="text-[11px] text-faint">
            Word is the primary format — a Board edits the document before tabling it.
          </p>
        </div>

        {exportError && (
          <p className="no-print mb-4 rounded-md border border-bad/30 bg-bad/[0.07] px-3.5 py-2.5 text-xs text-bad">
            {exportError}
          </p>
        )}

        <ProposalDocument blocks={proposalBlocks} />
      </section>
    )}
    </>
  );
}
