import { ArrowRight } from "lucide-react";
import { Aurora } from "@/components/ui/aurora";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";

export function CallToAction() {
  return (
    <section className="relative isolate overflow-hidden border-t border-white/5 py-32">
      <Aurora className="opacity-70" />
      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <Reveal>
          <h2 className="text-4xl font-semibold sm:text-5xl">
            Bring your next Board of Studies meeting <span className="text-gradient">evidence</span>.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Audit one course today. If the alignment score does not tell your department something
            it did not already know, you have lost four minutes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href="/login" variant="primary" className="px-6 py-3">
              Audit a syllabus
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </ButtonLink>
            <ButtonLink href="#pipeline" variant="outline" className="px-6 py-3">
              Read the workflow
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-faint">
            Institutional accounts only. Uploaded syllabi stay private to your institution and are
            never used to train public models.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
