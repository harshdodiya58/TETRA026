"use client";

import { Settings, Shield, Key, Bell, Building2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 sm:p-12 w-full max-w-5xl mx-auto h-full flex flex-col">
      <div className="mb-12">
        <div className="text-sm font-mono tracking-widest text-blue-400 uppercase mb-4 flex items-center gap-2">
           <Settings className="w-4 h-4" /> Preferences
        </div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">Platform Settings</h1>
        <p className="text-white/50 font-light">Manage your institution profile, API integrations, and access controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Navigation / Tabs (Static for Demo) */}
        <div className="md:col-span-1 flex flex-col gap-2">
           {[
             { name: "Institution Profile", icon: <Building2 className="w-4 h-4" />, active: true },
             { name: "API Integrations", icon: <Key className="w-4 h-4" />, active: false },
             { name: "Security & Access", icon: <Shield className="w-4 h-4" />, active: false },
             { name: "Notifications", icon: <Bell className="w-4 h-4" />, active: false },
           ].map((tab, i) => (
             <button 
               key={i}
               className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all font-light text-sm text-left ${
                 tab.active 
                   ? "bg-white/10 text-white border border-white/10" 
                   : "text-white/50 hover:bg-white/5 hover:text-white border border-transparent"
               }`}
             >
               {tab.icon}
               {tab.name}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 flex flex-col gap-8">
           
           <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md">
             <h2 className="text-xl font-medium mb-6">Institution Details</h2>
             
             <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono">University Name</label>
                  <input 
                    type="text" 
                    defaultValue="National Institute of Technology"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-light"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Accreditation Body</label>
                  <select className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all font-light appearance-none cursor-pointer">
                    <option>NBA (National Board of Accreditation)</option>
                    <option>NAAC (National Assessment and Accreditation Council)</option>
                    <option>AICTE</option>
                  </select>
                </div>
             </div>
           </div>

           <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-medium">NVIDIA NIM Integration</h2>
               <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">Active</div>
             </div>
             
             <div className="flex flex-col gap-4">
                <p className="text-sm text-white/50 font-light mb-2">Connect your NVIDIA API key for Llama 3.3 patch generation and NeMo embeddings.</p>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono">API Key</label>
                  <div className="flex gap-4">
                    <input 
                      type="password" 
                      defaultValue="nvapi-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 focus:outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                      disabled
                    />
                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors">
                      Update
                    </button>
                  </div>
                </div>
             </div>
           </div>

           <div className="flex justify-end mt-4">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-colors shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)]">
                Save Preferences
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
