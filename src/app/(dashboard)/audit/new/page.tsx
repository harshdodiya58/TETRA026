"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, ArrowRight, BookOpen, MapPin } from "lucide-react";

export default function NewAuditSetup() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [courseTitle, setCourseTitle] = useState("");
  const [marketBias, setMarketBias] = useState("Bengaluru / Hyderabad Tier-1 Tech Market");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const startAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    const auditId = Math.random().toString(36).substring(7);
    const query = new URLSearchParams({
      course: courseTitle || "Untitled Course",
      market: marketBias,
    }).toString();

    router.push(`/audit/${auditId}/processing?${query}`);
  };

  return (
    <div className="p-8 sm:p-12 w-full max-w-5xl mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-medium tracking-tight mb-2">New Syllabus Audit</h1>
        <p className="text-white/50 font-light">Upload a course syllabus to initiate the AI alignment pipeline.</p>
      </div>

      <form onSubmit={startAudit} className="flex flex-col gap-8 w-full max-w-3xl mx-auto">
        {/* Upload Zone */}
        <div 
          className={`relative w-full h-64 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all duration-300 ${
            isDragging ? 'border-blue-500 bg-blue-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex flex-col items-center text-green-400">
              <FileCheckIcon className="w-12 h-12 mb-4" />
              <div className="font-medium text-lg">{file.name}</div>
              <div className="text-sm opacity-60">Ready for processing</div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-white/60 pointer-events-none">
              <UploadCloud className="w-12 h-12 mb-4 text-white/40" />
              <div className="font-medium text-lg mb-1">Drag & Drop Syllabus Document</div>
              <div className="text-sm font-light">Supports .PDF and .DOCX up to 50MB</div>
            </div>
          )}
          
          <input 
            type="file" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            accept=".pdf,.doc,.docx"
            onChange={(e) => e.target.files && setFile(e.target.files[0])}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono flex items-center gap-2">
              <BookOpen className="w-3 h-3" /> Course Code & Title
            </label>
            <input 
              type="text" 
              required
              placeholder="e.g. CS101: Python Programming"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 transition-all font-light"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/50 uppercase tracking-widest font-mono flex items-center gap-2">
              <MapPin className="w-3 h-3" /> Target Job Market Bias
            </label>
            <select 
              value={marketBias}
              onChange={(e) => setMarketBias(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-light appearance-none cursor-pointer"
            >
              <option value="Bengaluru / Hyderabad Tier-1 Tech Market">Bengaluru / Hyderabad Tier-1 Tech Market</option>
              <option value="National Average (India)">National Average (India)</option>
              <option value="NASSCOM FutureSkills Prime Standard">NASSCOM FutureSkills Prime Standard</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={!file}
          className="group mt-4 flex items-center justify-center gap-3 text-sm font-medium uppercase tracking-widest px-8 py-5 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 w-full"
        >
          Initialize AI Telemetry Pipeline
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </form>
    </div>
  );
}

function FileCheckIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}
