"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Reuse the canvas for the login background for that premium feel
const CanvasScene = dynamic(() => import("@/components/CanvasScene"), { ssr: false });

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login for hackathon presentation - instantly route to dashboard
    router.push("/dashboard");
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center selection:bg-white/30 text-white font-sans overflow-hidden">
      <div className="noise" />
      
      {/* Background WebGL heavily blurred so it doesn't distract from login */}
      <div className="absolute inset-0 z-0 opacity-50 blur-xl scale-110 pointer-events-none">
        <CanvasScene />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 rounded-[2rem] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 flex items-center justify-center mb-6">
            <Lock className="w-5 h-5 text-white/70" />
          </div>
          <h1 className="text-3xl font-medium tracking-tight mb-2">Institutional Login</h1>
          <p className="text-white/50 text-sm font-light">
            Secure SSO access for University Deans & Faculty.
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Email Address</label>
            <input 
              type="email" 
              required
              defaultValue="dean@university.edu.in"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-light"
              placeholder="name@university.edu.in"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Password / Magic Link</label>
            <input 
              type="password" 
              required
              defaultValue="password123"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-light"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="group mt-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest px-8 py-4 rounded-xl bg-white text-black hover:scale-[1.02] transition-transform duration-300 w-full">
            Authenticate
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/" className="text-xs text-white/40 hover:text-white transition-colors">
            &larr; Return to CurriPulse.ai Home
          </Link>
        </div>
      </div>
    </main>
  );
}
