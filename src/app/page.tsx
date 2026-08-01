"use client";

import dynamic from 'next/dynamic';
import SmoothScroll from '@/components/SmoothScroll';
import Link from 'next/link';
import { ArrowRight, Activity, Database, Cpu } from 'lucide-react';

const CanvasScene = dynamic(() => import('@/components/CanvasScene'), {
  ssr: false,
});

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative min-h-screen w-full selection:bg-white/30 text-white font-sans">
        <div className="noise" />
        <CanvasScene />

        {/* Minimal Navbar - Fuch.ai style */}
        <nav className="fixed top-0 left-0 w-full px-6 py-6 flex justify-between items-center z-50 mix-blend-difference pointer-events-auto">
          <div className="text-xl font-bold tracking-tight">CurriPulse<span className="text-white/50">.ai</span></div>
          <Link href="/login" className="text-sm font-medium px-5 py-2.5 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md">
            Login via SSO
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="min-h-screen w-full flex flex-col justify-center px-6 sm:px-12 relative z-10 pt-20">
          <div className="max-w-[90vw] mx-auto w-full">
            <h1 className="text-[12vw] sm:text-[9vw] font-medium leading-[0.85] tracking-[-0.04em] mix-blend-difference">
              Bridge the 3-Year <br />
              <span className="font-serif italic font-light opacity-90 pr-4">Education Gap</span> <br />
              in 30 Seconds.
            </h1>
            
            <div className="mt-16 sm:mt-24 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
              <p className="text-lg sm:text-xl max-w-md text-white/60 font-light leading-relaxed mix-blend-difference">
                Enterprise-grade academic audit and syllabus micro-augmentation for Indian higher education institutions. Fully compliant with OBE & NAAC standards.
              </p>
              
              <Link href="/login" className="group flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest px-8 py-5 rounded-full bg-white text-black hover:scale-[1.02] transition-transform duration-300">
                Run Syllabus Audit
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: The 15% Fast-Track Rule */}
        <section className="min-h-[120vh] w-full flex flex-col items-center justify-center px-6 relative z-10 mt-32">
          <div className="max-w-5xl w-full mx-auto text-center">
             <h2 className="text-4xl sm:text-6xl md:text-8xl font-medium tracking-tighter leading-none mb-12 mix-blend-difference">
               The 15% <span className="font-serif italic font-light opacity-80">Fast-Track.</span>
             </h2>
             <p className="text-xl sm:text-3xl text-white/50 font-light leading-relaxed max-w-3xl mx-auto mix-blend-difference">
                Changing more than 15% of a core syllabus triggers a two-year Academic Council bottleneck. Our semantic vector engine identifies the critical industry gaps and generates exactly a <span className="text-white">15% micro-augmentation patch</span>—ready for immediate Board of Studies (BoS) approval.
             </p>
          </div>
        </section>

        {/* Section 3: Live Telemetry HUD */}
        <section className="min-h-screen w-full flex flex-col justify-center px-6 relative z-10 py-32 bg-black/40 backdrop-blur-md border-y border-white/5">
           <div className="max-w-[90vw] mx-auto w-full">
              <h2 className="text-3xl sm:text-5xl font-medium tracking-tighter mb-16 font-serif italic text-white/90">
                Live AI Telemetry
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
                {[
                  { icon: <Database className="w-5 h-5 text-blue-400" />, label: "pgvector HNSW Lookup", value: "18ms", desc: "Cosine distance matrix calculated." },
                  { icon: <Activity className="w-5 h-5 text-green-400" />, label: "Knowledge Graph", value: "1,240", desc: "Active concept nodes traversed." },
                  { icon: <Cpu className="w-5 h-5 text-purple-400" />, label: "Tokens Per Second", value: "70 TPS", desc: "NVIDIA NIM inference streaming." },
                  { icon: <Database className="w-5 h-5 text-orange-400" />, label: "Bloom's Taxonomy", value: "Level 4", desc: "Verified 'Analyze' action verb constraint." }
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col justify-between h-48">
                    <div className="flex items-center gap-3">
                      {stat.icon}
                      <div className="text-xs text-white/40 uppercase tracking-widest">{stat.label}</div>
                    </div>
                    <div>
                      <div className="text-4xl font-medium tracking-tight mb-2">{stat.value}</div>
                      <div className="text-xs text-white/50 font-sans">{stat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Section 4: AI Stack */}
        <section className="min-h-[80vh] w-full flex flex-col justify-center px-6 relative z-10 pb-32 mt-32">
           <div className="max-w-[90vw] mx-auto w-full">
              <div className="flex flex-col md:flex-row gap-6">
                {[
                  { title: "Neo4j AuraDB", desc: "Mapping skill dependencies, prerequisite concepts, and tech hub job roles." },
                  { title: "NVIDIA NIM", desc: "Llama-3.3-70b-instruct generating OBE-compliant syllabus patches." },
                  { title: "Supabase Vector", desc: "1024-dimensional job vectors matched against syllabus chunks." }
                ].map((item, i) => (
                  <div key={i} className="flex-1 p-8 sm:p-12 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-2xl hover:bg-white/[0.05] transition-colors duration-500 group flex flex-col justify-between min-h-[300px]">
                    <div>
                      <div className="text-sm text-white/40 mb-6 font-mono tracking-widest">STACK 0{i+1}</div>
                      <h3 className="text-3xl sm:text-4xl font-medium mb-4 font-serif italic">{item.title}</h3>
                    </div>
                    <div className="flex justify-between items-end">
                       <p className="text-white/60 font-light leading-relaxed max-w-[80%]">{item.desc}</p>
                       <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                         <ArrowRight className="w-4 h-4" />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </section>

      </main>
    </SmoothScroll>
  );
}
