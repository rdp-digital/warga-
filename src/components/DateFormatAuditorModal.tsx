import React, { useState, useMemo } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  Pencil,
  Check,
  RefreshCw,
  Save,
  HelpCircle
} from "lucide-react";
import { Penduduk } from "../types";
import {
  auditResidentBirthDate,
  formatToIndoDate,
  formatToHtmlInputDate,
  calculateAgeAccurate,
  DateAuditItem,
  DateFormatStatusType
} from "../lib/dateUtils";

interface DateFormatAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Penduduk[];
  onBatchUpdate?: (updates: { nik: string; tanggalLahir: string }[]) => Promise<boolean>;
  onBatchUpdateDates?: (updates: { nik: string; tanggalLahir: string }[]) => Promise<boolean>;
  onSingleUpdate?: (nik: string, newDate: string, residentName: string) => Promise<boolean>;
  onSingleUpdateDate?: (nik: string, newDate: string, residentName: string) => Promise<boolean>;
}

export const DateFormatAuditorModal: React.FC<DateFormatAuditorModalProps> = ({
  isOpen,
  onClose,
  data,
  onBatchUpdate,
  onBatchUpdateDates,
  onSingleUpdate,
  onSingleUpdateDate
}) => {
  const handleBatchUpdateFn = onBatchUpdateDates || onBatchUpdate || (async () => false);
  const handleSingleUpdateFn = onSingleUpdateDate || onSingleUpdate || (async () => false);

  const [filterType, setFilterType] = useState<"ALL" | "NEED_FIX" | "AUTO_CONVERTIBLE" | "INVALID" | "VALID">("NEED_FIX");
  const [searchQuery, setSearchQuery] = useState("");
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [savingNik, setSavingNik] = useState<string | null>(null);

  // Inline editing state
  const [editingNik, setEditingNik] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>("");

  // Audit all residents
  const auditedList: DateAuditItem[] = useMemo(() => {
    return data.map((item) =>
      auditResidentBirthDate(
        item.nik,
        item.namaLengkap,
        item.tanggalLahir,
        item.rt,
        item.nomorKKInduk
      )
    );
  }, [data]);

  // Statistics
  const stats = useMemo(() => {
    let validCount = 0;
    let autoConvertibleCount = 0;
    let invalidCount = 0;

    auditedList.forEach((item) => {
      if (item.status === "STANDARD_INDO") validCount++;
      else if (item.status === "AUTO_CONVERTIBLE") autoConvertibleCount++;
      else if (item.status === "INVALID_OR_EMPTY") invalidCount++;
    });

    const needFixCount = autoConvertibleCount + invalidCount;
    return {
      total: auditedList.length,
      valid: validCount,
      autoConvertible: autoConvertibleCount,
      invalid: invalidCount,
      needFix: needFixCount
    };
  }, [auditedList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return auditedList.filter((item) => {
      // Status filter
      if (filterType === "NEED_FIX" && item.status === "STANDARD_INDO") return false;
      if (filterType === "AUTO_CONVERTIBLE" && item.status !== "AUTO_CONVERTIBLE") return false;
      if (filterType === "INVALID" && item.status !== "INVALID_OR_EMPTY") return false;
      if (filterType === "VALID" && item.status !== "STANDARD_INDO") return false;

      // Text search
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.namaLengkap.toLowerCase().includes(q);
        const matchNik = item.nik.includes(q);
        const matchRt = item.rt.includes(q);
        const matchDate = item.rawTanggalLahir.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchRt && !matchDate) return false;
      }

      return true;
    });
  }, [auditedList, filterType, searchQuery]);

  // Target items for batch conversion
  const autoConvertTargets = useMemo(() => {
    return auditedList
      .filter((item) => item.status === "AUTO_CONVERTIBLE" && item.recommendedIndoDate)
      .map((item) => ({
        nik: item.nik,
        tanggalLahir: item.recommendedIndoDate
      }));
  }, [auditedList]);

  // Execute Batch Convert without relying on blocked window.confirm
  const executeBatchConvert = async () => {
    if (autoConvertTargets.length === 0) return;

    setIsBatchProcessing(true);
    try {
      const success = await handleBatchUpdateFn(autoConvertTargets);
      if (success) {
        setShowBatchConfirm(false);
        setFilterType("NEED_FIX");
      }
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // Start manual inline editing
  const startEdit = (item: DateAuditItem) => {
    setEditingNik(item.nik);
    const htmlDate = formatToHtmlInputDate(item.rawTanggalLahir);
    setEditDateValue(htmlDate || "");
  };

  const cancelEdit = () => {
    setEditingNik(null);
    setEditDateValue("");
  };

  // Save manual edit
  const handleSaveManualEdit = async (item: DateAuditItem) => {
    if (!editDateValue) return;

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const formattedIndo = formatToIndoDate(editDateValue, "/");
    setSavingNik(item.nik);
    try {
      const success = await handleSingleUpdateFn(item.nik, formattedIndo, item.namaLengkap);
      if (success) {
        setEditingNik(null);
      }
    } finally {
      setSavingNik(null);
    }
  };

  // Quick apply single recommended date
  const handleApplySingleRecommendation = async (item: DateAuditItem) => {
    if (!item.recommendedIndoDate) return;
    setSavingNik(item.nik);
    try {
      await handleSingleUpdateFn(item.nik, item.recommendedIndoDate, item.namaLengkap);
    } finally {
      setSavingNik(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto flex flex-col items-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Pemeriksa & Penyelaras Format Tanggal Lahir (Format Indonesia)
                </h2>
                <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  Kalkulasi Umur Akurat
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Periksa format tanggal lahir di Spreadsheet, sesuaikan ke format baku Indonesia (DD/MM/YYYY) agar perhitungan umur warga tepat.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audit Stats Banner */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Data Penduduk</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.total} Jiwa</span>
            </div>

            {/* Valid */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-700">Format Standar (DD/MM/YYYY)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xl font-black text-emerald-700 mt-0.5 block">{stats.valid} Jiwa</span>
              <span className="text-[10px] text-emerald-600 font-medium">Umur terhitung normal</span>
            </div>

            {/* Auto Convertible */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-700">Format Non-Indo / ISO</span>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xl font-black text-amber-700 mt-0.5 block">{stats.autoConvertible} Jiwa</span>
              <span className="text-[10px] text-amber-600 font-medium">Dapat dikonversi 1-klik</span>
            </div>

            {/* Invalid / Empty */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-rose-700">Format Rusak / Kosong</span>
                <AlertOctagon className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-xl font-black text-rose-700 mt-0.5 block">{stats.invalid} Jiwa</span>
              <span className="text-[10px] text-rose-600 font-medium">Perlu diedit manual</span>
            </div>
          </div>

          {/* Action Row & 1-Click Batch Normalize */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setFilterType("NEED_FIX")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterType === "NEED_FIX"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Butuh Normalisasi ({stats.needFix})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("AUTO_CONVERTIBLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterType === "AUTO_CONVERTIBLE"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Bisa Otomatis ({stats.autoConvertible})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("INVALID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterType === "INVALID"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Rusak / Kosong ({stats.invalid})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("VALID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterType === "VALID"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Format Valid ({stats.valid})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterType === "ALL"
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Semua ({stats.total})
              </button>
            </div>

            {/* Batch Auto Normalize Button */}
            {stats.autoConvertible > 0 && (
              <button
                type="button"
                onClick={() => setShowBatchConfirm(true)}
                disabled={isBatchProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition disabled:opacity-50 cursor-pointer shrink-0 animate-pulse hover:animate-none"
              >
                {isBatchProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyinkronkan Normalisasi Data...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Normalisasi Semua ke Format Indo ({stats.autoConvertible} Data)</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* In-Modal Confirmation Banner for Batch Normalization */}
          {showBatchConfirm && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-sm animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-200/80 text-amber-900 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-5 h-5 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                      Konfirmasi Normalisasi Massal ({autoConvertTargets.length} Penduduk)
                    </h4>
                    <p className="text-[11px] text-amber-900 mt-0.5">
                      Sistem akan mengubah format tanggal lahir dari ISO/format lain menjadi format standar Indonesia (<strong>DD/MM/YYYY</strong>) agar penghitungan umur dan piramida demografi 100% akurat.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowBatchConfirm(false)}
                    disabled={isBatchProcessing}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs border border-slate-300 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeBatchConvert}
                    disabled={isBatchProcessing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isBatchProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Ya, Lanjutkan Normalisasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama Warga, NIK, RT, atau format tanggal asli..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-3 w-10 text-center rounded-l-lg">No</th>
                <th className="p-3">Nama Warga & NIK</th>
                <th className="p-3">RT / KK</th>
                <th className="p-3">Tanggal Asli di Sheet</th>
                <th className="p-3">Status Format</th>
                <th className="p-3">Standar Indonesia (DD/MM/YYYY)</th>
                <th className="p-3 text-center">Hitungan Umur</th>
                <th className="p-3 text-center rounded-r-lg min-w-[130px]">Aksi / Koreksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                      <p className="font-bold text-slate-700 text-sm">
                        {filterType === "NEED_FIX"
                          ? "Semua data tanggal lahir sudah berformat standar Indonesia!"
                          : "Tidak ada data yang sesuai dengan kriteria filter."}
                      </p>
                      <p className="text-xs text-slate-500">
                        Seluruh umur warga dapat dihitung dan disajikan dengan sempurna di dashboard & kartu keluarga.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item, idx) => {
                  const isEditing = editingNik === item.nik;
                  const isSaving = savingNik === item.nik;

                  return (
                    <tr key={`${item.nik}-${idx}`} className="hover:bg-slate-50 transition text-slate-700">
                      <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{item.namaLengkap}</span>
                        <span className="font-mono text-[11px] text-slate-500">NIK: {item.nik}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800 block">RT {item.rt || "-"}</span>
                        <span className="font-mono text-[10px] text-slate-400">KK: {item.nomorKKInduk}</span>
                      </td>

                      {/* Raw Date */}
                      <td className="p-3">
                        <span
                          className={`font-mono px-2 py-1 rounded text-[11px] font-bold inline-block ${
                            item.status === "STANDARD_INDO"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : item.status === "AUTO_CONVERTIBLE"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {item.rawTanggalLahir}
                        </span>
                      </td>

                      {/* Status & Diagnosis */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                              item.status === "STANDARD_INDO"
                                ? "text-emerald-700"
                                : item.status === "AUTO_CONVERTIBLE"
                                ? "text-amber-700"
                                : "text-rose-700"
                            }`}
                          >
                            {item.status === "STANDARD_INDO" && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {item.status === "AUTO_CONVERTIBLE" && <AlertTriangle className="w-3.5 h-3.5" />}
                            {item.status === "INVALID_OR_EMPTY" && <AlertOctagon className="w-3.5 h-3.5" />}
                            <span>{item.statusLabel}</span>
                          </span>
                          <p className="text-[10px] text-slate-500">{item.issueDescription}</p>
                        </div>
                      </td>

                      {/* Recommended Indo Date / Inline Edit Form */}
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <input
                              type="date"
                              value={editDateValue}
                              onChange={(e) => setEditDateValue(e.target.value)}
                              className="p-1.5 bg-white border border-indigo-400 rounded text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                            />
                            {editDateValue && (
                              <p className="text-[10px] text-indigo-700 font-semibold">
                                Hasil: {formatToIndoDate(editDateValue, "/")} ({calculateAgeAccurate(editDateValue)} Tahun)
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {item.recommendedIndoDate ? (
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                {item.recommendedIndoDate}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">(Perlu diinput manual)</span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Age */}
                      <td className="p-3 text-center">
                        {item.calculatedAge > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800">
                            {item.calculatedAge} Thn
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-xs">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveManualEdit(item)}
                              disabled={isSaving || !editDateValue}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs disabled:opacity-50"
                              title="Simpan Perubahan"
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                              <span>Simpan</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={isSaving}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold text-xs"
                              title="Batal"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {item.status === "AUTO_CONVERTIBLE" && (
                              <button
                                type="button"
                                onClick={() => handleApplySingleRecommendation(item)}
                                disabled={isSaving}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-xs transition"
                                title="Terapkan Format Standar Indonesia ke Spreadsheet"
                              >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                <span>Terapkan</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={isSaving}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 border border-slate-300 transition"
                              title="Edit Tanggal Lahir Manual"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Format tanggal lahir baku Indonesia yang dianjurkan adalah <strong>DD/MM/YYYY</strong> (misal: <strong>17/08/1945</strong>).
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
