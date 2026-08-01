"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { PaperField } from "@/components/ui/paper-field";
import { ButtonLink } from "@/components/ui/button";
import { PulseTrace } from "@/components/ui/pulse-trace";

const ACCREDITORS = ["VTU", "Anna University", "GTU", "NBA", "NAAC", "NASSCOM FutureSkills"];

const rise = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-40 pb-20 sm:pt-48 sm:pb-28">
      <PaperField />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.1, delayChildren: 0.05 }}
        className="relative mx-auto max-w-4xl px-6"
      >
        <motion.p
          variants={rise}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="small-caps text-xs text-accent"
        >
          Academic audit engine · Outcome-Based Education native
        </motion.p>

        <motion.h1
          variants={rise}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-5xl leading-[1.06] sm:text-6xl md:text-[4.25rem]"
        >
          Bridge the <span className="marked">three-year</span> higher education gap in thirty
          seconds.
        </motion.h1>

        <motion.p
          variants={rise}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-2xl font-serif text-xl leading-[1.65] text-muted"
        >
          Your syllabus is revised every three to five years. The stack it teaches turns over every
          three to six months. CurriPulse audits the syllabus you already have against live Indian
          tech hiring data, then drafts a fifteen per cent micro-augmentation patch that clears
          Board of Studies fast-track — leaving course code, credits, and core theory untouched.
        </motion.p>

        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <ButtonLink href="/login" variant="primary" className="px-6 py-3">
            Audit a syllabus
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </ButtonLink>
          <ButtonLink href="#pipeline" variant="outline" className="px-6 py-3">
            Read the workflow
          </ButtonLink>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.5 }}
        className="relative mx-auto mt-20 max-w-6xl px-6"
      >
        <div className="flex items-baseline justify-between border-b border-[#d6d0c4] pb-2">
          <span className="small-caps text-[11px] text-faint">CS304 syllabus</span>
          <span className="small-caps text-[11px] text-accent">Market demand</span>
        </div>
        <PulseTrace />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.6 }}
        className="relative mx-auto mt-10 max-w-5xl px-6"
      >
        <p className="small-caps text-center text-[11px] text-faint">
          Built around the frameworks Indian academic councils audit against
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {ACCREDITORS.map((name) => (
            <span key={name} className="font-serif text-sm text-muted">
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
