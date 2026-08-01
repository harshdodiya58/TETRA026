"use client";

import { motion } from "motion/react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Aurora } from "@/components/ui/aurora";
import { ButtonLink } from "@/components/ui/button";
import { PulseTrace } from "@/components/ui/pulse-trace";

const ACCREDITORS = ["VTU", "Anna University", "GTU", "NBA", "NAAC", "NASSCOM FutureSkills"];

const rise = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-40 pb-24 sm:pt-48 sm:pb-32">
      <Aurora />

      <motion.div
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.11, delayChildren: 0.1 }}
        className="relative mx-auto max-w-4xl px-6 text-center"
      >
        <motion.div
          variants={rise}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-muted backdrop-blur"
        >
          <ShieldCheck className="size-3.5 text-pulse" />
          <span>Outcome-Based Education native · NBA &amp; NAAC ready</span>
        </motion.div>

        <motion.h1
          variants={rise}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl font-semibold leading-[1.05] sm:text-6xl md:text-7xl"
        >
          Bridge the <span className="text-gradient">3-year</span> higher education gap in 30 seconds.
        </motion.h1>

        <motion.p
          variants={rise}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted"
        >
          Your syllabus is revised every three to five years. The stack it teaches turns over every
          three to six months. CurriPulse audits the syllabus you already have against live Indian
          tech hiring data, then drafts a 15% micro-augmentation patch that clears Board of Studies
          fast-track — leaving course code, credits, and core theory untouched.
        </motion.p>

        <motion.div
          variants={rise}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <ButtonLink href="/login" variant="primary" className="px-6 py-3">
            Audit a syllabus
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </ButtonLink>
          <ButtonLink href="#pipeline" variant="outline" className="px-6 py-3">
            See how it works
          </ButtonLink>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.6 }}
        className="relative mx-auto mt-16 max-w-6xl px-6"
      >
        <PulseTrace />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.5 }}
        className="relative mx-auto mt-6 max-w-5xl px-6"
      >
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-faint">
          Built around the frameworks Indian academic councils actually audit against
        </p>
        <div className="mask-fade-x mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {ACCREDITORS.map((name) => (
            <span key={name} className="text-sm font-medium text-faint transition-colors hover:text-muted">
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
