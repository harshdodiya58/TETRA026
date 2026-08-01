"use client";

import { useState, useEffect, use } from "react";
import { Cpu, FileDown, CheckCircle2, Send, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PatchGeneration({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseTitle = searchParams.get("course") || "CS304 Database Management";
  const marketBias = searchParams.get("market") || "Bengaluru / Hyderabad Tier-1 Tech Market";

  const [streamedText, setStreamedText] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawText, setRawText] = useState("");

  useEffect(() => {
    let streamInterval: NodeJS.Timeout;

    const generatePatch = async () => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course: courseTitle, market: marketBias }),
        });
        
        const data = await res.json();
        
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to generate patch from API.");
        }

        const fullPatchText = data.text || "";
        setRawText(fullPatchText);

        // Simulate the token streaming effect for the UI
        let currentIndex = 0;
        streamInterval = setInterval(() => {
          // Add a safety check
          if (fullPatchText && currentIndex < fullPatchText.length) {
            setStreamedText(fullPatchText.slice(0, currentIndex + 5));
            currentIndex += 5;
          } else {
            clearInterval(streamInterval);
            setIsGenerating(false);
          }
        }, 20);
      } catch (e: any) {
        console.error("Patch Generation Error:", e);
        setIsGenerating(false);
        setStreamedText(`Error: ${e.message || "Failed to connect to AI API. Did you restart the server after adding the .env.local file?"}`);
      }
    };

    generatePatch();

    return () => clearInterval(streamInterval);
  }, [courseTitle, marketBias]);

  const exportAsWord = () => {
    // Generate a markdown file that acts as our "document"
    const blob = new Blob([rawText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BoS_Patch_${courseTitle.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const submitToCouncil = async () => {
    setIsSubmitting(true);
    // Simulate a network request to submit
    await new Promise(r => setTimeout(r, 1500));
    setIsSubmitting(false);
    // Redirect to dashboard (vault) after submission
    router.push('/dashboard/vault');
  };

  return (
    <div className="p-8 sm:p-12 w-full max-w-5xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="text-sm font-mono tracking-widest text-purple-400 uppercase mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> AI Patch Generation
          </div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">BoS Revision Proposal</h1>
          <p className="text-white/50 font-light text-lg">Streaming via NVIDIA NIM (Llama-3.3-70b-instruct)</p>
        </div>
      </div>

      {/* Generation Canvas */}
      <div className="w-full flex-1 rounded-[2rem] border border-white/10 bg-[#050505] shadow-2xl overflow-hidden flex flex-col mb-8 relative">
        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             <span className="text-xs text-white/40 font-mono ml-4">Llama-3.3-70b Streaming...</span>
          </div>
          {isGenerating ? (
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </span>
               ~ 74 TPS
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-green-400">
               <CheckCircle2 className="w-4 h-4" /> Generation Complete
            </div>
          )}
        </div>

        <div className="p-8 md:p-12 prose prose-invert max-w-none font-sans text-white/80 leading-relaxed prose-h2:font-medium prose-h2:tracking-tight prose-h3:font-medium prose-h3:text-white prose-li:text-white/70">
           {/* We use a simple whitespace-pre-wrap to maintain the formatting of our simulated markdown */}
           <div className="whitespace-pre-wrap">{streamedText}</div>
           {isGenerating && <span className="inline-block w-2 h-5 bg-white/50 animate-pulse ml-1 align-middle" />}
        </div>
      </div>

      {/* Actions */}
      <div className={`transition-all duration-700 flex flex-col md:flex-row gap-4 justify-end ${isGenerating ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
         <button 
           onClick={exportAsWord}
           className="flex items-center justify-center gap-3 px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all active:scale-95"
         >
           <FileDown className="w-4 h-4" />
           Export as Document (.md)
         </button>
         <button 
           onClick={submitToCouncil}
           disabled={isSubmitting}
           className="flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-500 transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-70"
         >
           {isSubmitting ? (
             <Loader2 className="w-4 h-4 animate-spin" />
           ) : (
             <Send className="w-4 h-4" />
           )}
           {isSubmitting ? 'Submitting...' : 'Submit to Academic Council'}
         </button>
      </div>

    </div>
  );
}
