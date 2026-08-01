"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, TrendingDown, TrendingUp, Sparkles } from "lucide-react";

// The dynamic knowledge base for the hackathon simulation
const getDynamicContent = (title: string) => {
  const t = title.toLowerCase();
  
  if (t.includes("python")) {
    return {
      alignment: 42,
      divergence: "Major updates are required in modern asynchronous web frameworks and AI integration",
      obsolete: [
        { topic: "Python 2.7 Legacy Syntax", hrs: "6 Hours", reason: "Deprecated since 2020. Shifted to Python 3.12+" },
        { topic: "Basic CGI Scripts", hrs: "8 Hours", reason: "Obsolete pattern. Shift to ASGI/WSGI" },
        { topic: "Manual Memory Management", hrs: "4 Hours", reason: "Irrelevant for modern Python development" }
      ],
      missing: [
        { topic: "FastAPI & Asynchronous Python", demand: "High Demand", metric: "+210% YoY" },
        { topic: "AI/ML Integration (LangChain)", demand: "Critical", metric: "+1200% YoY" },
        { topic: "Data Analysis (Pandas/Polars)", demand: "High Demand", metric: "+85% YoY" }
      ]
    };
  }
  
  if (t.includes("web") || t.includes("front")) {
    return {
      alignment: 35,
      divergence: "Critical updates needed in modern reactive frameworks and edge computing",
      obsolete: [
        { topic: "jQuery DOM Manipulation", hrs: "14 Hours", reason: "Replaced by React/Vue virtual DOMs" },
        { topic: "XHTML Standards", hrs: "6 Hours", reason: "Obsolete. Shifted to HTML5 & Semantic UI" },
        { topic: "Float-based Layouts", hrs: "8 Hours", reason: "Shifted to Flexbox & CSS Grid" }
      ],
      missing: [
        { topic: "React Server Components (Next.js)", demand: "Critical", metric: "+340% YoY" },
        { topic: "State Management (Zustand/Redux)", demand: "High Demand", metric: "+120% YoY" },
        { topic: "TailwindCSS & Utility Classes", demand: "High Demand", metric: "+180% YoY" }
      ]
    };
  }

  if (t.includes("ai") || t.includes("machine") || t.includes("artificial")) {
    return {
      alignment: 28,
      divergence: "Massive gap in modern Generative AI paradigms and Transformer architectures",
      obsolete: [
        { topic: "Rule-based Expert Systems", hrs: "12 Hours", reason: "Shifted to statistical learning paradigms" },
        { topic: "Basic Perceptrons (Manual Math)", hrs: "8 Hours", reason: "Automated via PyTorch/TensorFlow" },
        { topic: "Prolog / LISP", hrs: "10 Hours", reason: "Industry standard is Python" }
      ],
      missing: [
        { topic: "Transformer Architectures (LLMs)", demand: "Critical", metric: "+4000% YoY" },
        { topic: "RAG (Retrieval-Augmented Generation)", demand: "Critical", metric: "+2500% YoY" },
        { topic: "Vector Embeddings & Search", demand: "High Demand", metric: "+890% YoY" }
      ]
    };
  }

  // Default / DBMS
  return {
    alignment: 58,
    divergence: "Major updates are required in modern industry tools and cloud-native integration",
    obsolete: [
      { topic: "Legacy Manual Processes", hrs: "8 Hours", reason: "Automated via modern tools" },
      { topic: "Native/Legacy Architectures", hrs: "12 Hours", reason: "Shifted to Application Layer" },
      { topic: "Obsolete Hardware Mechanics", hrs: "4 Hours", reason: "Irrelevant. Shifted to cloud principles" }
    ],
    missing: [
      { topic: "Modern ORMs / SDKs", demand: "High Demand", metric: "+145% YoY" },
      { topic: "Vector Search Integration", demand: "Critical", metric: "+890% YoY" },
      { topic: "Cloud Deployment / Scaling", demand: "High Demand", metric: "+60% YoY" }
    ]
  };
};

export default function AuditResults({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  
  const courseTitle = searchParams.get("course") || "CS304: Database Management";
  const marketBias = searchParams.get("market") || "Bengaluru / Hyderabad Tier-1 Tech Market";
  
  const currentQuery = searchParams.toString();
  const content = getDynamicContent(courseTitle);

  return (
    <div className="p-8 sm:p-12 w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
        <div>
          <div className="text-sm font-mono tracking-widest text-blue-400 uppercase mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Audit Complete
          </div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">{courseTitle}</h1>
          <p className="text-white/50 font-light text-lg">Target: {marketBias}</p>
        </div>
        
        <Link 
          href={`/audit/${id}/patch?${currentQuery}`}
          className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-500 transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]"
        >
          <Sparkles className="w-4 h-4" />
          Generate BoS 15% Fast-Track Patch
        </Link>
      </div>

      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md p-10 mb-12 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
        
        <div className="flex-shrink-0 text-center md:text-left relative z-10">
          <div className="text-sm font-mono tracking-widest text-white/50 uppercase mb-4">Overall Alignment</div>
          <div className="text-8xl font-medium tracking-tighter text-red-400">{content.alignment}<span className="text-6xl">%</span></div>
        </div>
        
        <div className="flex-1 relative z-10">
          <p className="text-xl font-light text-white/80 leading-relaxed">
            This syllabus is <span className="text-red-400 font-medium">highly divergent</span> from current industry demands. 
            {content.divergence} to meet the requirements of {marketBias}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2rem] border border-red-500/20 bg-red-500/5 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
               <TrendingDown className="w-5 h-5 text-red-400" />
             </div>
             <h2 className="text-2xl font-medium">Obsolete Topics</h2>
           </div>
           
           <div className="flex flex-col gap-4">
             {content.obsolete.map((item, i) => (
               <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-black/40">
                 <div>
                   <div className="font-medium text-white/90">{item.topic}</div>
                   <div className="text-xs text-white/50 font-mono mt-1">{item.reason}</div>
                 </div>
                 <div className="text-sm text-red-400 font-mono">{item.hrs}</div>
               </div>
             ))}
           </div>
        </div>

        <div className="p-8 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 backdrop-blur-md">
           <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
               <TrendingUp className="w-5 h-5 text-blue-400" />
             </div>
             <h2 className="text-2xl font-medium">Missing Critical Skills</h2>
           </div>
           
           <div className="flex flex-col gap-4">
             {content.missing.map((item, i) => (
               <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-black/40">
                 <div>
                   <div className="font-medium text-white/90">{item.topic}</div>
                   <div className="text-xs text-blue-400 font-mono mt-1">{item.demand}</div>
                 </div>
                 <div className="text-sm text-white/60 font-mono">{item.metric}</div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
