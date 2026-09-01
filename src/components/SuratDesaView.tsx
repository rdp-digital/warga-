import React, { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  History,
  Settings,
  Sparkles,
  ExternalLink,
  Save,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Layers,
  FileCheck
} from "lucide-react";
import {
  Penduduk,
  VillageProfile,
  SuratRecord,
  JenisSuratId,
  SuratTemplateConfig
} from "../types";
import {
  SURAT_TEMPLATES,
  getTemplateById,
  generateNomorSurat
} from "../lib/suratTemplates";
import {
  loadSuratRecords,
  saveSuratRecord,
  deleteSuratRecord,
  getNextSuratCounter,
  incrementSuratCounter,
  setSuratCounter
} from "../lib/suratStorage";
import { SuratPrintLayout } from "./SuratPrintLayout";
import { printElementById, openPrintWindow } from "../lib/print";
import { formatUniversalDateDisplay } from "../lib/dateUtils";
import {
  cleanDesaName,
  formatJabatanTitleCase
} from "../lib/formatIndoText";
import { saveVillageProfile } from "../lib/profile";

interface SuratDesaViewProps {
  pendudukList: Penduduk[];
  profile: VillageProfile;
  preselectedResident?: Penduduk | null;
  onClearPreselectedResident?: () => void;
  onAddAuditLog?: (action: string, nik: string, detail: string) => void;
  onSaveProfile?: (newProfile: VillageProfile) => void;
}

export const SuratDesaView: React.FC<SuratDesaViewProps> = ({
  pendudukList,
  profile,
  preselectedResident,
  onClearPreselectedResident,
  onAddAuditLog,
  onSaveProfile
}) => {
  const [activeTab, setActiveTab] = useState<"buat" | "agenda" | "pengaturan">("buat");

  // Step 1: Resident Selection
  const [selectedResident, setSelectedResident] = useState<Penduduk | null>(null);
  const [residentSearchQuery, setResidentSearchQuery] = useState<string>("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState<boolean>(false);

  // Step 2: Selected Template (Dropdown)
  const [selectedTemplateId, setSelectedTemplateId] = useState<JenisSuratId>("sktm");
  const currentTemplate = useMemo(() => {
    return getTemplateById(selectedTemplateId) || SURAT_TEMPLATES[0];
  }, [selectedTemplateId]);

  // Step 3: Form Fields & Custom Data (Proses)
  const [nomorSurat, setNomorSurat] = useState<string>("");
  const [tanggalSurat, setTanggalSurat] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [keperluan, setKeperluan] = useState<string>("");
  
  const desaClean = cleanDesaName(profile.namaDesa);
  const [penandatanganJabatan, setPenandatanganJabatan] = useState<string>(
    formatJabatanTitleCase(profile.jabatanKepalaDesa, desaClean)
  );
  const [penandatanganNama, setPenandatanganNama] = useState<string>(
    profile.namaKepalaDesa || "SAMSUHARI"
  );
  const [penandatanganNip, setPenandatanganNip] = useState<string>(
    profile.nipKepalaDesa || ""
  );

  const [customData, setCustomData] = useState<Record<string, any>>({});
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Preview Zoom & Fullscreen Controls
  const [previewZoom, setPreviewZoom] = useState<number>(100); // 80, 90, 100, 110
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);

  // Archive / Agenda State
  const [archivedSurat, setArchivedSurat] = useState<SuratRecord[]>([]);
  const [agendaSearch, setAgendaSearch] = useState<string>("");
  const [agendaCategoryFilter, setAgendaCategoryFilter] = useState<string>("Semua");
  const [previewModalSurat, setPreviewModalSurat] = useState<SuratRecord | null>(null);

  // Numbering settings
  const [currentCounter, setCurrentCounterState] = useState<number>(1);
  const [customKodeDesa, setCustomKodeDesa] = useState<string>(profile.kodeDesa || "35.20.01.2001");
  const [configSaveStatus, setConfigSaveStatus] = useState<"idle" | "saved">("idle");

  // Load Initial Storage
  useEffect(() => {
    setArchivedSurat(loadSuratRecords());
    setCurrentCounterState(getNextSuratCounter());
    if (profile.kodeDesa) {
      setCustomKodeDesa(profile.kodeDesa);
    }
  }, [profile.kodeDesa]);

  // Handle preselected resident when triggered from outside (e.g. Penduduk Table)
  useEffect(() => {
    if (preselectedResident) {
      setSelectedResident(preselectedResident);
      setResidentSearchQuery(`${preselectedResident.namaLengkap} - NIK: ${preselectedResident.nik}`);
      setIsProcessed(true);
      setActiveTab("buat");
    }
  }, [preselectedResident]);

  // Handle Save Penomoran Configuration
  const handleSavePenomoranConfig = () => {
    const validCounter = Math.max(1, currentCounter);
    
    // 1. Save Counter locally
    setSuratCounter(validCounter);
    setCurrentCounterState(validCounter);

    // 2. Save Updated Village Profile with new Kode Desa
    const updatedProfile: VillageProfile = {
      ...profile,
      kodeDesa: customKodeDesa.trim() || "35.20.01.2001"
    };
    saveVillageProfile(updatedProfile);
    if (onSaveProfile) {
      onSaveProfile(updatedProfile);
    }

    // 3. Immediately regenerate current surat number in real-time
    const newGeneratedNomor = generateNomorSurat(
      currentTemplate.kodeKlasifikasi,
      validCounter,
      updatedProfile
    );
    setNomorSurat(newGeneratedNomor);

    // 4. Audit Log
    if (onAddAuditLog) {
      onAddAuditLog(
        "UPDATE_PENOMORAN",
        "-",
        `Memperbarui konfigurasi nomor surat (No Urut: ${validCounter}, Kode Wilayah: ${updatedProfile.kodeDesa})`
      );
    }

    // 5. Trigger Success Alert & Feedback
    setConfigSaveStatus("saved");
    setTimeout(() => {
      setConfigSaveStatus("idle");
    }, 4000);
  };

  // Re-calculate default fields when template changes
  useEffect(() => {
    const defaultData: Record<string, any> = {};
    currentTemplate.fields.forEach((field) => {
      defaultData[field.key] = field.defaultValue || "";
    });
    setCustomData(defaultData);
    setKeperluan(currentTemplate.keperluanDefault);

    // Auto-generate number based on current counter
    const generated = generateNomorSurat(
      currentTemplate.kodeKlasifikasi,
      currentCounter,
      { ...profile, kodeDesa: customKodeDesa }
    );
    setNomorSurat(generated);
  }, [selectedTemplateId, currentCounter, customKodeDesa, profile]);

  // Update penandatangan when profile updates
  useEffect(() => {
    const dClean = cleanDesaName(profile.namaDesa);
    setPenandatanganJabatan(formatJabatanTitleCase(profile.jabatanKepalaDesa, dClean));
    setPenandatanganNama(profile.namaKepalaDesa || "H. SUWARDI");
    setPenandatanganNip(profile.nipKepalaDesa || "");
  }, [profile]);

  // Filtered residents for autocomplete dropdown
  const filteredResidents = useMemo(() => {
    if (!residentSearchQuery.trim()) return pendudukList.slice(0, 8);
    const q = residentSearchQuery.toLowerCase();
    return pendudukList
      .filter(
        (p) =>
          p.namaLengkap.toLowerCase().includes(q) ||
          p.nik.includes(q) ||
          p.nomorKKInduk.includes(q) ||
          p.rt.includes(q)
      )
      .slice(0, 10);
  }, [pendudukList, residentSearchQuery]);

  // Group templates by category for the dropdown
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, SuratTemplateConfig[]> = {};
    SURAT_TEMPLATES.forEach((tmpl) => {
      if (!groups[tmpl.kategori]) {
        groups[tmpl.kategori] = [];
      }
      groups[tmpl.kategori].push(tmpl);
    });
    return groups;
  }, []);

  // Filtered Agenda / Archive records
  const filteredAgenda = useMemo(() => {
    let list = archivedSurat;
    if (agendaCategoryFilter !== "Semua") {
      list = list.filter((item) => {
        const tmpl = getTemplateById(item.jenisSuratId);
        return tmpl?.kategori === agendaCategoryFilter;
      });
    }
    if (agendaSearch.trim()) {
      const q = agendaSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.namaLengkap.toLowerCase().includes(q) ||
          item.nik.includes(q) ||
          item.nomorSurat.toLowerCase().includes(q) ||
          item.namaSurat.toLowerCase().includes(q)
      );
    }
    return list;
  }, [archivedSurat, agendaSearch, agendaCategoryFilter]);

  // Construct current dynamic SuratRecord for live preview & saving
  const currentSuratRecord: SuratRecord = useMemo(() => {
    return {
      id: `SURAT-${Date.now()}`,
      nomorSurat: nomorSurat || "470/001/DS-PCL/VIII/2026",
      jenisSuratId: currentTemplate.id,
      namaSurat: currentTemplate.judulResmi,
      kodeKlasifikasi: currentTemplate.kodeKlasifikasi,
      nik: selectedResident?.nik || "3520XXXXXXXXXXXX",
      namaLengkap: selectedResident?.namaLengkap || "NAMA WARGA / PEMOHON",
      nomorKK: selectedResident?.nomorKKInduk || "3520XXXXXXXXXXXX",
      tempatLahir: selectedResident?.tempatLahir || "Magetan",
      tanggalLahir: selectedResident?.tanggalLahir || "1990-01-01",
      jenisKelamin: selectedResident?.jenisKelamin || "LAKI-LAKI",
      agama: selectedResident?.agama || "Islam",
      pendidikan: selectedResident?.pendidikan || "SLTA / Sederajat",
      jenisPekerjaan: selectedResident?.jenisPekerjaan || "Wiraswasta",
      statusKawin: selectedResident?.statusKawin || "Kawin Tercatat",
      alamat: selectedResident?.alamat || "Dukuh Poncol",
      rt: selectedResident?.rt || "01",
      keperluan: keperluan || currentTemplate.keperluanDefault,
      customData: customData,
      tanggalSurat: tanggalSurat,
      penandatanganJabatan: penandatanganJabatan,
      penandatanganNama: penandatanganNama,
      penandatanganNip: penandatanganNip,
      status: "DICETAK",
      createdAt: new Date().toISOString()
    };
  }, [
    currentTemplate,
    selectedResident,
    nomorSurat,
    keperluan,
    customData,
    tanggalSurat,
    penandatanganJabatan,
    penandatanganNama,
    penandatanganNip
  ]);

  // Action: Select Resident
  const handleSelectResident = (p: Penduduk) => {
    setSelectedResident(p);
    setResidentSearchQuery(`${p.namaLengkap} - NIK: ${p.nik}`);
    setIsSearchDropdownOpen(false);
    setIsProcessed(true);

    // Auto-fill address for SKU if needed
    if (selectedTemplateId === "sku" && (!customData.alamatUsaha || customData.alamatUsaha === "")) {
      setCustomData((prev) => ({
        ...prev,
        alamatUsaha: `${p.alamat || "Dukuh Poncol"} RT ${p.rt} Desa ${desaClean}`
      }));
    }
  };

  // Action: Step 3 - Process Form
  const handleProcessForm = () => {
    if (!selectedResident) {
      alert("Silakan pilih NIK Penduduk terlebih dahulu.");
      return;
    }
    setIsProcessed(true);
    setSaveSuccessMessage("Data surat berhasil diproses dan disinkronkan ke pratinjau A4.");
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Action: Step 4 - Print hardware & save to agenda
  const handlePrintSurat = async () => {
    if (!selectedResident) {
      alert("Silakan pilih NIK Penduduk terlebih dahulu sebelum mencetak surat.");
      return;
    }

    setIsPrinting(true);
    try {
      // 1. Save record to Agenda
      const updatedList = saveSuratRecord(currentSuratRecord);
      setArchivedSurat(updatedList);

      // 2. Increment Counter
      const nextNo = incrementSuratCounter();
      setCurrentCounterState(nextNo);

      // 3. Audit Log
      if (onAddAuditLog) {
        onAddAuditLog(
          "CETAK_SURAT",
          selectedResident.nik,
          `Menerbitkan ${currentTemplate.namaSurat} Nomor: ${currentSuratRecord.nomorSurat}`
        );
      }

      // 4. Trigger print
      await printElementById("printable-surat-sheet", {
        title: `${currentTemplate.namaSurat}_${selectedResident.namaLengkap}`,
        orientation: "portrait",
        pageSize: "A4"
      });

      setSaveSuccessMessage(`Surat berhasil dicetak dan diarsipkan dengan nomor: ${currentSuratRecord.nomorSurat}`);
      setTimeout(() => setSaveSuccessMessage(null), 6000);
    } catch (err) {
      console.error("Print error:", err);
    } finally {
      setIsPrinting(false);
    }
  };

  // Action: Step 4 - Open Standalone Print Window / Save as PDF
  const handleOpenPdfWindow = () => {
    if (!selectedResident) {
      alert("Silakan pilih NIK Penduduk terlebih dahulu.");
      return;
    }

    // Save record to Agenda
    const updatedList = saveSuratRecord(currentSuratRecord);
    setArchivedSurat(updatedList);
    const nextNo = incrementSuratCounter();
    setCurrentCounterState(nextNo);

    if (onAddAuditLog) {
      onAddAuditLog(
        "PDF_SURAT",
        selectedResident.nik,
        `Membuka tab cetak/PDF ${currentTemplate.namaSurat} Nomor: ${currentSuratRecord.nomorSurat}`
      );
    }

    openPrintWindow("printable-surat-sheet", {
      title: `${currentTemplate.namaSurat}_${selectedResident.namaLengkap}`,
      orientation: "portrait",
      pageSize: "A4"
    });
  };

  // Action: Save to Agenda without printing
  const handleSaveToAgenda = () => {
    if (!selectedResident) {
      alert("Silakan pilih NIK Penduduk terlebih dahulu.");
      return;
    }

    const updatedList = saveSuratRecord(currentSuratRecord);
    setArchivedSurat(updatedList);
    const nextNo = incrementSuratCounter();
    setCurrentCounterState(nextNo);

    if (onAddAuditLog) {
      onAddAuditLog(
        "ARSIP_SURAT",
        selectedResident.nik,
        `Menyimpan draf ${currentTemplate.namaSurat} Nomor: ${currentSuratRecord.nomorSurat}`
      );
    }

    setSaveSuccessMessage(`Surat berhasil disimpan ke Buku Agenda Surat.`);
    setTimeout(() => setSaveSuccessMessage(null), 4000);
  };

  // Action: Reset Form
  const handleResetForm = () => {
    setSelectedResident(null);
    setResidentSearchQuery("");
    setIsProcessed(false);
    if (onClearPreselectedResident) onClearPreselectedResident();
  };

  // Action: Delete from Agenda
  const handleDeleteAgendaItem = (id: string, nama: string, noSurat: string) => {
    if (window.confirm(`Hapus arsip surat ${noSurat} atas nama ${nama}?`)) {
      const updated = deleteSuratRecord(id);
      setArchivedSurat(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#09152b] via-[#102a5c] to-[#0c1f42] rounded-2xl p-6 text-white border border-blue-900/60 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] px-2.5 py-0.5 rounded tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LAYANAN SURAT MENYURAT DESA RESMI</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            PELAYANAN SURAT KETERANGAN DESA
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Alur praktis 4 langkah: <strong>1. Pilih NIK</strong> ➔ <strong>2. Pilih Jenis Surat</strong> ➔ <strong>3. Proses Detail</strong> ➔ <strong>4. Cetak Dokumen A4 Presisi</strong>.
          </p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab("buat")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "buat"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Buat Surat Baru</span>
          </button>
          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "agenda"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Buku Agenda ({archivedSurat.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("pengaturan")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === "pengaturan"
                ? "bg-amber-400 text-slate-950 shadow-md"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Penomoran</span>
          </button>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION TOAST */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs font-bold">{saveSuccessMessage}</p>
          </div>
          <button
            onClick={() => setSaveSuccessMessage(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ALUR PEMBUATAN SURAT (DOMINANT PREVIEW LAYOUT) */}
      {/* ========================================================================= */}
      {activeTab === "buat" && (
        <div className="space-y-6">
          {/* STEPPER PROGRESS BAR (COMPACT & CLEAR) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {/* Step 1 */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  selectedResident
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                    : "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    selectedResident ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                  }`}
                >
                  {selectedResident ? "✓" : "1"}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Langkah 1</div>
                  <div className="truncate text-xs font-black">1. Pilih NIK</div>
                </div>
              </div>

              {/* Step 2 */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  selectedTemplateId
                    ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-black shrink-0">
                  2
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Langkah 2</div>
                  <div className="truncate text-xs font-black">2. Pilih Surat</div>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  isProcessed
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    isProcessed ? "bg-emerald-600 text-white" : "bg-slate-300 text-slate-700"
                  }`}
                >
                  {isProcessed ? "✓" : "3"}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Langkah 3</div>
                  <div className="truncate text-xs font-black">3. Proses Data</div>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                  selectedResident && isProcessed
                    ? "bg-amber-50 border-amber-300 text-amber-950 font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${
                    selectedResident && isProcessed ? "bg-amber-500 text-slate-950" : "bg-slate-300 text-slate-700"
                  }`}
                >
                  4
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-slate-500 uppercase tracking-wider">Langkah 4</div>
                  <div className="truncate text-xs font-black">4. Cetak (A4)</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN WORKSPACE GRID: FORM (COL 4) vs DOMINANT PREVIEW (COL 8) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ========================================================================= */}
            {/* LEFT COLUMN: COMPACT & EFFICIENT INPUT FORM (4 COLS / 33%) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              
              {/* STEP 1: PILIH NIK PENDUDUK */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                      1
                    </span>
                    <h3 className="font-black text-xs text-slate-900 uppercase">
                      Pilih NIK Penduduk
                    </h3>
                  </div>
                  {selectedResident && (
                    <button
                      onClick={handleResetForm}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                    >
                      Ganti Warga
                    </button>
                  )}
                </div>

                {/* Resident Search Input */}
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      value={residentSearchQuery}
                      onChange={(e) => {
                        setResidentSearchQuery(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      placeholder="Ketik NIK 16 digit atau Nama..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isSearchDropdownOpen && filteredResidents.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                      {filteredResidents.map((resident) => (
                        <button
                          key={resident.nik}
                          type="button"
                          onClick={() => handleSelectResident(resident)}
                          className="w-full p-2.5 text-left hover:bg-blue-50/80 transition flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700">
                              {resident.namaLengkap.charAt(0).toUpperCase()}
                            </div>
                            <div className="truncate">
                              <h5 className="font-bold text-xs text-slate-900 group-hover:text-blue-900 truncate">
                                {resident.namaLengkap}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-mono">
                                NIK: {resident.nik} | RT {resident.rt}
                              </p>
                            </div>
                          </div>
                          <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700 group-hover:bg-blue-600 group-hover:text-white">
                            Pilih
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Resident Profile Compact Card */}
                {selectedResident ? (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] flex items-center justify-center shrink-0">
                          ✓
                        </div>
                        <div className="truncate">
                          <h4 className="font-black text-xs text-slate-900 uppercase truncate">
                            {selectedResident.namaLengkap}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono">
                            NIK: {selectedResident.nik}
                          </p>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded shrink-0">
                        RT {selectedResident.rt}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-1.5 border-t border-slate-200 text-slate-600">
                      <div className="truncate">
                        <span className="text-slate-400">Pekerjaan: </span>
                        <span className="font-semibold text-slate-800">{selectedResident.jenisPekerjaan}</span>
                      </div>
                      <div className="truncate">
                        <span className="text-slate-400">Status: </span>
                        <span className="font-semibold text-slate-800">{selectedResident.statusKawin}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2 text-amber-800 text-[11px]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Pilih NIK pemohon untuk mengisi lembar surat.</span>
                  </div>
                )}
              </div>

              {/* STEP 2: PILIH SURAT (DROPDOWN GROUPED) */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                      2
                    </span>
                    <h3 className="font-black text-xs text-slate-900 uppercase">
                      Pilih Jenis Surat
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
                    Kode: {currentTemplate.kodeKlasifikasi}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Jenis Surat Keterangan / Pengantar:
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value as JenisSuratId)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {(Object.entries(groupedTemplates) as [string, SuratTemplateConfig[]][]).map(([kategori, templates]) => (
                      <optgroup key={kategori} label={`── ${kategori} ──`}>
                        {templates.map((tmpl) => (
                          <option key={tmpl.id} value={tmpl.id}>
                            {tmpl.namaSurat} (Kode {tmpl.kodeKlasifikasi})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="p-2.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start gap-2 text-xs text-blue-950">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-900/90 leading-tight">
                    {currentTemplate.deskripsi}
                  </p>
                </div>
              </div>

              {/* STEP 3: PROSES DATA & DETAIL SURAT */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center">
                    3
                  </span>
                  <h3 className="font-black text-xs text-slate-900 uppercase">
                    Proses Detail & Isi Surat
                  </h3>
                </div>

                {/* Nomor & Tanggal Surat */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Nomor Registrasi
                    </label>
                    <input
                      type="text"
                      value={nomorSurat}
                      onChange={(e) => setNomorSurat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Tanggal Surat
                    </label>
                    <input
                      type="date"
                      value={tanggalSurat}
                      onChange={(e) => setTanggalSurat(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Keperluan - KOTAK ISIAN DENGAN AKSEN WARNA HANGAT */}
                <div>
                  <label className="block text-[10px] font-bold text-amber-900 uppercase mb-1">
                    Maksud / Keperluan Penggunaan:
                  </label>
                  <textarea
                    rows={2}
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                    placeholder="Contoh: Persyaratan pengajuan beasiswa / bantuan biaya pendidikan anak sekolah..."
                    className="w-full px-2.5 py-1.5 bg-amber-50/70 border border-amber-300/90 rounded-lg text-xs font-medium text-slate-900 placeholder:text-amber-800/40 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                  />
                </div>

                {/* Dynamic Fields for Selected Template */}
                {currentTemplate.fields.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">
                      Isian Khusus: {currentTemplate.namaSurat}
                    </h4>
                    <div className="space-y-2">
                      {currentTemplate.fields.map((field) => {
                        if (field.type === "select") {
                          return (
                            <div key={field.key}>
                              <label className="block text-[10px] font-semibold text-slate-800 mb-1">
                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              <select
                                value={customData[field.key] || field.defaultValue || ""}
                                onChange={(e) =>
                                  setCustomData((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                className="w-full px-2.5 py-1.5 bg-amber-50/70 border border-amber-300/90 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors cursor-pointer"
                              >
                                {(field.options || []).map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        }

                        if (field.type === "textarea") {
                          return (
                            <div key={field.key}>
                              <label className="block text-[10px] font-semibold text-slate-800 mb-1">
                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                              </label>
                              <textarea
                                rows={2}
                                value={customData[field.key] || ""}
                                onChange={(e) =>
                                  setCustomData((prev) => ({ ...prev, [field.key]: e.target.value }))
                                }
                                placeholder={field.placeholder}
                                className="w-full px-2.5 py-1.5 bg-amber-50/70 border border-amber-300/90 rounded-lg text-xs font-medium text-slate-900 placeholder:text-amber-800/40 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={field.key}>
                            <label className="block text-[10px] font-semibold text-slate-800 mb-1">
                              {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>
                            <input
                              type={field.type}
                              value={customData[field.key] || ""}
                              onChange={(e) =>
                                setCustomData((prev) => ({ ...prev, [field.key]: e.target.value }))
                              }
                              placeholder={field.placeholder}
                              className="w-full px-2.5 py-1.5 bg-amber-50/70 border border-amber-300/90 rounded-lg text-xs font-medium text-slate-900 placeholder:text-amber-800/40 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Penandatangan Options */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase">
                    Penandatangan Surat:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={penandatanganJabatan}
                      onChange={(e) => setPenandatanganJabatan(e.target.value)}
                      placeholder="Jabatan (Kepala Desa Poncol)"
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={penandatanganNama}
                      onChange={(e) => setPenandatanganNama(e.target.value)}
                      placeholder="Nama Lengkap"
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 uppercase focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Process Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProcessForm}
                    className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>3. PROSES DATA & SINKRON PRATINJAU</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: DOMINANT PREVIEW & CETAK (8 COLS / 67%) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-3">
              
              {/* PREVIEW TOOLBAR & ACTIONS */}
              <div className="bg-slate-900 p-3 sm:p-4 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800 sticky top-2 z-20">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="font-black text-xs tracking-wider uppercase text-white flex items-center gap-2">
                      <span>Pratinjau Kertas Resmi (A4)</span>
                      <span className="hidden sm:inline-flex text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-normal">
                        Presisi Cetak 100%
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
                    <button
                      onClick={() => setPreviewZoom((z) => Math.max(z - 10, 70))}
                      className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Perkecil Tampilan"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono text-[11px] text-amber-300 font-bold min-w-[40px] text-center">
                      {previewZoom}%
                    </span>
                    <button
                      onClick={() => setPreviewZoom((z) => Math.min(z + 10, 120))}
                      className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
                      title="Perbesar Tampilan"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewZoom(100)}
                      className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white font-mono border-l border-slate-700 ml-0.5 cursor-pointer"
                      title="Reset 100%"
                    >
                      100%
                    </button>
                  </div>

                  {/* Fullscreen Expand Preview */}
                  <button
                    onClick={() => setIsFullscreenPreview(true)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs transition cursor-pointer"
                    title="Buka Layar Penuh"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>

                  {/* PDF Standalone Tab */}
                  <button
                    onClick={handleOpenPdfWindow}
                    disabled={!selectedResident}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    title="Buka Tab Cetak Bersih / Simpan PDF"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  {/* Save Draft */}
                  <button
                    onClick={handleSaveToAgenda}
                    disabled={!selectedResident}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    title="Simpan ke Agenda"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Simpan</span>
                  </button>

                  {/* Main Primary Print Button */}
                  <button
                    onClick={handlePrintSurat}
                    disabled={isPrinting || !selectedResident}
                    className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isPrinting ? "Mencetak..." : "Cetak Surat (A4)"}</span>
                  </button>
                </div>
              </div>

              {/* DOMINANT A4 CANVAS CONTAINER */}
              <div className="bg-slate-300/80 p-4 sm:p-6 rounded-2xl border border-slate-400/80 shadow-inner overflow-x-auto min-h-[700px] flex justify-center">
                <div
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: "top center",
                    transition: "transform 0.15s ease-out"
                  }}
                  className="w-full max-w-[210mm] transition-all"
                >
                  <SuratPrintLayout
                    surat={currentSuratRecord}
                    profile={profile}
                    id="printable-surat-sheet"
                    showBorder={true}
                  />
                </div>
              </div>

              {/* Informative Precision Note Footer */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pratinjau di atas menggunakan standar format kertas <strong>A4 Portrait (210mm × 297mm)</strong> dengan kaidah ejaan PUEBI/EYD baku.
                  </span>
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  Kop: Desa {desaClean}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BUKU AGENDA & ARSIP SURAT KELUAR */}
      {/* ========================================================================= */}
      {activeTab === "agenda" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 uppercase">
                Buku Agenda Surat Keluar ({archivedSurat.length} Surat)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar rekapan arsip surat keterangan kependudukan yang telah diterbitkan.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  value={agendaSearch}
                  onChange={(e) => setAgendaSearch(e.target.value)}
                  placeholder="Cari nomor surat / nama / NIK..."
                  className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 w-64 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Agenda Table */}
          {filteredAgenda.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <FileText className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-600">Belum ada riwayat surat yang diarsipkan.</p>
              <p className="text-xs text-slate-400">
                Penerbitan surat baru otomatis tercatat ke dalam buku agenda ini.
              </p>
              <button
                onClick={() => setActiveTab("buat")}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Surat Pertama</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-y border-slate-200">
                    <th className="py-3 px-3">No</th>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Nomor Surat</th>
                    <th className="py-3 px-4">Nama Pemohon & NIK</th>
                    <th className="py-3 px-4">Jenis Surat</th>
                    <th className="py-3 px-4">Keperluan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAgenda.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {formatUniversalDateDisplay(item.tanggalSurat)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.nomorSurat}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-black text-slate-900 uppercase">{item.namaLengkap}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          NIK: {item.nik} | RT {item.rt}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 whitespace-nowrap">
                          {item.namaSurat}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.keperluan}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setPreviewModalSurat(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title="Pratinjau & Cetak Ulang"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAgendaItem(item.id, item.namaLengkap, item.nomorSurat)
                            }
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                            title="Hapus dari Agenda"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PENGATURAN PENOMORAN */}
      {/* ========================================================================= */}
      {activeTab === "pengaturan" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6 max-w-3xl">
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 uppercase">
                Pengaturan Penomoran Otomatis Surat Desa
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi pola nomor registrasi surat keluar dan nomor urut counter secara realtime.
              </p>
            </div>
            {configSaveStatus === "saved" && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Konfigurasi Tersimpan & Sinkron Realtime!
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  CONTOH FORMAT NOMOR KELUAR (REALTIME PREVIEW)
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
                  Live Preview
                </span>
              </div>
              <p className="font-mono font-black text-xl text-slate-950 tracking-tight">
                {generateNomorSurat("510", currentCounter, { ...profile, kodeDesa: customKodeDesa })}
              </p>
              <p className="text-[11px] text-slate-500">
                Format Standar: <code>[Nomor Urut 3 Digit] / [Kode Klasifikasi] / [Kode Wilayah/Desa] / [Bulan Romawi] / [Tahun]</code>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nomor Urut Surat Saat Ini (Counter)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={currentCounter}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10) || 1;
                      setCurrentCounterState(Math.max(1, v));
                    }}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCurrentCounterState((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Kurangi 1"
                  >
                    -1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentCounterState((prev) => prev + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    title="Tambah 1"
                  >
                    +1
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Otomatis bertambah +1 setiap kali surat dicetak atau disimpan.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kode Wilayah / Singkatan Desa
                </label>
                <input
                  type="text"
                  value={customKodeDesa}
                  onChange={(e) => setCustomKodeDesa(e.target.value.toUpperCase())}
                  placeholder="Contoh: 35.20.01.2001 atau 403.401.02"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kode wilayah atau kode singkatan unik desa untuk format persuratan resmi.
                </p>
              </div>
            </div>

            {configSaveStatus === "saved" && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Pengaturan nomor surat berhasil disimpan dan disinkronkan ke seluruh modul persuratan.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("buat")}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <span>Buat Surat Baru</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveTab("buat")}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Kembali ke Pelayanan Surat
              </button>
              <button
                type="button"
                onClick={handleSavePenomoranConfig}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW MODAL */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-sm p-4 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-slate-900 text-white rounded-xl border border-slate-800 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm uppercase">
                Pratinjau Layar Penuh: {currentTemplate.namaSurat} ({currentSuratRecord.nomorSurat})
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrintSurat}
                disabled={isPrinting || !selectedResident}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak A4</span>
              </button>
              <button
                onClick={() => setIsFullscreenPreview(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs transition cursor-pointer flex items-center gap-1"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-400/60 p-6 rounded-xl flex justify-center">
            <div className="w-full max-w-[210mm]">
              <SuratPrintLayout
                surat={currentSuratRecord}
                profile={profile}
                id="fullscreen-surat-sheet"
                showBorder={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW & RE-PRINT ARSIP */}
      {previewModalSurat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[95vh] flex flex-col text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white uppercase">
                  Arsip: {previewModalSurat.namaSurat} ({previewModalSurat.nomorSurat})
                </h3>
              </div>
              <button
                onClick={() => setPreviewModalSurat(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-300 p-4 rounded-xl flex justify-center">
              <div className="w-full max-w-[210mm]">
                <SuratPrintLayout
                  surat={previewModalSurat}
                  profile={profile}
                  id="archived-surat-print-sheet"
                  showBorder={true}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setPreviewModalSurat(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  printElementById("archived-surat-print-sheet", {
                    title: `${previewModalSurat.namaSurat}_${previewModalSurat.namaLengkap}`,
                    orientation: "portrait",
                    pageSize: "A4"
                  });
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
