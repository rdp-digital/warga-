import React from "react";
import { LayoutDashboard, Users, FileText, MapPin, History, LogOut, Code, Database, ShieldCheck, Building2 } from "lucide-react";
import { ConfigStatus, VillageProfile } from "../types";
import { OFFICIAL_MAGETAN_LOGO } from "../lib/profile";

export type ActiveTab = "dashboard" | "penduduk" | "rt" | "kk" | "logs" | "settings";


interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  configStatus: ConfigStatus;
  onOpenSetupModal: () => void;
  onLogout: () => void;
  totalPendudukCount: number;
  villageProfile?: VillageProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  configStatus,
  onOpenSetupModal,
  onLogout,
  totalPendudukCount,
  villageProfile
}) => {
  const currentLogo =
    villageProfile?.logoUrl && !villageProfile.logoUrl.includes("Screenshot_2026-08-10_074401")
      ? villageProfile.logoUrl
      : OFFICIAL_MAGETAN_LOGO;
  const currentDesa = villageProfile?.namaDesa || "DESA PONCOL";

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shadow-lg border border-slate-700/60 shrink-0">
              <img
                src={currentLogo}
                alt={`Logo ${currentDesa}`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1">
                  <span>WARGA</span>
                  <span className="text-emerald-400">+</span>
                </h1>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-emerald-400 font-semibold tracking-wide">{currentDesa}</p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Connection Status Badge */}
            <button
              onClick={onOpenSetupModal}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                configStatus.hasAppsScriptUrl
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60"
                  : "bg-amber-950/60 text-amber-300 border-amber-800/80 hover:bg-amber-900/60"
              }`}
            >
              {configStatus.hasAppsScriptUrl ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Apps Script Active</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Mode Demo (Sheets Ready)</span>
                </>
              )}
            </button>

            {/* Setup Instructions Button */}
            <button
              onClick={onOpenSetupModal}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              title="Instruksi Apps Script"
            >
              <Code className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Kode Apps Script</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 rounded-lg transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 sm:space-x-2 border-t border-slate-800 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab("penduduk")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "penduduk"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Penduduk</span>
            <span className="ml-1 bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
              {totalPendudukCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rt")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "rt"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Data Per RT</span>
          </button>

          <button
            onClick={() => setActiveTab("kk")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "kk"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Kartu Keluarga (KK)</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "logs"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Jejak Audit (Log Sheet)</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span>Pengaturan Kop / Desa</span>
          </button>
        </div>

      </div>
    </header>
  );
};
