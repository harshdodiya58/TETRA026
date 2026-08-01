"use client";

import { motion } from "motion/react";

/**
 * ECG trace that runs flat, then breaks into a spike. Visual shorthand for the
 * product thesis: a syllabus flatlines while industry spikes.
 */
export function PulseTrace() {
  return (
    <svg
      viewBox="0 0 1200 120"
      fill="none"
      preserveAspectRatio="none"
      className="h-24 w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="trace" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
          <stop offset="18%" stopColor="#2dd4bf" stopOpacity="0.75" />
          <stop offset="62%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      <motion.path
        d="M0 60 H430 l26 0 l18 -34 l22 68 l20 -52 l18 34 l16 -16 h34 l22 -44 l26 88 l20 -60 l18 26 h64 l24 -30 l28 62 l22 -40 h330"
        stroke="url(#trace)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.6, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
}
