import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  verifySession,
  loginAdmin,
  logoutAdmin,
  fetchAllData,
  createPenduduk,
  updatePenduduk,
  deletePenduduk,
  batchUpdateBirthDates,
  checkConfigStatus,
  fetchAuditLogs,
  saveConfig,
  seedSpreadsheetData
} from "./lib/api";
import { Penduduk, LogAudit, ConfigStatus, VillageProfile } from "./types";
import { computeStats } from "./lib/stats";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { LoginModal } from "./components/LoginModal";
import { Dashboard } from "./components/Dashboard";
import { PendudukTable } from "./components/PendudukTable";
import { PendudukFormModal } from "./components/PendudukFormModal";
import { DateFormatAuditorModal } from "./components/DateFormatAuditorModal";
import { KartuKeluargaView } from "./components/KartuKeluargaView";
import { WilayahRtView } from "./components/WilayahRtView";
import { AuditLogView } from "./components/AuditLogView";
import { VillageSettingsView } from "./components/VillageSettingsView";
import { SuratDesaView } from "./components/SuratDesaView";
import { AppsScriptSetupModal } from "./components/AppsScriptSetupModal";
import { PWAInstallModal, usePWAInstall } from "./components/PWAInstallModal";
import { Toast, ToastMessage } from "./components/Toast";
import { getVillageProfile, saveVillageProfile, fetchServerVillageProfile } from "./lib/profile";
import { loadSuratRecords } from "./lib/suratStorage";
import { Loader2, RefreshCw, AlertCircle, Info, Database, Menu, X, ShieldCheck, Code2, LogOut, FileText, Download } from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // main PWA Install hook
  const { isInstallable, isInstalled, isIOS, triggerInstall } = usePWAInstall();
  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Preselected Resident for Letter Generation
  const [preselectedSuratResident, setPreselectedSuratResident] = useState<Penduduk | null>(null);

  // Village Profile & Kop Surat state
  const [villageProfile, setVillageProfile] = useState<VillageProfile>(getVillageProfile());

  const handleSaveVillageProfile = (newProfile: VillageProfile) => {
    setVillageProfile(newProfile);
    saveVillageProfile(newProfile);
    addToast("success", "Profil desa dan data Kop Surat berhasil diperbarui!");
  };


  // Main data state
  const [pendudukList, setPendudukList] = useState<Penduduk[]>([]);
  const [auditLogs, setAuditLogs] = useState<LogAudit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    hasAppsScriptUrl: false,
    appsScriptUrl: "",
    spreadsheetId: "13eznYlqXwNjl653uR9dxVCr-yadAvAR5ysgeVlf2D5k",
    usingDemoMode: true
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPenduduk, setEditingPenduduk] = useState<Penduduk | null>(null);
  const [presetNomorKK, setPresetNomorKK] = useState<string>("");
  const [presetAlamat, setPresetAlamat] = useState<string>("");
  const [presetRt, setPresetRt] = useState<string>("");

  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isDateAuditorOpen, setIsDateAuditorOpen] = useState(false);
  const [selectedKKForView, setSelectedKKForView] = useState<string | undefined>(undefined);

  // Confirm delete modal
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{ nik: string; name: string } | null>(null);

  // -------------------------------------------------------------
  // Android Back Button / Browser Popstate Interception
  // Prevents PWA / Android Browser from accidentally exiting
  // -------------------------------------------------------------
  useEffect(() => {
    // Push an initial state into browser history stack
    window.history.pushState({ app: "warga_plus", depth: 1 }, "");

    let lastBackPressTime = 0;

    const handlePopState = (event: PopStateEvent) => {
      // Re-push state immediately so the app doesn't navigate away
      window.history.pushState({ app: "warga_plus", depth: 1 }, "");

      // 1. Close active mobile sidebar menu if open
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        return;
      }

      // 2. Close active modals if open
      if (isFormOpen) {
        setIsFormOpen(false);
        return;
      }
      if (isDateAuditorOpen) {
        setIsDateAuditorOpen(false);
        return;
      }
      if (isSetupModalOpen) {
        setIsSetupModalOpen(false);
        return;
      }
      if (isPWAInstallModalOpen) {
        setIsPWAInstallModalOpen(false);
        return;
      }
      if (deleteConfirmTarget) {
        setDeleteConfirmTarget(null);
        return;
      }

      // 3. If in another sub-tab (not dashboard), navigate back to dashboard
      if (activeTab !== "dashboard") {
        setActiveTab("dashboard");
        return;
      }

      // 4. If already on dashboard, handle Double-Tap to Exit protection
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        // Double-tap back confirmed: allow natural exit by stepping history back
        window.history.go(-2);
      } else {
        lastBackPressTime = now;
        addToast("info", "Tekan tombol kembali sekali lagi untuk keluar dari aplikasi.");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [
    isMobileMenuOpen,
    isFormOpen,
    isDateAuditorOpen,
    isSetupModalOpen,
    isPWAInstallModalOpen,
    deleteConfirmTarget,
    activeTab,
    addToast
  ]);

  // Check config status
  const loadConfig = useCallback(async () => {
    const status = await checkConfigStatus();
    setConfigStatus(status);
  }, []);

  // Fetch all population & audit data from backend
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    const res = await fetchAllData(forceRefresh);
    setLoading(false);

    if (res.success) {
      setPendudukList(res.data || []);
      setAuditLogs(res.logs || []);
      if (res.usingDemoMode) {
        setConfigStatus((prev) => ({ ...prev, usingDemoMode: true }));
      }
      if (forceRefresh) {
        addToast("success", "Data berhasil disinkronkan ulang langsung dari Google Sheets!");
      }
    } else {
      addToast("error", res.message || "Gagal memuat data dari Google Sheets API.");
    }
  }, [addToast]);

  // Initial Auth Check & Village Profile Sync
  useEffect(() => {
    async function init() {
      setCheckingAuth(true);
      
      // Fetch persistent village profile from server so uploaded logo/settings match across shared sessions
      try {
        const serverProf = await fetchServerVillageProfile();
        if (serverProf) {
          setVillageProfile(serverProf);
        }
      } catch (e) {
        console.warn("Village profile fetch error:", e);
      }

      await loadConfig();
      const valid = await verifySession();
      setIsAuthenticated(valid);
      setCheckingAuth(false);

      if (valid) {
        await loadData();
      }
    }
    init();
  }, [loadConfig, loadData]);

  // Handle Login
  const handleLogin = async (password: string): Promise<{ success: boolean; message?: string }> => {
    const res = await loginAdmin(password);
    if (res.success) {
      setIsAuthenticated(true);
      addToast("success", "Login Berhasil. Selamat Datang di WARGA+!");
      await loadData();
      return { success: true };
    }
    return { success: false, message: res.message || "Password Admin tidak sesuai." };
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
    addToast("info", "Anda telah keluar dari aplikasi WARGA+.");
  };

  // Handle Save (Create/Update)
  const handleSavePenduduk = async (data: Partial<Penduduk>): Promise<boolean> => {
    const isEdit = Boolean(editingPenduduk);
    const res = isEdit ? await updatePenduduk(data) : await createPenduduk(data);

    if (res.success) {
      addToast("success", res.message || (isEdit ? "Data penduduk berhasil diperbarui" : "Data penduduk berhasil ditambahkan"));
      await loadData();
      return true;
    } else {
      addToast("error", res.message || "Gagal menyimpan data");
      return false;
    }
  };

  // Handle Batch Update Birth Dates (Normalization)
  const handleBatchUpdateDates = async (updates: { nik: string; tanggalLahir: string }[]): Promise<boolean> => {
    const res = await batchUpdateBirthDates(updates);
    if (res.success) {
      addToast("success", res.message || `Berhasil menormalisasi ${updates.length} tanggal lahir`);
      await loadData();
      return true;
    } else {
      addToast("error", res.message || "Gagal menormalisasi tanggal lahir");
      return false;
    }
  };

  // Handle Single Update Birth Date
  const handleSingleUpdateDate = async (nik: string, newDate: string, residentName: string): Promise<boolean> => {
    const existing = pendudukList.find((p) => p.nik === nik);
    const payload = existing ? { ...existing, tanggalLahir: newDate } : { nik, tanggalLahir: newDate };
    const res = await updatePenduduk(payload);
    if (res.success) {
      addToast("success", `Format tanggal lahir untuk ${residentName} berhasil diperbarui menjadi ${newDate}`);
      await loadData();
      return true;
    } else {
      addToast("error", res.message || "Gagal memperbarui tanggal lahir");
      return false;
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteConfirmTarget) return;
    const { nik, name } = deleteConfirmTarget;
    setDeleteConfirmTarget(null);

    const res = await deletePenduduk(nik);
    if (res.success) {
      addToast("success", res.message || `Data penduduk ${name} berhasil dihapus.`);
      await loadData();
    } else {
      addToast("error", res.message || "Gagal menghapus data penduduk.");
    }
  };

  // Action Helpers
  const handleOpenCreateModal = () => {
    setEditingPenduduk(null);
    setPresetNomorKK("");
    setPresetAlamat("");
    setPresetRt("");
    setIsFormOpen(true);
  };

  const handleEditPenduduk = (item: Penduduk) => {
    setEditingPenduduk(item);
    setPresetNomorKK("");
    setIsFormOpen(true);
  };

  const handleViewKK = (nomorKK: string) => {
    setSelectedKKForView(nomorKK);
    setActiveTab("kk");
  };

  const handleAddMemberToKK = (nomorKK: string, alamat: string, rt: string) => {
    setEditingPenduduk(null);
    setPresetNomorKK(nomorKK);
    setPresetAlamat(alamat);
    setPresetRt(rt);
    setIsFormOpen(true);
  };

  const handleRemoveMemberFromKK = (nik: string, name: string) => {
    setDeleteConfirmTarget({ nik, name });
  };

  const handleGenerateSuratForResident = (resident: Penduduk) => {
    setPreselectedSuratResident(resident);
    setActiveTab("surat");
  };

  // Compute stats
  const stats = useMemo(() => computeStats(pendudukList), [pendudukList]);
  const suratRecordsCount = useMemo(() => loadSuratRecords().length, [activeTab]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="font-semibold text-sm">Memuat Aplikasi WARGA+...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginModal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans text-slate-800 flex flex-col lg:flex-row">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={removeToast} />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          configStatus={configStatus}
          onOpenSetupModal={() => setIsSetupModalOpen(true)}
          onLogout={handleLogout}
          totalPendudukCount={pendudukList.length}
          totalKKCount={stats.totalKK}
          auditLogsCount={auditLogs.length}
          totalSuratCount={suratRecordsCount}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenInstallModal={() => setIsPWAInstallModalOpen(true)}
          isInstalled={isInstalled}
        />
      </div>

      {/* Mobile Top Navbar with Hamburger */}
      <header className="lg:hidden bg-[#091122] text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 p-0.5 flex items-center justify-center overflow-hidden border border-slate-700">
            <img
              src="https://res.cloudinary.com/maswardi/image/upload/v1786322675/Screenshot_2026-08-10_074401_i01n5t.png"
              alt="Logo WARGA+"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-wider flex items-center gap-0.5">
              <span>WARGA</span>
              <span className="text-emerald-400 font-black">+</span>
            </h1>
            <p className="text-[9px] text-emerald-400 font-semibold">Data Tepat, Desa Hebat</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick PWA Install button on Mobile Header */}
          <button
            onClick={() => setIsPWAInstallModalOpen(true)}
            className="p-1.5 px-2.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Instal Aplikasi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10.5px]">Instal</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white border border-slate-700 focus:outline-none cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Slide-over Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex flex-col w-72 max-w-[80vw] h-full bg-[#091122]">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setIsMobileMenuOpen(false);
              }}
              configStatus={configStatus}
              onOpenSetupModal={() => {
                setIsSetupModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onLogout={handleLogout}
              totalPendudukCount={pendudukList.length}
              totalKKCount={stats.totalKK}
              auditLogsCount={auditLogs.length}
              totalSuratCount={suratRecordsCount}
              onOpenCreateModal={handleOpenCreateModal}
              onOpenInstallModal={() => {
                setIsPWAInstallModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              isInstalled={isInstalled}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Banner if using demo mode */}
          {configStatus.usingDemoMode && (
            <div className="bg-amber-500/10 border border-amber-300/80 text-amber-950 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-medium shadow-xs">
              <div className="flex items-center gap-2.5">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Mode Database Lokal:</strong> Aplikasi berjalan dalam mode lokal. Untuk menyambungkan secara permanen ke Google Spreadsheet Anda, masukkan Web App URL Apps Script pada menu Pengaturan.
                </span>
              </div>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition shrink-0 ml-3"
              >
                Petunjuk Deploy Apps Script
              </button>
            </div>
          )}

          {/* Global Loading Overlay */}
          {loading && (
            <div className="bg-indigo-50/80 border border-indigo-200 text-indigo-900 p-3 rounded-xl flex items-center justify-between text-xs font-semibold animate-pulse">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
                <span>Menyinkronkan data dengan Google Sheets API...</span>
              </div>
            </div>
          )}

          {/* Tab 1: Dashboard Statistik */}
          {activeTab === "dashboard" && (
            <Dashboard
              stats={stats}
              auditLogsCount={auditLogs.length}
              isOnline={configStatus.hasAppsScriptUrl}
              onNavigateToRt={() => setActiveTab("rt")}
              onNavigateToKk={() => setActiveTab("kk")}
              onNavigateToPenduduk={() => setActiveTab("penduduk")}
              onNavigateToSurat={() => setActiveTab("surat")}
              onOpenDateAuditor={() => setIsDateAuditorOpen(true)}
              onOpenCreateModal={handleOpenCreateModal}
            />
          )}

          {/* Tab 2: Layanan Surat Menyurat Desa */}
          {activeTab === "surat" && (
            <SuratDesaView
              pendudukList={pendudukList}
              profile={villageProfile}
              preselectedResident={preselectedSuratResident}
              onClearPreselectedResident={() => setPreselectedSuratResident(null)}
              onSaveProfile={handleSaveVillageProfile}
              onAddAuditLog={(action, nik, detail) => {
                // Log locally and add toast
                addToast("info", detail);
              }}
            />
          )}

          {/* Tab 3: Data Penduduk (CRUD) */}
          {activeTab === "penduduk" && (
            <PendudukTable
              data={pendudukList}
              profile={villageProfile}
              onOpenCreateModal={handleOpenCreateModal}
              onEdit={handleEditPenduduk}
              onDelete={(nik, name) => setDeleteConfirmTarget({ nik, name })}
              onViewKK={handleViewKK}
              onOpenDateAuditor={() => setIsDateAuditorOpen(true)}
              onGenerateSurat={handleGenerateSuratForResident}
            />
          )}

          {/* Tab 3: Data Per RT */}
          {activeTab === "rt" && (
            <WilayahRtView
              data={pendudukList}
              profile={villageProfile}
              onEdit={handleEditPenduduk}
              onDelete={(nik, name) => setDeleteConfirmTarget({ nik, name })}
              onViewKK={handleViewKK}
            />
          )}

          {/* Tab 4: Kartu Keluarga (KK) */}
          {activeTab === "kk" && (
            <KartuKeluargaView
              data={pendudukList}
              profile={villageProfile}
              onAddMemberToKK={handleAddMemberToKK}
              onEditMember={handleEditPenduduk}
              onRemoveMemberFromKK={handleRemoveMemberFromKK}
              initialSelectedKK={selectedKKForView}
            />
          )}

          {/* Tab 5: Jejak Audit (Log) */}
          {activeTab === "logs" && (
            <AuditLogView logs={auditLogs} onRefresh={loadData} />
          )}

          {/* Tab 6: Pengaturan Profil Desa & Kop Surat */}
          {activeTab === "settings" && (
            <VillageSettingsView
              profile={villageProfile}
              onSaveProfile={handleSaveVillageProfile}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200/90 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>WARGA+ &copy; 2026. Data Tepat, Desa Hebat.</span>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>developed by : arunika kreatif Media</span>
              <img
                src="https://res.cloudinary.com/maswardi/image/upload/v1768753170/akm_500_x_300_px_op0l8f.png"
                alt="Arunika Kreatif Media"
                referrerPolicy="no-referrer"
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
        </footer>
      </div>

      {/* Form Modal (Create / Edit Penduduk) */}
      <PendudukFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSavePenduduk}
        initialData={editingPenduduk}
        presetNomorKK={presetNomorKK}
        presetAlamat={presetAlamat}
        presetRt={presetRt}
      />

      {/* Date Format Auditor & Batch Normalizer Modal */}
      <DateFormatAuditorModal
        isOpen={isDateAuditorOpen}
        onClose={() => setIsDateAuditorOpen(false)}
        data={pendudukList}
        onBatchUpdate={handleBatchUpdateDates}
        onBatchUpdateDates={handleBatchUpdateDates}
        onSingleUpdate={handleSingleUpdateDate}
        onSingleUpdateDate={handleSingleUpdateDate}
      />

      {/* Apps Script Deployment Guide Modal */}
      <AppsScriptSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        configStatus={configStatus}
        onSaveConfig={async (url, secret) => {
          const res = await saveConfig(url, secret);
          if (res.success) {
            await loadConfig();
            await loadData();
          }
          return res;
        }}
        onSeedData={async () => {
          const res = await seedSpreadsheetData();
          if (res.success) {
            await loadData();
          }
          return res;
        }}
        onReloadData={async () => {
          await loadConfig();
          await loadData();
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Konfirmasi Hapus Data</h3>
                <p className="text-xs text-slate-500">Aksi ini akan mencatat jejak audit ke Sheet "Log"</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
              Apakah Anda yakin ingin menghapus data penduduk <strong>{deleteConfirmTarget.name}</strong> (NIK: <code className="font-mono text-slate-900">{deleteConfirmTarget.nik}</code>) dari sistem?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Modal */}
      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
        onInstall={triggerInstall}
        isIOS={isIOS}
        isInstalled={isInstalled}
        isInstallable={isInstallable}
      />
    </div>
  );
}
