"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Settings, LogOut, Activity } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "New Audit", href: "/audit/new", icon: <Activity className="w-5 h-5" /> },
    { name: "Syllabi Vault", href: "/dashboard/vault", icon: <FileText className="w-5 h-5" /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen w-full bg-black text-white font-sans flex overflow-hidden">
      <div className="noise" />
      
      {/* Sleek Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] backdrop-blur-3xl flex flex-col justify-between py-8 px-6 relative z-20">
        <div>
          <div className="text-xl font-bold tracking-tight mb-12">
            CurriPulse<span className="text-white/50">.ai</span>
          </div>
          
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-light ${
                    isActive 
                      ? "bg-white/10 text-white border border-white/10" 
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div className="mb-6 px-4 py-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-transparent border border-blue-500/20">
            <div className="text-xs font-mono text-blue-400 mb-1">NVIDIA NIM</div>
            <div className="text-sm font-light text-white/80">API Connected</div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:bg-white/5 hover:text-white transition-all duration-300 font-light"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 overflow-y-auto h-screen bg-black/90">
        {children}
      </main>
    </div>
  );
}
