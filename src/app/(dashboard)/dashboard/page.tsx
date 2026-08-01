"use client";

import Link from "next/link";
import { Plus, ArrowRight, FileCheck2, AlertCircle } from "lucide-react";

export default function DashboardOverview() {
  const recentAudits = [
    { id: 1, course: "CS304: Database Management", market: "Bengaluru Tech Hub", status: "Completed", score: "58%", date: "Today" },
    { id: 2, course: "CS401: Artificial Intelligence", market: "National Average", status: "Completed", score: "82%", date: "Yesterday" },
    { id: 3, course: "EC202: Signals & Systems", market: "NASSCOM FutureSkills", status: "Pending BoS", score: "65%", date: "3 days ago" },
  ];

  return (
    <div className="p-8 sm:p-12 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 className="text-4xl font-medium tracking-tight mb-2">Institutional Overview</h1>
          <p className="text-white/50 font-light">Monitor curriculum alignment and BoS proposals across departments.</p>
        </div>
        <Link 
          href="/audit/new"
          className="group flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium text-sm hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          New Syllabus Audit
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {[
          { label: "Institutional Alignment", value: "68%", sub: "Compared to industry demands" },
          { label: "Pending BoS Approvals", value: "4", sub: "15% Micro-patches generated" },
          { label: "NIM Generation Quota", value: "850/1000", sub: "Free Llama-3.3 credits remaining" }
        ].map((kpi, i) => (
          <div key={i} className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md">
            <div className="text-sm font-mono text-white/40 tracking-widest uppercase mb-6">{kpi.label}</div>
            <div className="text-5xl font-medium tracking-tighter mb-2">{kpi.value}</div>
            <div className="text-sm font-light text-white/50">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Audits Table */}
      <div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-xl font-medium">Recent Audits</h2>
          <button className="text-sm text-white/50 hover:text-white transition-colors">View All &rarr;</button>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-xs uppercase tracking-widest text-white/30 font-mono border-b border-white/5 bg-black/20">
                <th className="px-8 py-4 font-normal">Course</th>
                <th className="px-8 py-4 font-normal">Target Market</th>
                <th className="px-8 py-4 font-normal">Status</th>
                <th className="px-8 py-4 font-normal">Alignment Score</th>
                <th className="px-8 py-4 font-normal">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm font-light">
              {recentAudits.map((audit) => (
                <tr key={audit.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 font-medium text-white/90">{audit.course}</td>
                  <td className="px-8 py-6 text-white/60">{audit.market}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-xs border ${
                      audit.status === 'Completed' ? 'border-green-500/20 text-green-400 bg-green-500/10' : 'border-yellow-500/20 text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {audit.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[100px] h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: audit.score }} />
                      </div>
                      <span className="text-white/60 font-mono">{audit.score}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
