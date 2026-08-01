"use client";

import { useState } from "react";
import { Settings, Shield, Key, Bell, Building2, CheckCircle2, Lock, Mail, Smartphone, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Institution Profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 1500);
  };

  const tabs = [
    { name: "Institution Profile", icon: <Building2 className="w-4 h-4" /> },
    { name: "API Integrations", icon: <Key className="w-4 h-4" /> },
    { name: "Security & Access", icon: <Shield className="w-4 h-4" /> },
    { name: "Notifications", icon: <Bell className="w-4 h-4" /> },
  ];

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
        
        {/* Navigation / Tabs */}
        <div className="md:col-span-1 flex flex-col gap-2">
           {tabs.map((tab, i) => (
             <button 
               key={i}
               onClick={() => setActiveTab(tab.name)}
               className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all font-light text-sm text-left ${
                 activeTab === tab.name 
                   ? "bg-white/10 text-white border border-white/10 shadow-lg" 
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
           
           {/* INSTITUTION PROFILE */}
           {activeTab === "Institution Profile" && (
             <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
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
           )}

           {/* API INTEGRATIONS */}
           {activeTab === "API Integrations" && (
             <>
               <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-medium">NVIDIA NIM Integration</h2>
                   <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono flex items-center gap-2">
                     <CheckCircle2 className="w-3 h-3" /> Active
                   </div>
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

               <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-medium">Database Integrations</h2>
                   <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono">Pending</div>
                 </div>
                 
                 <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Supabase URL</label>
                      <input 
                        type="text" 
                        defaultValue="sb_publishable_..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 focus:outline-none focus:border-blue-500/50 transition-all font-light text-sm"
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Neo4j URI</label>
                      <input 
                        type="text" 
                        defaultValue="https://console.neo4j.io/..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/50 focus:outline-none focus:border-blue-500/50 transition-all font-light text-sm"
                        disabled
                      />
                    </div>
                 </div>
               </div>
             </>
           )}

           {/* SECURITY & ACCESS */}
           {activeTab === "Security & Access" && (
             <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-medium mb-6">Access Control</h2>
               
               <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">Two-Factor Authentication</div>
                        <div className="text-sm font-light text-white/50">Add an extra layer of security to your account.</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
                      Enable
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">Single Sign-On (SSO)</div>
                        <div className="text-sm font-light text-white/50">Enforce SAML authentication for your faculty.</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors">
                      Configure
                    </button>
                  </div>
               </div>
             </div>
           )}

           {/* NOTIFICATIONS */}
           {activeTab === "Notifications" && (
             <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h2 className="text-xl font-medium mb-6">Alert Preferences</h2>
               
               <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 text-white/60">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white">Email Alerts</div>
                        <div className="text-sm font-light text-white/50">Receive syllabus compliance reports via email.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 text-white/60">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-white">Push Notifications</div>
                        <div className="text-sm font-light text-white/50">Get instantly notified when Board of Studies approves a patch.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
               </div>
             </div>
           )}

           <div className="flex justify-end mt-4">
              <button 
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-medium transition-all shadow-[0_0_30px_-5px_rgba(37,99,235,0.4)] ${
                  isSaved 
                    ? "bg-green-600 text-white" 
                    : isSaving 
                      ? "bg-blue-600/70 text-white/70" 
                      : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                }`}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaved && <CheckCircle2 className="w-4 h-4" />}
                {isSaved ? "Saved Successfully" : isSaving ? "Saving..." : "Save Preferences"}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
