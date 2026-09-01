import React, { useState, useMemo } from "react";
import {
  MapPin,
  Users,
  Home,
  UserCheck,
  Search,
  FileSpreadsheet,
  Printer,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  Filter,
  User,
  HeartPulse,
  X,
  FileText,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Penduduk, KartuKeluarga, VillageProfile } from "../types";
import { RT_OPTIONS } from "../lib/constants";
import { exportPendudukToExcel } from "../lib/excel";
import { KopSurat } from "./KopSurat";
import { printElementById, openPrintWindow } from "../lib/print";
import { calculateAgeAccurate } from "../lib/dateUtils";

interface WilayahRtViewProps {
  data: Penduduk[];
  profile: VillageProfile;
  onEdit: (item: Penduduk) => void;
  onDelete: (nik: string, name: string) => void;
  onViewKK: (nomorKK: string) => void;
  onAddMemberToKK?: (nomorKK: string, alamat: string, rt: string) => void;
}

export function formatRtLabel(rtVal: string): string {
  if (!rtVal || !rtVal.trim()) return "RT -";
  const trimmed = rtVal.trim();
  if (trimmed.toUpperCase().startsWith("RT")) {
    return trimmed;
  }
  return `RT ${trimmed}`;
}

export const WilayahRtView: React.FC<WilayahRtViewProps> = ({
  data,
  profile,
  onEdit,
  onDelete,
  onViewKK
}) => {

  // Extract all unique RTs directly from Column Q in the data
  const availableRts = useMemo(() => {
    const set = new Set<string>();
    data.forEach((p) => {
      if (p.rt && p.rt.trim()) {
        set.add(p.rt.trim());
      }
    });
    if (set.size === 0) {
      RT_OPTIONS.forEach((opt) => set.add(opt));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [data]);

  const [selectedRt, setSelectedRt] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [kkPage, setKkPage] = useState<number>(1);
  const [pendudukPage, setPendudukPage] = useState<number>(1);
  const [pendudukPageSize, setPendudukPageSize] = useState<number>(10);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, []);

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    try {
      const rtText = selectedRt === "ALL" ? "Semua_RT" : `RT_${selectedRt.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await printElementById("printable-rekap-rt", {
        title: `Laporan_Rekapitulasi_${rtText}`,
        orientation: "portrait",
        pageSize: "A4",
        margin: "10mm"
      });
    } catch (e) {
      console.error("Print failed:", e);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Reset KK & Penduduk pagination when RT or search changes
  React.useEffect(() => {
    setKkPage(1);
    setPendudukPage(1);
  }, [selectedRt, searchQuery]);

  // Statistics grouped by RT
  const rtStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalPenduduk: number;
        kkSet: Set<string>;
        lakiLaki: number;
        perempuan: number;
        balita: number;
        lansia: number;
        produktif: number;
      }
    >();

    availableRts.forEach((rt) => {
      map.set(rt, {
        totalPenduduk: 0,
        kkSet: new Set(),
        lakiLaki: 0,
        perempuan: 0,
        balita: 0,
        lansia: 0,
        produktif: 0
      });
    });

    const now = new Date();

    data.forEach((p) => {
      const rtKey = p.rt?.trim() || availableRts[0] || "001";
      if (!map.has(rtKey)) {
        map.set(rtKey, {
          totalPenduduk: 0,
          kkSet: new Set(),
          lakiLaki: 0,
          perempuan: 0,
          balita: 0,
          lansia: 0,
          produktif: 0
        });
      }

      const stats = map.get(rtKey)!;
      stats.totalPenduduk += 1;
      if (p.nomorKKInduk) stats.kkSet.add(p.nomorKKInduk.trim());

      const jk = (p.jenisKelamin || "").toUpperCase();
      if (jk.includes("LAKI")) stats.lakiLaki += 1;
      else if (jk.includes("PEREMPUAN")) stats.perempuan += 1;

      // Calculate age
      if (p.tanggalLahir) {
        const dob = new Date(p.tanggalLahir);
        if (!isNaN(dob.getTime())) {
          let age = now.getFullYear() - dob.getFullYear();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
            age--;
          }
          if (age <= 5) stats.balita += 1;
          else if (age >= 60) stats.lansia += 1;
          if (age >= 15 && age <= 59) stats.produktif += 1;
        }
      }
    });

    return map;
  }, [data, availableRts]);

  // Filter residents for selected RT & search query
  const filteredRtPenduduk = useMemo(() => {
    return data.filter((item) => {
      const matchRt =
        selectedRt === "ALL"
          ? true
          : (item.rt?.trim() || "").toLowerCase() === selectedRt.toLowerCase();
      if (!matchRt) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (item.namaLengkap || "").toLowerCase().includes(q) ||
        (item.nik || "").toLowerCase().includes(q) ||
        (item.nomorKKInduk || "").toLowerCase().includes(q) ||
        (item.alamat || "").toLowerCase().includes(q)
      );
    });
  }, [data, selectedRt, searchQuery]);

  // Group residents in selected RT into Kartu Keluarga
  const kkInRt = useMemo(() => {
    const map = new Map<string, Penduduk[]>();
    filteredRtPenduduk.forEach((item) => {
      const kk = item.nomorKKInduk?.trim();
      if (!kk) return;
      if (!map.has(kk)) map.set(kk, []);
      map.get(kk)!.push(item);
    });

    const result: { nomorKK: string; kepala: string; alamat: string; totalAnggota: number }[] = [];
    map.forEach((members, nomorKK) => {
      const kepalaObj = members.find((m) => m.hubunganKeluarga?.toUpperCase() === "KEPALA KELUARGA") || members[0];
      result.push({
        nomorKK,
        kepala: kepalaObj ? kepalaObj.namaLengkap : "Belum Ada Kepala",
        alamat: kepalaObj ? kepalaObj.alamat : "-",
        totalAnggota: members.length
      });
    });
    return result;
  }, [filteredRtPenduduk]);

  // KK List Pagination (10 per page)
  const kkPageSize = 10;
  const totalKkPages = Math.ceil(kkInRt.length / kkPageSize) || 1;
  const paginatedKk = useMemo(() => {
    const start = (kkPage - 1) * kkPageSize;
    return kkInRt.slice(start, start + kkPageSize);
  }, [kkInRt, kkPage]);

  // Resident List Pagination (10 per page default)
  const totalPendudukPages = Math.ceil(filteredRtPenduduk.length / pendudukPageSize) || 1;
  const paginatedRtPenduduk = useMemo(() => {
    const start = (pendudukPage - 1) * pendudukPageSize;
    return filteredRtPenduduk.slice(start, start + pendudukPageSize);
  }, [filteredRtPenduduk, pendudukPage, pendudukPageSize]);

  const currentStats = useMemo(() => {
    if (selectedRt === "ALL") {
      let totalP = 0;
      const allKk = new Set<string>();
      let l = 0, p = 0, b = 0, lansia = 0, prod = 0;
      rtStatsMap.forEach((s) => {
        totalP += s.totalPenduduk;
        s.kkSet.forEach((k) => allKk.add(k));
        l += s.lakiLaki;
        p += s.perempuan;
        b += s.balita;
        lansia += s.lansia;
        prod += s.produktif;
      });
      return { totalPenduduk: totalP, totalKK: allKk.size, lakiLaki: l, perempuan: p, balita: b, lansia, produktif: prod };
    }
    const s = rtStatsMap.get(selectedRt);
    return {
      totalPenduduk: s ? s.totalPenduduk : 0,
      totalKK: s ? s.kkSet.size : 0,
      lakiLaki: s ? s.lakiLaki : 0,
      perempuan: s ? s.perempuan : 0,
      balita: s ? s.balita : 0,
      lansia: s ? s.lansia : 0,
      produktif: s ? s.produktif : 0
    };
  }, [selectedRt, rtStatsMap]);

  const handleExportRt = () => {
    const filename = selectedRt === "ALL" ? "Data_Penduduk_Semua_RT" : `Data_Penduduk_RT_${selectedRt}`;
    exportPendudukToExcel(filteredRtPenduduk, filename);
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Melihat Data Penduduk Berdasarkan RT</h2>
            <p className="text-xs text-slate-500">
              Pilih wilayah RT untuk menyaring data warga, melihat demografi, serta mengekspor rekapitulasi data RT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rekap RT</span>
          </button>
          <button
            onClick={handleExportRt}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel {selectedRt === "ALL" ? "Semua RT" : formatRtLabel(selectedRt)}</span>
          </button>
        </div>
      </div>

      {/* RT Navigation Dropdown Selector */}
      <div className="bg-slate-900 p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 text-indigo-300 rounded-xl border border-indigo-500/30">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <label htmlFor="rt-dropdown-select" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Pilih Wilayah Rukun Tetangga (RT):
            </label>
            <p className="text-[11px] text-slate-400">
              Saring seluruh data warga &amp; Kartu Keluarga berdasarkan data RT di Kolom Q
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            id="rt-dropdown-select"
            value={selectedRt}
            onChange={(e) => setSelectedRt(e.target.value)}
            className="w-full md:w-72 px-4 py-2.5 bg-slate-800 text-white font-bold text-sm rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer shadow-inner"
          >
            <option value="ALL">Semua RT ({data.length} Jiwa)</option>
            {availableRts.map((rt) => {
              const stats = rtStatsMap.get(rt);
              const count = stats ? stats.totalPenduduk : 0;
              return (
                <option key={rt} value={rt}>
                  {formatRtLabel(rt)} ({count} Jiwa)
                </option>
              );
            })}
          </select>
          
          <span className="bg-indigo-900/60 text-indigo-200 border border-indigo-700/50 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap hidden sm:inline-block">
            {selectedRt === "ALL" ? `${data.length} Jiwa` : `${currentStats.totalPenduduk} Jiwa`}
          </span>
        </div>
      </div>

      {/* Selected RT Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Penduduk</span>
          <div className="text-xl font-black text-slate-900">{currentStats.totalPenduduk} <span className="text-xs font-normal text-slate-500">Jiwa</span></div>
          <span className="text-[10px] text-indigo-600 font-semibold">{selectedRt === "ALL" ? "Semua Wilayah" : formatRtLabel(selectedRt)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Kepala Keluarga</span>
          <div className="text-xl font-black text-emerald-700">{currentStats.totalKK} <span className="text-xs font-normal text-slate-500">KK</span></div>
          <span className="text-[10px] text-emerald-600 font-semibold">Kartu Keluarga</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Laki-Laki</span>
          <div className="text-xl font-black text-blue-700">{currentStats.lakiLaki} <span className="text-xs font-normal text-slate-500">Orang</span></div>
          <span className="text-[10px] text-blue-600 font-semibold">
            {currentStats.totalPenduduk > 0 ? Math.round((currentStats.lakiLaki / currentStats.totalPenduduk) * 100) : 0}% Proporsi
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Perempuan</span>
          <div className="text-xl font-black text-pink-700">{currentStats.perempuan} <span className="text-xs font-normal text-slate-500">Orang</span></div>
          <span className="text-[10px] text-pink-600 font-semibold">
            {currentStats.totalPenduduk > 0 ? Math.round((currentStats.perempuan / currentStats.totalPenduduk) * 100) : 0}% Proporsi
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Usia Produktif</span>
          <div className="text-xl font-black text-amber-700">{currentStats.produktif} <span className="text-xs font-normal text-slate-500">Jiwa</span></div>
          <span className="text-[10px] text-amber-600 font-semibold">15 - 59 Tahun</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Balita &amp; Lansia</span>
          <div className="text-xl font-black text-purple-700">
            {currentStats.balita + currentStats.lansia} <span className="text-xs font-normal text-slate-500">Jiwa</span>
          </div>
          <span className="text-[10px] text-purple-600 font-semibold">Balita {currentStats.balita} | Lansia {currentStats.lansia}</span>
        </div>
      </div>

      {/* Kartu Keluarga Table List in Selected RT */}
      {kkInRt.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>Daftar Kartu Keluarga di {selectedRt === "ALL" ? "Semua RT" : formatRtLabel(selectedRt)} ({kkInRt.length} KK)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar terstruktur seluruh KK di wilayah pilihan. Klik tombol aksi untuk membuka dokumen lengkap KK.
              </p>
            </div>

            {totalKkPages > 1 && (
              <div className="flex items-center gap-2 text-xs self-end sm:self-auto">
                <span className="text-slate-500 font-medium">
                  Halaman <span className="font-bold text-slate-800">{kkPage}</span> dari <span className="font-bold text-slate-800">{totalKkPages}</span>
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={kkPage === 1}
                    onClick={() => setKkPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
                  >
                    &laquo; Prev
                  </button>
                  <button
                    disabled={kkPage === totalKkPages}
                    onClick={() => setKkPage((p) => Math.min(totalKkPages, p + 1))}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
                  >
                    Next &raquo;
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5">Nomor Kartu Keluarga (KK)</th>
                  <th className="p-2.5">Kepala Keluarga</th>
                  <th className="p-2.5">Alamat</th>
                  <th className="p-2.5 text-center">Anggota</th>
                  <th className="p-2.5 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedKk.map((kk, idx) => {
                  const globalIdx = (kkPage - 1) * kkPageSize + idx + 1;
                  return (
                    <tr key={`${kk.nomorKK}-${idx}`} className="hover:bg-indigo-50/30 transition text-slate-700">
                      <td className="p-2.5 text-center text-slate-400 font-medium">{globalIdx}</td>
                      <td className="p-2.5 font-mono font-bold text-indigo-900">{kk.nomorKK}</td>
                      <td className="p-2.5 font-bold text-slate-900">{kk.kepala}</td>
                      <td className="p-2.5 text-slate-600">{kk.alamat}</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[11px]">
                          {kk.totalAnggota} Jiwa
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => onViewKK(kk.nomorKK)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 transition inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail KK</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Resident Table in Selected RT */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Daftar Penduduk {selectedRt === "ALL" ? "Semua RT" : formatRtLabel(selectedRt)}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredRtPenduduk.length === 0
                ? "Tidak ada data penduduk."
                : `Menampilkan ${
                    (pendudukPage - 1) * pendudukPageSize + 1
                  } - ${Math.min(
                    pendudukPage * pendudukPageSize,
                    filteredRtPenduduk.length
                  )} dari ${filteredRtPenduduk.length} warga terdaftar.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span>Tampilkan:</span>
              <select
                value={pendudukPageSize}
                onChange={(e) => {
                  setPendudukPageSize(Number(e.target.value));
                  setPendudukPage(1);
                }}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={10}>10 / hal</option>
                <option value={20}>20 / hal</option>
                <option value={50}>50 / hal</option>
                <option value={100}>100 / hal</option>
              </select>
            </div>

            {/* Search Box inside RT */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Cari nama, NIK, No KK...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Resident Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="p-2.5 w-10 text-center">No</th>
                <th className="p-2.5">Nama Lengkap</th>
                <th className="p-2.5">NIK</th>
                <th className="p-2.5">No. KK</th>
                <th className="p-2.5">JK</th>
                <th className="p-2.5">TTL</th>
                <th className="p-2.5">Pekerjaan</th>
                <th className="p-2.5">Alamat</th>
                <th className="p-2.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRtPenduduk.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Tidak ditemukan data penduduk di {selectedRt === "ALL" ? "Semua RT" : formatRtLabel(selectedRt)}.
                  </td>
                </tr>
              ) : (
                paginatedRtPenduduk.map((item, idx) => {
                  const globalIdx = (pendudukPage - 1) * pendudukPageSize + idx + 1;
                  return (
                    <tr key={`${item.nik}-${idx}`} className="hover:bg-indigo-50/40 transition">
                      <td className="p-2.5 text-center text-slate-400 font-medium">{globalIdx}</td>
                      <td className="p-2.5">
                        <span className="font-bold text-slate-900 block">{item.namaLengkap}</span>
                        <span className="text-[10px] text-slate-400">{item.hubunganKeluarga}</span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-800">{item.nik}</td>
                      <td className="p-2.5 font-mono text-slate-700">
                        <button
                          onClick={() => onViewKK(item.nomorKKInduk)}
                          className="hover:text-indigo-600 hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          {item.nomorKKInduk}
                          <Eye className="w-3 h-3 text-indigo-500" />
                        </button>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.jenisKelamin?.includes("LAKI") ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                        }`}>
                          {item.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-semibold text-slate-800">{item.tempatLahir}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-600 font-mono text-[11px]">{item.tanggalLahir || "-"}</span>
                          {calculateAgeAccurate(item.tanggalLahir) > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {calculateAgeAccurate(item.tanggalLahir)} Thn
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2.5">{item.jenisPekerjaan}</td>
                      <td className="p-2.5 text-slate-600">{item.alamat}</td>
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Ubah Data"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item.nik, item.namaLengkap)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Data"
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

        {/* Pagination Controls for Resident Table */}
        {totalPendudukPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              Halaman <span className="font-bold text-slate-800">{pendudukPage}</span> dari{" "}
              <span className="font-bold text-slate-800">{totalPendudukPages}</span> ({filteredRtPenduduk.length} total warga)
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                disabled={pendudukPage === 1}
                onClick={() => setPendudukPage(1)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
                title="Halaman Pertama"
              >
                &laquo; Awal
              </button>
              <button
                disabled={pendudukPage === 1}
                onClick={() => setPendudukPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
              >
                &lsaquo; Prev
              </button>
              
              <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black rounded-lg">
                {pendudukPage}
              </span>

              <button
                disabled={pendudukPage === totalPendudukPages}
                onClick={() => setPendudukPage((p) => Math.min(totalPendudukPages, p + 1))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
              >
                Next &rsaquo;
              </button>
              <button
                disabled={pendudukPage === totalPendudukPages}
                onClick={() => setPendudukPage(totalPendudukPages)}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg text-slate-700 font-bold transition"
                title="Halaman Terakhir"
              >
                Akhir &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Preview Cetak Rekap RT */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto flex flex-col items-center">
          {/* Print Modal Top Controls */}
          <div className="no-print w-full max-w-5xl bg-slate-900 text-white p-4 rounded-t-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pratinjau Cetak Laporan Rekapitulasi RT</h3>
                <p className="text-xs text-slate-400">
                  {selectedRt === "ALL" ? "Semua Wilayah RT" : formatRtLabel(selectedRt)} &bull; {filteredRtPenduduk.length} Penduduk &bull; {kkInRt.length} KK
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="modal-direct-print-rt-btn"
                type="button"
                disabled={isPrinting}
                onClick={handleDirectPrint}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
                title="Langsung kirim ke printer fisik atau simpan sebagai PDF"
              >
                {isPrinting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyiapkan Printer...</span>
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
                  const rtText = selectedRt === "ALL" ? "Semua_RT" : `RT_${selectedRt.replace(/[^a-zA-Z0-9]/g, "_")}`;
                  openPrintWindow("printable-rekap-rt", {
                    title: `Laporan_Rekapitulasi_${rtText}`,
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

          {/* Printable Report Document Sheet */}
          <div className="w-full max-w-5xl bg-white text-slate-900 p-8 sm:p-12 rounded-b-2xl shadow-2xl border border-slate-200 font-sans space-y-6" id="printable-rekap-rt">
            {/* Kop Surat Header */}
            <KopSurat profile={profile} />


            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black uppercase text-slate-900 underline tracking-wide">
                LAPORAN REKAPITULASI DATA KEPENDUDUKAN &amp; DEMOGRAFI
              </h3>
              <p className="text-xs font-bold text-slate-700 uppercase">
                WILAYAH: {selectedRt === "ALL" ? "SEMUA RUKUN TETANGGA (RT)" : formatRtLabel(selectedRt)}
              </p>
            </div>

            {/* Section I: Demography Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1">
                I. RINGKASAN DEMOGRAFI &amp; STATISTIK WILAYAH
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Penduduk</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.totalPenduduk} Jiwa</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Total Kartu Keluarga (KK)</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.totalKK} KK</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Laki-Laki / Perempuan</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.lakiLaki} L / {currentStats.perempuan} P</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Balita (&le; 5 Thn)</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.balita} Jiwa</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Usia Produktif (15-59 Thn)</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.produktif} Jiwa</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Lansia (&ge; 60 Thn)</span>
                  <span className="text-sm font-black text-slate-900">{currentStats.lansia} Jiwa</span>
                </div>
              </div>
            </div>

            {/* Section II: List of KKs */}
            {kkInRt.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1">
                  II. DAFTAR KARTU KELUARGA TERDAFTAR ({kkInRt.length} KK)
                </h4>
                <table className="w-full text-left border-collapse text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                      <th className="p-1.5 border-r border-slate-300 text-center w-8">No</th>
                      <th className="p-1.5 border-r border-slate-300">Nomor Kartu Keluarga</th>
                      <th className="p-1.5 border-r border-slate-300">Kepala Keluarga</th>
                      <th className="p-1.5 border-r border-slate-300">Alamat</th>
                      <th className="p-1.5 text-center w-20">Anggota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {kkInRt.map((kk, idx) => (
                      <tr key={`print-kk-${kk.nomorKK}-${idx}`}>
                        <td className="p-1.5 border-r border-slate-200 text-center font-medium text-slate-500">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-200 font-mono font-bold text-slate-900">{kk.nomorKK}</td>
                        <td className="p-1.5 border-r border-slate-200 font-bold text-slate-800">{kk.kepala}</td>
                        <td className="p-1.5 border-r border-slate-200 text-slate-700">{kk.alamat}</td>
                        <td className="p-1.5 text-center font-bold text-slate-800">{kk.totalAnggota} Jiwa</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Section III: Complete Resident List (All items, no pagination) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-300 pb-1">
                III. DAFTAR INDIVIDUAL PENDUDUK ({filteredRtPenduduk.length} JIWA)
              </h4>
              <table className="w-full text-left border-collapse text-[11px] border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="p-1.5 border-r border-slate-300 text-center w-8">No</th>
                    <th className="p-1.5 border-r border-slate-300">Nama Lengkap</th>
                    <th className="p-1.5 border-r border-slate-300">NIK</th>
                    <th className="p-1.5 border-r border-slate-300">No. KK</th>
                    <th className="p-1.5 border-r border-slate-300 text-center w-8">L/P</th>
                    <th className="p-1.5 border-r border-slate-300">Tempat, Tgl Lahir</th>
                    <th className="p-1.5 border-r border-slate-300">Pekerjaan</th>
                    <th className="p-1.5">Alamat / RT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRtPenduduk.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-500">
                        Tidak ada data warga untuk dicetak.
                      </td>
                    </tr>
                  ) : (
                    filteredRtPenduduk.map((item, idx) => (
                      <tr key={`print-resident-${item.nik}-${idx}`}>
                        <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-200 font-bold text-slate-900">
                          {item.namaLengkap}
                          <span className="block text-[9px] font-normal text-slate-500">{item.hubunganKeluarga}</span>
                        </td>
                        <td className="p-1.5 border-r border-slate-200 font-mono text-slate-800">{item.nik}</td>
                        <td className="p-1.5 border-r border-slate-200 font-mono text-slate-700">{item.nomorKKInduk}</td>
                        <td className="p-1.5 border-r border-slate-200 text-center font-bold">
                          {item.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                        </td>
                        <td className="p-1.5 border-r border-slate-200">
                          {item.tempatLahir}, {item.tanggalLahir}
                        </td>
                        <td className="p-1.5 border-r border-slate-200">{item.jenisPekerjaan}</td>
                        <td className="p-1.5">{item.rt || item.alamat || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Section IV: Signatures */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">Mengetahui,<br />Ketua RW</p>
                <p className="font-bold text-slate-900 underline">( ..................................... )</p>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-slate-800">Disetujui,<br />Kepala Desa / Lurah</p>
                <div>
                  <p className="font-bold text-slate-900 underline">{profile.namaKepalaDesa || "H. SUPARNO, S.Sos"}</p>
                </div>
              </div>
              <div className="space-y-12">
                <p className="font-bold text-slate-800">
                  Dicetak pada {currentDateFormatted}<br />Ketua RT {selectedRt === "ALL" ? "Wilayah" : formatRtLabel(selectedRt)}
                </p>
                <p className="font-bold text-slate-900 underline">( ..................................... )</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
