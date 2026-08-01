"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Database, Activity, Cpu, CheckCircle2, Loader2 } from "lucide-react";

export default function ProcessingTelemetryHUD({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  
  // HUD Metrics State
  const [metrics, setMetrics] = useState({
    chunks: 0,
    vectors: 0,
    graphHops: 0,
    tps: 0,
  });

  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    // Master Simulation Sequence for the Hackathon Pitch
    const sequence = async () => {
      // Phase 1: Ingestion & Chunking
      setActivePhase(0);
      addLog("INIT", "Connecting to Syllabus Parsing Engine...");
      await sleep(800);
      addLog("PARSE", "Extracting PDF Metadata...");
      await sleep(600);
      
      const chunkInterval = setInterval(() => {
        setMetrics(m => ({ ...m, chunks: Math.min(18, m.chunks + 1) }));
      }, 200);
      addLog("CHUNK", "Semantic chunking algorithm active (Overlap: 15%)");
      await sleep(3600);
      clearInterval(chunkInterval);

      // Phase 2: Embedding Generation (NVIDIA NIM)
      setActivePhase(1);
      setProgress(25);
      addLog("NIM_API", "Initializing nvidia/nemotron-3-embed-1b");
      await sleep(1000);
      
      const vectorInterval = setInterval(() => {
        setMetrics(m => ({ ...m, vectors: Math.min(1024, m.vectors + 84) }));
      }, 100);
      addLog("EMBED", "Generating 1024-Dimensional dense vectors...");
      await sleep(2500);
      clearInterval(vectorInterval);
      setMetrics(m => ({ ...m, vectors: 1024 }));

      // Phase 3: pgvector & Neo4j Traversal
      setActivePhase(2);
      setProgress(50);
      addLog("DB_QUERY", "Executing pgvector HNSW cosine distance search (Latency: 18ms)");
      await sleep(1200);
      addLog("GRAPH_DB", "Querying Neo4j AuraDB for skill prerequisites...");
      
      const graphInterval = setInterval(() => {
        setMetrics(m => ({ ...m, graphHops: Math.min(1240, m.graphHops + 124) }));
      }, 150);
      await sleep(3000);
      clearInterval(graphInterval);
      setMetrics(m => ({ ...m, graphHops: 1240 }));

      // Phase 4: Patch Generation (Llama-3.3-70b)
      setActivePhase(3);
      setProgress(75);
      addLog("NIM_INFERENCE", "Prompting meta/llama-3.3-70b-instruct (Constraint: 15% Max)");
      await sleep(800);
      addLog("GENERATION", "Streaming patch proposals...");
      
      const tpsInterval = setInterval(() => {
        setMetrics(m => ({ ...m, tps: 65 + Math.floor(Math.random() * 10) }));
      }, 500);
      
      // Simulate progress bar moving to 100%
      for(let i=75; i<=100; i+=2) {
        setProgress(i);
        await sleep(100);
      }
      
      clearInterval(tpsInterval);
      setMetrics(m => ({ ...m, tps: 0 }));
      addLog("SUCCESS", "Syllabus Micro-Augmentation Patch Generated.");
      
      await sleep(1500);
      
      // Route to results, carrying forward the query parameters
      const currentQuery = searchParams.toString();
      router.push(`/audit/${id}/results?${currentQuery}`);
    };

    sequence();
  }, []);

  const addLog = (tag: string, msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString().substring(11,19)}] [${tag}] ${msg}`]);
  };

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  return (
    <div className="p-8 sm:p-12 w-full max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-12">
        <h1 className="text-4xl font-medium tracking-tight mb-2">Live AI Telemetry HUD</h1>
        <p className="text-white/50 font-light">Real-time processing metrics for Audit Session {id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Left Column: Live Metrics */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <MetricCard 
            icon={<Terminal className="w-5 h-5 text-blue-400" />}
            title="Semantic Chunks"
            value={`${metrics.chunks}/18`}
            desc="Syllabus sub-topics extracted"
            active={activePhase === 0}
            completed={activePhase > 0}
          />
          <MetricCard 
            icon={<Cpu className="w-5 h-5 text-purple-400" />}
            title="Vector Dimensionality"
            value={metrics.vectors.toString()}
            desc="NVIDIA nemotron-3-embed-1b"
            active={activePhase === 1}
            completed={activePhase > 1}
          />
          <MetricCard 
            icon={<Activity className="w-5 h-5 text-green-400" />}
            title="Knowledge Graph Hops"
            value={metrics.graphHops.toString()}
            desc="Neo4j Concept -> Skill Traversal"
            active={activePhase === 2}
            completed={activePhase > 2}
          />
          <MetricCard 
            icon={<Database className="w-5 h-5 text-orange-400" />}
            title="Tokens Per Second (TPS)"
            value={`${metrics.tps} TPS`}
            desc="Llama-3.3-70b-instruct streaming"
            active={activePhase === 3}
            completed={activePhase > 3}
          />
        </div>

        {/* Right Column: Terminal & Progress */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="w-full bg-[#050505] border border-white/10 rounded-2xl p-6 flex-1 flex flex-col font-mono text-sm shadow-2xl relative overflow-hidden">
             {/* Terminal Header */}
             <div className="flex gap-2 mb-6 pb-4 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             
             {/* Terminal Logs */}
             <div className="flex-1 overflow-y-auto flex flex-col gap-2 text-white/70">
                {logs.map((log, i) => {
                  const isSuccess = log.includes("[SUCCESS]");
                  return (
                    <div key={i} className={`flex ${isSuccess ? 'text-green-400 font-bold' : ''}`}>
                      <span className="text-white/30 mr-4">{`>`}</span>
                      {log}
                    </div>
                  );
                })}
                <div className="animate-pulse text-white/50">_</div>
             </div>
          </div>

          {/* Master Progress Bar */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6">
             <div className="flex justify-between items-end mb-4">
                <div className="text-sm font-mono text-white/50 uppercase tracking-widest">Pipeline Progress</div>
                <div className="text-2xl font-medium font-mono">{progress}%</div>
             </div>
             <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, desc, active, completed }: any) {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-500 ${
      active 
        ? 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]' 
        : completed
          ? 'border-white/20 bg-white/5 opacity-60'
          : 'border-white/5 bg-black/40 opacity-30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-xs text-white/40 uppercase tracking-widest font-mono">{title}</div>
        </div>
        {active && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
        {completed && <CheckCircle2 className="w-4 h-4 text-green-400" />}
      </div>
      <div className="text-4xl font-medium tracking-tight mb-2 font-mono">{value}</div>
      <div className="text-xs text-white/50">{desc}</div>
    </div>
  );
}
