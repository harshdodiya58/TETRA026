import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { GapTimeline } from "@/components/landing/gap-timeline";
import { Pipeline } from "@/components/landing/pipeline";
import { TelemetryPreview } from "@/components/landing/telemetry-preview";
import { Compliance } from "@/components/landing/compliance";
import { CallToAction } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <Hero />
        <GapTimeline />
        <Pipeline />
        <TelemetryPreview />
        <Compliance />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
