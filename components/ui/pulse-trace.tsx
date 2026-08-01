"use client";

import { motion } from "motion/react";

/**
 * The thesis in one line: a syllabus holds flat in faint ink while the market
 * it feeds spikes in red pen.
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
      {/* Flatline — the frozen document. */}
      <motion.path
        d="M0 60 H430"
        stroke="#16150f"
        strokeOpacity="0.28"
        strokeWidth="1.25"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
      />

      {/* The market, marked in red. */}
      <motion.path
        d="M430 60 l26 0 l18 -34 l22 68 l20 -52 l18 34 l16 -16 h34 l22 -44 l26 88 l20 -60 l18 26 h64 l24 -30 l28 62 l22 -40 h330"
        stroke="#8c2f26"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.2, ease: "easeInOut", delay: 1.3 }}
      />
    </svg>
  );
}
