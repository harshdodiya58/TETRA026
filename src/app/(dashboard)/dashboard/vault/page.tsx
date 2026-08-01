"use client";

import { FileText, Download, MoreHorizontal } from "lucide-react";

export default function SyllabiVault() {
  const documents = [
    { id: 1, name: "CS304_Syllabus_2023.pdf", department: "Computer Science", date: "Oct 12, 2025", size: "2.4 MB" },
    { id: 2, name: "EC202_Core_Modules.docx", department: "Electronics", date: "Sep 28, 2025", size: "1.1 MB" },
    { id: 3, name: "ME101_Engineering_Drawing.pdf", department: "Mechanical", date: "Aug 15, 2025", size: "5.7 MB" },
    { id: 4, name: "CS401_AI_Elective.pdf", department: "Computer Science", date: "Jul 04, 2025", size: "3.2 MB" },
  ];

  return (
    <div className="p-8 sm:p-12 w-full max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-12">
        <div className="text-sm font-mono tracking-widest text-blue-400 uppercase mb-4 flex items-center gap-2">
           <FileText className="w-4 h-4" /> Document Storage
        </div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Syllabi Vault</h1>
        <p className="text-white/50 font-light">Secure institutional storage for all uploaded curriculum documents.</p>
      </div>

      <div className="w-full flex-1 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-white/10 bg-white/[0.01]">
          <input 
            type="text" 
            placeholder="Search documents by name or department..." 
            className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-all font-light"
          />
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs uppercase tracking-widest text-white/30 font-mono border-b border-white/5 bg-black/20">
              <th className="px-8 py-4 font-normal">Document Name</th>
              <th className="px-8 py-4 font-normal">Department</th>
              <th className="px-8 py-4 font-normal">Upload Date</th>
              <th className="px-8 py-4 font-normal">Size</th>
              <th className="px-8 py-4 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 font-medium text-white/90 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-white/40" />
                  {doc.name}
                </td>
                <td className="px-8 py-6 text-white/60">{doc.department}</td>
                <td className="px-8 py-6 text-white/60">{doc.date}</td>
                <td className="px-8 py-6 text-white/60 font-mono">{doc.size}</td>
                <td className="px-8 py-6">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
