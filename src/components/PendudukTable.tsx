import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Eye,
  UserX,
  MapPin,
  X,
  Printer,
  Calendar,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Penduduk, FilterOptions, VillageProfile } from "../types";
import {
  JENIS_KELAMIN_OPTIONS,
  AGAMA_OPTIONS,
  STATUS_KAWIN_OPTIONS,
  PENDIDIKAN_OPTIONS,
  normalizeStatusKawin,
  normalizeAgama
} from "../lib/constants";
import { exportPendudukToExcel } from "../lib/excel";
import { formatRtLabel } from "./WilayahRtView";
import { KopSurat } from "./KopSurat";
import { printElementById, openPrintWindow } from "../lib/print";
import { calculateAgeAccurate, auditResidentBirthDate } from "../lib/dateUtils";

interface PendudukTableProps {
  data: Penduduk[];
  profile?: VillageProfile;
  onOpenCreateModal: () => void;
  onEdit: (item: Penduduk) => void;
  onDelete: (nik: string, name: string) => void;
  onViewKK: (nomorKK: string) => void;
  onOpenDateAuditor?: () => void;
  onGenerateSurat?: (item: Penduduk) => void;
}

export const PendudukTable: React.FC<PendudukTableProps> = ({
  data,
  profile,
  onOpenCreateModal,
  onEdit,
  onDelete,
  onViewKK,
  onOpenDateAuditor,
  onGenerateSurat
}) => {
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    jenisKelamin: "",
    pendidikan: "",
    rt: "",
    statusKawin: "",
    agama: "",
    jenisPekerjaan: ""
  });

  // Print modal state
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Extract unique jobs for Pekerjaan dropdown
  const uniqueJobs = useMemo(() => {
    const jobs = new Set<string>();
    data.forEach((item) => {
      if (item.jenisPekerjaan && item.jenisPekerjaan.trim() !== "") {
        jobs.add(item.jenisPekerjaan.trim());
      }
    });
    return Array.from(jobs).sort();
  }, [data]);

  // Extract unique RTs & count residents per RT from Column Q
  const { availableRts, rtCountsMap } = useMemo(() => {
    const map: Record<string, number> = {};
    const set = new Set<string>();

    data.forEach((item) => {
      const rtKey = item.rt?.trim() || "001";
      set.add(rtKey);
      map[rtKey] = (map[rtKey] || 0) + 1;
    });

    if (set.size === 0) {
      set.add("001/001");
    }

    const rts = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return { availableRts: rts, rtCountsMap: map };
  }, [data]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Free search
      if (filters.searchQuery.trim() !== "") {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchName = (item.namaLengkap || "").toLowerCase().includes(query);
        const matchNik = (item.nik || "").toLowerCase().includes(query);
        const matchKK = (item.nomorKKInduk || "").toLowerCase().includes(query);
        if (!matchName && !matchNik && !matchKK) return false;
      }

      if (filters.jenisKelamin && item.jenisKelamin !== filters.jenisKelamin) return false;
      if (filters.pendidikan && item.pendidikan !== filters.pendidikan) return false;
      if (filters.rt && item.rt !== filters.rt) return false;
      if (filters.statusKawin && normalizeStatusKawin(item.statusKawin) !== filters.statusKawin) return false;
      if (filters.agama && normalizeAgama(item.agama) !== filters.agama) return false;
      if (filters.jenisPekerjaan && item.jenisPekerjaan !== filters.jenisPekerjaan) return false;

      return true;
    });
  }, [data, filters]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      jenisKelamin: "",
      pendidikan: "",
      rt: "",
      statusKawin: "",
      agama: "",
      jenisPekerjaan: ""
    });
    setCurrentPage(1);
  };

  const handleExport = () => {
    exportPendudukToExcel(filteredData, "Data_Penduduk_SIAK");
  };

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      await printElementById("printable-penduduk-list", {
        title: `Daftar_Penduduk_SIAK_${filters.rt ? `RT_${filters.rt}` : "Semua"}`,
        orientation: "portrait",
        pageSize: "A4",
        margin: "10mm"
      });
    } catch (e) {
      console.error("Print error:", e);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.rt ||
    filters.jenisKelamin ||
    filters.pendidikan ||
    filters.statusKawin ||
    filters.agama ||
    filters.jenisPekerjaan
  );

  // Check non-standard dates count
  const nonStandardDatesCount = useMemo(() => {
    return data.filter((d) => {
      const audit = auditResidentBirthDate(d.nik, d.namaLengkap, d.tanggalLahir);
      return audit.status !== "STANDARD_INDO";
    }).length;
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Top Action Bar & Filter Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Manajemen Data Penduduk</h2>
            <p className="text-xs text-slate-500">Kelola records kependudukan individual, lakukan pencarian & filter multi-kriteria.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onOpenDateAuditor && (
              <button
                id="audit-date-btn"
                type="button"
                onClick={onOpenDateAuditor}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer ${
                  nonStandardDatesCount > 0
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                }`}
                title="Cek format tanggal lahir di spreadsheet & sesuaikan ke format Indonesia"
              >
                <Calendar className="w-4 h-4" />
                <span>Format Tanggal & Umur</span>
                {nonStandardDatesCount > 0 && (
                  <span className="bg-amber-900 text-amber-100 text-[10px] px-1.5 py-0.5 rounded-full font-black ml-0.5">
                    {nonStandardDatesCount}
                  </span>
                )}
              </button>
            )}
            <button
              id="print-penduduk-btn"
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
              title="Cetak daftar penduduk terfilter ke printer atau PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Daftar ({filteredData.length})</span>
            </button>
            <button
              id="export-excel-btn"
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
              title="Ekspor ke spreadsheet Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>
            <button
              id="add-penduduk-btn"
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penduduk</span>
            </button>
          </div>
        </div>

        {/* Search & RT Dropdown Filter Row */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          {/* Free Text Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              id="search-penduduk-input"
              type="text"
              placeholder="Cari berdasarkan Nama Lengkap, NIK, atau Nomor KK..."
              value={filters.searchQuery}
              onChange={(e) => {
                setFilters({ ...filters, searchQuery: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setFilters({ ...filters, searchQuery: "" });
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* RT Filter Dropdown */}
          <div className="sm:w-64 md:w-72 relative shrink-0">
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-indigo-600 absolute left-3 pointer-events-none" />
              <select
                id="filter-rt-main-dropdown"
                value={filters.rt}
                onChange={(e) => {
                  setFilters({ ...filters, rt: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 hover:border-indigo-300 text-slate-800 font-semibold rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none cursor-pointer appearance-none transition"
              >
                <option value="">Semua Wilayah RT ({data.length} Jiwa)</option>
                {availableRts.map((rtVal) => {
                  const count = rtCountsMap[rtVal] || 0;
                  return (
                    <option key={rtVal} value={rtVal}>
                      {formatRtLabel(rtVal)} ({count} Jiwa)
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Filter Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* RT */}
          <div>
            <label htmlFor="filter-rt-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Wilayah RT</label>
            <select
              id="filter-rt-select"
              value={filters.rt}
              onChange={(e) => {
                setFilters({ ...filters, rt: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua RT ({data.length})</option>
              {availableRts.map((rtVal) => (
                <option key={rtVal} value={rtVal}>
                  {formatRtLabel(rtVal)} ({rtCountsMap[rtVal] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Jenis Kelamin */}
          <div>
            <label htmlFor="filter-jk-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Kelamin</label>
            <select
              id="filter-jk-select"
              value={filters.jenisKelamin}
              onChange={(e) => {
                setFilters({ ...filters, jenisKelamin: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua JK</option>
              {JENIS_KELAMIN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status Kawin */}
          <div>
            <label htmlFor="filter-status-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Status Kawin</label>
            <select
              id="filter-status-select"
              value={filters.statusKawin}
              onChange={(e) => {
                setFilters({ ...filters, statusKawin: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua Status</option>
              {STATUS_KAWIN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Agama */}
          <div>
            <label htmlFor="filter-agama-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Agama</label>
            <select
              id="filter-agama-select"
              value={filters.agama}
              onChange={(e) => {
                setFilters({ ...filters, agama: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua Agama</option>
              {AGAMA_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Pendidikan */}
          <div>
            <label htmlFor="filter-pendidikan-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Pendidikan</label>
            <select
              id="filter-pendidikan-select"
              value={filters.pendidikan}
              onChange={(e) => {
                setFilters({ ...filters, pendidikan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua Pendidikan</option>
              {PENDIDIKAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Pekerjaan */}
          <div>
            <label htmlFor="filter-pekerjaan-select" className="block text-[11px] font-semibold text-slate-500 mb-1">Jenis Pekerjaan</label>
            <select
              id="filter-pekerjaan-select"
              value={filters.jenisPekerjaan}
              onChange={(e) => {
                setFilters({ ...filters, jenisPekerjaan: e.target.value });
                setCurrentPage(1);
              }}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Semua Pekerjaan</option>
              {uniqueJobs.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Badges & Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-medium mr-1">
              Menampilkan <strong className="text-slate-900">{filteredData.length}</strong> dari <strong className="text-slate-900">{data.length}</strong> total penduduk
            </span>

            {/* Filter Badges */}
            {filters.rt && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold">
                <MapPin className="w-3 h-3" />
                <span>{formatRtLabel(filters.rt)} ({rtCountsMap[filters.rt] || 0})</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, rt: "" })}
                  className="hover:text-indigo-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.jenisKelamin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold">
                <span>JK: {filters.jenisKelamin}</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, jenisKelamin: "" })}
                  className="hover:text-blue-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.statusKawin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-semibold">
                <span>Status: {filters.statusKawin}</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, statusKawin: "" })}
                  className="hover:text-purple-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.agama && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">
                <span>Agama: {filters.agama}</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, agama: "" })}
                  className="hover:text-emerald-900 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.pendidikan && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold">
                <span>Pendidikan: {filters.pendidikan}</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, pendidikan: "" })}
                  className="hover:text-amber-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.jenisPekerjaan && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded text-[11px] font-semibold">
                <span>Pekerjaan: {filters.jenisPekerjaan}</span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, jenisPekerjaan: "" })}
                  className="hover:text-teal-950 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              id="reset-filter-btn"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold border-b border-slate-800">
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3 min-w-[180px]">Nama Lengkap</th>
                <th className="p-3">NIK</th>
                <th className="p-3">No. KK Induk</th>
                <th className="p-3">JK</th>
                <th className="p-3">TTL</th>
                <th className="p-3">Agama</th>
                <th className="p-3">Status</th>
                <th className="p-3">Pekerjaan</th>
                <th className="p-3">RT</th>
                <th className="p-3 text-center min-w-[110px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserX className="w-10 h-10 text-slate-300" />
                      <p className="font-semibold text-slate-600 text-sm">Tidak Ada Data Penduduk Ditemukan</p>
                      <p className="text-xs">Coba sesuaikan kata kunci pencarian atau ubah kriteria filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={`${item.nik}-${idx}`} className="hover:bg-indigo-50/40 transition text-slate-700">
                      <td className="p-3 text-center text-slate-400 font-medium">{globalIdx}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {item.namaLengkap}
                        <span className="block text-[10px] font-normal text-slate-400">{item.hubunganKeluarga}</span>
                      </td>
                      <td className="p-3 font-mono text-slate-800">{item.nik}</td>
                      <td className="p-3 font-mono text-slate-600">
                        <button
                          onClick={() => onViewKK(item.nomorKKInduk)}
                          className="hover:text-indigo-600 hover:underline flex items-center gap-1 text-slate-700 font-semibold"
                          title="Lihat Kartu Keluarga"
                        >
                          {item.nomorKKInduk}
                          <Eye className="w-3 h-3 text-indigo-500 inline" />
                        </button>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.jenisKelamin?.includes("LAKI")
                            ? "bg-blue-100 text-blue-800"
                            : "bg-pink-100 text-pink-800"
                        }`}>
                          {item.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{item.tempatLahir}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-600 font-mono text-[11px]">{item.tanggalLahir || "-"}</span>
                          {calculateAgeAccurate(item.tanggalLahir) > 0 ? (
                            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {calculateAgeAccurate(item.tanggalLahir)} Thn
                            </span>
                          ) : item.tanggalLahir ? (
                            <span className="text-[10px] text-amber-600 font-medium">(Cek Format)</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3">{normalizeAgama(item.agama)}</td>
                      <td className="p-3">{normalizeStatusKawin(item.statusKawin)}</td>
                      <td className="p-3">{item.jenisPekerjaan}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.rt}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Buat Surat Button */}
                          {onGenerateSurat && (
                            <button
                              onClick={() => onGenerateSurat(item)}
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md transition shadow-xs"
                              title="Buat Surat Desa untuk Penduduk Ini"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Ubah Button - Biru */}
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-md transition shadow-xs"
                            title="Ubah Data Penduduk"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {/* Hapus Button - Merah */}
                          <button
                            onClick={() => onDelete(item.nik, item.namaLengkap)}
                            className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-md transition shadow-xs"
                            title="Hapus Data Penduduk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border border-slate-300 rounded bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>baris per halaman</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-medium">
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Preview Cetak Data Penduduk Terfilter */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto flex flex-col items-center">
          {/* Top Control Header */}
          <div className="no-print w-full max-w-5xl bg-slate-900 text-white p-4 rounded-t-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pratinjau Cetak Daftar Data Penduduk</h3>
                <p className="text-xs text-slate-400">
                  {filters.rt ? formatRtLabel(filters.rt) : "Semua RT"} &bull; Total: {filteredData.length} Orang
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="modal-direct-print-penduduk-btn"
                type="button"
                disabled={isPrinting}
                onClick={handleDirectPrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                title="Langsung kirim ke printer fisik atau simpan sebagai PDF"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Dokumen...</span>
                  </>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Cetak ke Printer / PDF</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  openPrintWindow("printable-penduduk-list", {
                    title: `Daftar_Penduduk_SIAK_${filters.rt ? `RT_${filters.rt}` : "Semua"}`,
                    orientation: "portrait",
                    pageSize: "A4",
                    margin: "10mm"
                  });
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Buka dokumen di tab browser terpisah untuk cetak penuh"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Buka di Tab Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
              </button>
            </div>

          </div>

          {/* Printable Document Sheet A4 */}
          <div className="w-full max-w-5xl bg-white text-slate-900 p-8 sm:p-12 rounded-b-2xl shadow-2xl border border-slate-200 font-sans space-y-6" id="printable-penduduk-list">
            {/* Kop Surat Header */}
            {profile && <KopSurat profile={profile} />}

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black uppercase text-slate-900 tracking-wide underline">
                DAFTAR INDUK DATA KEPENDUDUKAN
              </h3>
              <p className="text-xs font-bold text-slate-700 uppercase">
                {filters.rt ? `WILAYAH: ${formatRtLabel(filters.rt)}` : "SEMUA WILAYAH / RT"} &bull; JUMLAH: {filteredData.length} JIWA
              </p>
            </div>

            {/* Active Filter Criteria Summary */}
            {hasActiveFilters && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <span className="font-bold text-slate-700 uppercase text-[10px]">Kriteria Filter Aktif:</span>
                <div className="flex flex-wrap gap-2 text-slate-600">
                  {filters.searchQuery && <span>&bull; Pencarian: "{filters.searchQuery}"</span>}
                  {filters.rt && <span>&bull; RT: {filters.rt}</span>}
                  {filters.jenisKelamin && <span>&bull; JK: {filters.jenisKelamin}</span>}
                  {filters.pendidikan && <span>&bull; Pendidikan: {filters.pendidikan}</span>}
                  {filters.statusKawin && <span>&bull; Status: {filters.statusKawin}</span>}
                  {filters.agama && <span>&bull; Agama: {filters.agama}</span>}
                </div>
              </div>
            )}

            {/* Residents Table */}
            <div className="space-y-2">
              <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300 text-center w-8">No</th>
                    <th className="p-1.5 border-r border-slate-300">Nama Lengkap</th>
                    <th className="p-1.5 border-r border-slate-300">NIK</th>
                    <th className="p-1.5 border-r border-slate-300">No. KK</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-8">JK</th>
                    <th className="p-1.5 border-r border-slate-300">Tempat, Tgl Lahir</th>
                    <th className="p-1.5 border-r border-slate-300">Hub. Keluarga</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-12">RT</th>
                    <th className="p-1.5">Pekerjaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredData.map((item, idx) => (
                    <tr key={`print-list-${item.nik}-${idx}`} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                      <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-bold text-slate-900">{item.namaLengkap}</td>
                      <td className="p-1.5 border-r border-slate-200 font-mono text-slate-800">{item.nik}</td>
                      <td className="p-1.5 border-r border-slate-200 font-mono text-slate-600">{item.nomorKKInduk}</td>
                      <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                        {item.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                      </td>
                      <td className="p-1.5 border-r border-slate-200">{item.tempatLahir}, {item.tanggalLahir}</td>
                      <td className="p-1.5 border-r border-slate-200 font-medium">{item.hubunganKeluarga}</td>
                      <td className="p-1.5 border-r border-slate-200 text-center font-bold">{item.rt || "-"}</td>
                      <td className="p-1.5 text-slate-700">{item.jenisPekerjaan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">
                  Petugas / Pengelola Data
                </p>
                <p className="font-bold text-slate-900 underline uppercase">( ............................................ )</p>
              </div>

              <div className="space-y-12">
                <p className="font-bold text-slate-800">
                  {profile?.namaDesa || "DESA PONCOL"}, {currentDateFormatted}<br />
                  Kepala Desa / Lurah
                </p>
                <p className="font-bold text-slate-900 underline uppercase">( {profile?.namaKepalaDesa || "H. SUPARNO, S.Sos"} )</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
