"use client";

import { motion } from "motion/react";
import type { GraphInsight } from "@/lib/graph/traverse";

/**
 * What the graph adds over the vector layer: not "is this skill missing?" but
 * "can this course actually teach it yet?" An addition whose prerequisites are
 * already covered is a far easier motion to carry at a Board of Studies.
 */
export function GraphInsightView({ insight }: { insight: GraphInsight }) {
  return (
    <div className="space-y-8">
      <header className="border-b border-[#d6d0c4] pb-5">
        <p className="small-caps text-xs text-accent">Prerequisite graph</p>
        <h2 className="mt-2 text-2xl leading-tight">What this course is ready to teach</h2>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
          Traversed {insight.skillNodes} skill, {insight.toolNodes} tool and {insight.roleNodes}{" "}
          role nodes over {insight.prerequisiteEdges} prerequisite edges — {insight.pathsReturned}{" "}
          paths returned, longest chain {insight.maxHopDepth} hop
          {insight.maxHopDepth === 1 ? "" : "s"}.
        </p>
      </header>

      {insight.teachableNow.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-good">Teachable without new groundwork</h3>
          <p className="mt-2 text-[12px] text-faint">
            Every prerequisite is already covered by an existing unit. These are the cheapest
            additions to justify.
          </p>
          <ul className="mt-4 divide-y divide-[#e2ddd2]">
            {insight.teachableNow.map((skill) => (
              <li key={skill.id} className="py-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-ink">{skill.name}</span>
                  <span className="font-mono text-[11px] text-good">ready</span>
                </div>
                {skill.prerequisites.length > 0 && (
                  <p className="mt-1 text-[11px] text-faint">
                    builds on: {skill.prerequisites.join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {insight.needsGroundwork.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-warn">Requires groundwork first</h3>
          <ul className="mt-4 divide-y divide-[#e2ddd2]">
            {insight.needsGroundwork.map((skill) => (
              <li key={skill.id} className="py-2.5">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm text-ink">{skill.name}</span>
                  <span className="font-mono text-[11px] text-warn">
                    {skill.missingPrerequisites.length} unmet
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-faint">
                  needs first: {skill.missingPrerequisites.join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {insight.roles.length > 0 && (
        <section>
          <h3 className="small-caps text-xs text-accent">Role readiness</h3>
          <p className="mt-2 text-[12px] text-faint">
            Share of each role&apos;s demanded skills this syllabus currently covers.
          </p>
          <ul className="mt-4 space-y-3">
            {insight.roles.map((role, i) => (
              <li key={role.role}>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className="text-ink">{role.role}</span>
                  <span className="font-mono text-[11px] text-faint">
                    {role.covered}/{role.total} · {role.share.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-sm bg-[#e4dfd4]">
                  <motion.div
                    className={
                      role.share >= 60 ? "h-full bg-good" : role.share >= 35 ? "h-full bg-warn" : "h-full bg-bad"
                    }
                    initial={{ width: 0 }}
                    animate={{ width: `${role.share}%` }}
                    transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
