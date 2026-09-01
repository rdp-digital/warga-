import React from "react";
import {
  LayoutDashboard,
  Users,
  FileText,
  MapPin,
  History,
  LogOut,
  Code2,
  Building2,
  Database,
  ShieldCheck,
  Mail,
  Download,
  Smartphone
} from "lucide-react";
import { ConfigStatus } from "../types";

export type ActiveTab = "dashboard" | "surat" | "penduduk" | "rt" | "kk" | "logs" | "settings";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  configStatus: ConfigStatus;
  onOpenSetupModal: () => void;
  onLogout: () => void;
  totalPendudukCount: number;
  totalKKCount: number;
  auditLogsCount: number;
  totalSuratCount?: number;
  onOpenCreateModal?: () => void;
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  configStatus,
  onOpenSetupModal,
  onLogout,
  totalPendudukCount,
  totalKKCount,
  auditLogsCount,
  totalSuratCount = 0,
  onOpenInstallModal,
  isInstalled = false
}) => {
  const menuItems = [
    {
      id: "dashboard" as ActiveTab,
      label: "Dashboard Statistik",
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: "surat" as ActiveTab,
      label: "Layanan Surat Desa",
      icon: Mail,
      badge: totalSuratCount > 0 ? `${totalSuratCount}` : "BARU"
    },
    {
      id: "penduduk" as ActiveTab,
      label: "Data Penduduk",
      icon: Users,
      badge: totalPendudukCount > 0 ? `${totalPendudukCount}` : null
    },
    {
      id: "rt" as ActiveTab,
      label: "Data Per RT",
      icon: MapPin,
      badge: null
    },
    {
      id: "kk" as ActiveTab,
      label: "Kartu Keluarga (KK)",
      icon: FileText,
      badge: totalKKCount > 0 ? `${totalKKCount} KK` : null
    },
    {
      id: "logs" as ActiveTab,
      label: "Jejak Audit (Log Sheet)",
      icon: History,
      badge: auditLogsCount > 0 ? `${auditLogsCount}` : null
    },
    {
      id: "settings" as ActiveTab,
      label: "Pengaturan Kop / Desa",
      icon: Building2,
      badge: null
    }
  ];

  return (
    <aside className="w-72 bg-[#091122] text-slate-200 flex flex-col shrink-0 border-r border-slate-800/80 min-h-screen shadow-2xl relative z-20 select-none">
      {/* Top Header Brand */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center overflow-hidden shadow-lg border border-slate-700/60 shrink-0">
            <img
              src="https://res.cloudinary.com/maswardi/image/upload/v1786322675/Screenshot_2026-08-10_074401_i01n5t.png"
              alt="Logo WARGA+"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1 font-sans">
                <span>WARGA</span>
                <span className="text-emerald-400 font-black">+</span>
              </h1>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-semibold tracking-wide mt-0.5">
              Data Tepat, Desa Hebat
            </p>
          </div>
        </div>
      </div>

      {/* Operator Aktif Card */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-[#0e1933] border border-slate-800 rounded-xl p-3 shadow-inner">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            OPERATOR AKTIF
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md ring-2 ring-amber-400/30">
              M
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-white truncate">maswardi</h4>
              <p className="text-[10px] text-slate-400 truncate">Administrator Sistem</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-semibold uppercase tracking-wider">HAK AKSES :</span>
            <span className="bg-rose-600/90 text-white font-black px-2 py-0.5 rounded text-[9px] tracking-wider uppercase shadow-xs">
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 px-3 py-3 space-y-1.5 overflow-y-auto scrollbar-none">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-left ${
                isActive
                  ? "bg-[#183664] text-white shadow-lg shadow-blue-950/50 border border-blue-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span className="truncate tracking-wide uppercase">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-1 ${
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-xs"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Apps Script Setup Item */}
        <button
          onClick={onOpenSetupModal}
          className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition text-slate-300 hover:text-white hover:bg-slate-800/60 text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate tracking-wide uppercase">KODE APPS SCRIPT</span>
          </div>
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
              configStatus.hasAppsScriptUrl
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : "bg-amber-950 text-amber-300 border border-amber-800"
            }`}
          >
            {configStatus.hasAppsScriptUrl ? "ONLINE" : "DEMO"}
          </span>
        </button>

        {/* PWA Install Button */}
        {onOpenInstallModal && (
          <button
            onClick={onOpenInstallModal}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 hover:text-white text-left cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Download className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="truncate tracking-wide uppercase">INSTAL APLIKASI</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {isInstalled ? "TERPASANG" : "PWA"}
            </span>
          </button>
        )}
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#080e1c]">
        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full py-2.5 px-3 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/60 text-rose-300 hover:text-white rounded-xl text-xs font-bold tracking-wider transition flex items-center justify-center gap-2 shadow-xs"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>KELUAR SISTEM</span>
        </button>

        {/* Footer info */}
        <div className="text-center pt-1">
          <p className="text-[10px] font-black text-amber-400/90 tracking-widest uppercase">
            REPUBLIK INDONESIA
          </p>
          <p className="text-[9px] text-slate-500 font-medium mt-0.5">
            Sistem Tata Kelola Administrasi v2.0
          </p>
        </div>
      </div>
    </aside>
  );
};
