import React, { useState, useMemo } from "react";
import {
  FileText,
  Search,
  UserPlus,
  UserMinus,
  Printer,
  ChevronRight,
  ChevronDown,
  Home,
  MapPin,
  Users,
  Pencil,
  ArrowRightLeft,
  X,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Penduduk, KartuKeluarga, VillageProfile } from "../types";
import { KopSurat } from "./KopSurat";
import { normalizeStatusKawin } from "../lib/constants";
import { formatRtLabel } from "./WilayahRtView";
import { printElementById, openPrintWindow } from "../lib/print";
import { calculateAgeAccurate } from "../lib/dateUtils";

interface KartuKeluargaViewProps {
  data: Penduduk[];
  profile: VillageProfile;
  onAddMemberToKK: (nomorKK: string, alamat: string, rt: string) => void;
  onEditMember: (item: Penduduk) => void;
  onRemoveMemberFromKK: (nik: string, nama: string) => void;
  initialSelectedKK?: string;
}


// Relationship hierarchy weights for sorting family members
const RELATION_ORDER: Record<string, number> = {
  "KEPALA KELUARGA": 1,
  "SUAMI": 2,
  "ISTRI": 3,
  "ANAK": 4,
  "MENANTU": 5,
  "CUCU": 6,
  "ORANG TUA": 7,
  "MERTUA": 8,
  "FAMILI LAIN": 9,
  "PEMBANTU": 10,
  "LAINNYA": 11
};

export const KartuKeluargaView: React.FC<KartuKeluargaViewProps> = ({
  data,
  profile,
  onAddMemberToKK,
  onEditMember,
  onRemoveMemberFromKK,
  initialSelectedKK
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRt, setSelectedRt] = useState<string>("");
  const [selectedKKNumber, setSelectedKKNumber] = useState<string | null>(initialSelectedKK || null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }, []);

  // Extract unique RTs & KK count per RT
  const { availableRts, rtKkCountsMap } = useMemo(() => {
    const map: Record<string, number> = {};
    const set = new Set<string>();

    data.forEach((item) => {
      const rtKey = item.rt?.trim() || "001";
      set.add(rtKey);
    });

    const rts = Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return { availableRts: rts, rtKkCountsMap: map };
  }, [data]);

  // Group penduduk items into KartuKeluarga objects
  const kkList = useMemo<KartuKeluarga[]>(() => {
    const map = new Map<string, Penduduk[]>();

    data.forEach((item) => {
      const kk = item.nomorKKInduk?.trim();
      if (!kk) return;
      if (!map.has(kk)) {
        map.set(kk, []);
      }
      map.get(kk)!.push(item);
    });

    const result: KartuKeluarga[] = [];

    map.forEach((members, nomorKK) => {
      // Sort members by relationship priority
      const sortedMembers = [...members].sort((a, b) => {
        const orderA = RELATION_ORDER[a.hubunganKeluarga?.toUpperCase()] || 99;
        const orderB = RELATION_ORDER[b.hubunganKeluarga?.toUpperCase()] || 99;
        return orderA - orderB;
      });

      // Find Head of Family
      const kepala = sortedMembers.find((m) => m.hubunganKeluarga?.toUpperCase() === "KEPALA KELUARGA") || sortedMembers[0];

      result.push({
        nomorKK,
        kepalaKeluarga: kepala ? kepala.namaLengkap : "Belum Ada Kepala Keluarga",
        alamat: kepala ? kepala.alamat : "-",
        rt: kepala ? kepala.rt : "-",
        jumlahAnggota: sortedMembers.length,
        anggota: sortedMembers
      });
    });

    return result.sort((a, b) => a.nomorKK.localeCompare(b.nomorKK));
  }, [data]);

  // Filtered KK list by search query and RT
  const filteredKKList = useMemo(() => {
    return kkList.filter((kk) => {
      if (selectedRt && kk.rt !== selectedRt) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchKK = kk.nomorKK.toLowerCase().includes(q);
        const matchKepala = kk.kepalaKeluarga.toLowerCase().includes(q);
        const matchAlamat = kk.alamat.toLowerCase().includes(q);
        if (!matchKK && !matchKepala && !matchAlamat) return false;
      }
      return true;
    });
  }, [kkList, searchQuery, selectedRt]);

  // Selected KK details
  const currentKK = useMemo(() => {
    if (!selectedKKNumber) {
      return filteredKKList[0] || kkList[0] || null;
    }
    return kkList.find((kk) => kk.nomorKK === selectedKKNumber) || filteredKKList[0] || null;
  }, [kkList, filteredKKList, selectedKKNumber]);

  const handlePrintKK = () => {
    setShowPrintModal(true);
  };

  const handleDirectPrint = async () => {
    if (!currentKK) return;
    setIsPrinting(true);
    try {
      await printElementById("printable-kk", {
        title: `KK_${currentKK.nomorKK}_${currentKK.kepalaKeluarga.replace(/[^a-zA-Z0-9]/g, "_")}`,
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


  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: KK Selector & Search List */}
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Daftar Kartu Keluarga</h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredKKList.length} dari {kkList.length} KK terdaftar
            </p>
          </div>
        </div>

        {/* RT Filter Dropdown */}
        <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-2.5 pointer-events-none" />
          <select
            id="kk-rt-filter-dropdown"
            value={selectedRt}
            onChange={(e) => setSelectedRt(e.target.value)}
            className="w-full pl-8 pr-7 py-2 bg-indigo-50/70 hover:bg-indigo-50 border border-indigo-200 text-slate-800 font-semibold rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer appearance-none transition"
          >
            <option value="">Semua Wilayah RT ({kkList.length} KK)</option>
            {availableRts.map((rt) => {
              const countInRt = kkList.filter((k) => k.rt === rt).length;
              return (
                <option key={rt} value={rt}>
                  {formatRtLabel(rt)} ({countInRt} KK)
                </option>
              );
            })}
          </select>
          <div className="absolute right-2.5 top-2.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* KK Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="kk-search-input"
            type="text"
            placeholder="Cari No. KK atau Kepala Keluarga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Filter summary */}
        {(selectedRt || searchQuery) && (
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
            <span>Filter diterapkan: {filteredKKList.length} KK</span>
            <button
              type="button"
              onClick={() => {
                setSelectedRt("");
                setSearchQuery("");
              }}
              className="text-rose-600 hover:underline font-semibold"
            >
              Reset
            </button>
          </div>
        )}

        {/* KK Item List */}
        <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
          {filteredKKList.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ditemukan Kartu Keluarga sesuai pencarian atau filter RT.
            </div>
          ) : (
            filteredKKList.map((kk, idx) => {
              const isSelected = currentKK?.nomorKK === kk.nomorKK;
              return (
                <button
                  key={`${kk.nomorKK}-${idx}`}
                  onClick={() => setSelectedKKNumber(kk.nomorKK)}
                  className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                    isSelected
                      ? "bg-indigo-50 border-indigo-300 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-900">{kk.nomorKK}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                        {kk.jumlahAnggota} Anggota
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-xs">{kk.kepalaKeluarga}</p>
                    <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                      {kk.alamat} ({formatRtLabel(kk.rt)})
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isSelected ? "text-indigo-600" : "text-slate-300"}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Detailed Kartu Keluarga Document Frame */}
      <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {!currentKK ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">Pilih Kartu Keluarga di sebelah kiri</p>
          </div>
        ) : (
          <>
            {/* KK Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Dokumen Kartu Keluarga (SIAK)
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-1 font-mono tracking-wide">
                  NO. {currentKK.nomorKK}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintKK}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak KK</span>
                </button>
                <button
                  onClick={() => onAddMemberToKK(currentKK.nomorKK, currentKK.alamat, currentKK.rt)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah Anggota ke KK Ini</span>
                </button>
              </div>
            </div>

            {/* Official SIAK KK Header Information Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Nama Kepala Keluarga:</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentKK.kepalaKeluarga}</p>
                <p className="text-slate-500 font-medium mt-2">Alamat Domisili:</p>
                <p className="font-semibold text-slate-800 mt-0.5">{currentKK.alamat}</p>
              </div>

              <div>
                <p className="text-slate-500 font-medium">RT / RW:</p>
                <p className="font-semibold text-slate-800 mt-0.5">RT {currentKK.rt} / RW 001</p>
                <p className="text-slate-500 font-medium mt-2">Jumlah Anggota Terdaftar:</p>
                <p className="font-bold text-indigo-700 mt-0.5">{currentKK.jumlahAnggota} Jiwa</p>
              </div>
            </div>

            {/* Members Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                <span>Daftar Anggota Keluarga ({currentKK.jumlahAnggota} Orang)</span>
                <span className="text-[11px] font-normal text-slate-500">Urutan: Kepala Keluarga &gt; Suami/Istri &gt; Anak</span>
              </h3>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-semibold">
                      <th className="p-2.5 w-8 text-center">No</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">NIK</th>
                      <th className="p-2.5">JK</th>
                      <th className="p-2.5">TTL & Umur</th>
                      <th className="p-2.5">Hubungan</th>
                      <th className="p-2.5">Status Kawin</th>
                      <th className="p-2.5">Pekerjaan</th>
                      <th className="p-2.5 text-center w-20">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentKK.anggota.map((member, idx) => {
                      const isKepala = member.hubunganKeluarga?.toUpperCase() === "KEPALA KELUARGA";
                      return (
                        <tr
                          key={`${member.nik}-${idx}`}
                          className={`hover:bg-indigo-50/50 transition ${
                            isKepala ? "bg-amber-50/40 font-medium" : ""
                          }`}
                        >
                          <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{member.namaLengkap}</span>
                            {isKepala && (
                              <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase">
                                Kepala Keluarga
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-slate-800">{member.nik}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              member.jenisKelamin?.includes("LAKI") ? "bg-blue-100 text-blue-800" : "bg-pink-100 text-pink-800"
                            }`}>
                              {member.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span className="text-slate-800">{member.tempatLahir}, {member.tanggalLahir}</span>
                            {calculateAgeAccurate(member.tanggalLahir) > 0 && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 text-[10px] font-extrabold rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {calculateAgeAccurate(member.tanggalLahir)} Thn
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-semibold text-indigo-900">{member.hubunganKeluarga}</td>
                          <td className="p-2.5">{normalizeStatusKawin(member.statusKawin)}</td>
                          <td className="p-2.5">{member.jenisPekerjaan}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onEditMember(member)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Ubah Data Member"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              {!isKepala && (
                                <button
                                  onClick={() => onRemoveMemberFromKK(member.nik, member.namaLengkap)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Pindah / Keluarkan dari KK Ini"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Preview Cetak Kartu Keluarga */}
      {showPrintModal && currentKK && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-2 sm:p-6 overflow-y-auto flex flex-col items-center">
          {/* Top Control Header */}
          <div className="no-print w-full max-w-5xl bg-slate-900 text-white p-4 rounded-t-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Pratinjau Cetak Kartu Keluarga (KK)</h3>
                <p className="text-xs text-slate-400">
                  NO. KK: <span className="font-mono text-white font-bold">{currentKK.nomorKK}</span> &bull; Kepala: {currentKK.kepalaKeluarga}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="modal-direct-print-btn"
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
                  if (!currentKK) return;
                  openPrintWindow("printable-kk", {
                    title: `KK_${currentKK.nomorKK}_${currentKK.kepalaKeluarga.replace(/[^a-zA-Z0-9]/g, "_")}`,
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
          <div className="w-full max-w-5xl bg-white text-slate-900 p-8 sm:p-12 rounded-b-2xl shadow-2xl border border-slate-200 font-sans space-y-6" id="printable-kk">
            {/* Kop Surat Header */}
            <KopSurat profile={profile} />

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black uppercase text-slate-900 tracking-wider">
                KARTU KELUARGA
              </h3>
              <p className="text-sm font-black font-mono text-slate-800">
                NO. {currentKK.nomorKK}
              </p>
            </div>

            {/* KK Meta Info */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold border-b border-slate-300 pb-3">
              <div>
                <table className="text-left w-full">
                  <tbody>
                    <tr>
                      <td className="w-36 text-slate-500">Nama Kepala Keluarga</td>
                      <td className="w-3">:</td>
                      <td className="font-bold text-slate-900 uppercase">{currentKK.kepalaKeluarga}</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500">Alamat</td>
                      <td>:</td>
                      <td className="text-slate-800">{currentKK.alamat}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <table className="text-left w-full">
                  <tbody>
                    <tr>
                      <td className="w-36 text-slate-500">RT / RW</td>
                      <td className="w-3">:</td>
                      <td className="text-slate-800">RT {currentKK.rt} / RW 001</td>
                    </tr>
                    <tr>
                      <td className="text-slate-500">Jumlah Anggota</td>
                      <td>:</td>
                      <td className="font-bold text-slate-900">{currentKK.jumlahAnggota} Orang</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Members Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase">
                DAFTAR ANGGOTA KELUARGA
              </h4>
              <table className="w-full text-left border-collapse text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300 text-center w-8">No</th>
                    <th className="p-2 border-r border-slate-300">Nama Lengkap</th>
                    <th className="p-2 border-r border-slate-300">NIK</th>
                    <th className="p-2 border-r border-slate-300 text-center w-10">JK</th>
                    <th className="p-2 border-r border-slate-300">Tempat, Tgl Lahir</th>
                    <th className="p-2 border-r border-slate-300">Hub. Keluarga</th>
                    <th className="p-2 border-r border-slate-300">Status Kawin</th>
                    <th className="p-2">Pekerjaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentKK.anggota.map((member, idx) => (
                    <tr key={`print-kk-m-${member.nik}-${idx}`}>
                      <td className="p-2 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200 font-bold text-slate-900">{member.namaLengkap}</td>
                      <td className="p-2 border-r border-slate-200 font-mono text-slate-800">{member.nik}</td>
                      <td className="p-2 border-r border-slate-200 text-center font-bold">
                        {member.jenisKelamin?.includes("LAKI") ? "L" : "P"}
                      </td>
                      <td className="p-2 border-r border-slate-200">{member.tempatLahir}, {member.tanggalLahir}</td>
                      <td className="p-2 border-r border-slate-200 font-semibold text-slate-800">{member.hubunganKeluarga}</td>
                      <td className="p-2 border-r border-slate-200">{normalizeStatusKawin(member.statusKawin)}</td>
                      <td className="p-2">{member.jenisPekerjaan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-12">
                <p className="font-bold text-slate-800">
                  Kepala Keluarga
                </p>
                <p className="font-bold text-slate-900 underline uppercase">( {currentKK.kepalaKeluarga} )</p>
              </div>

              <div className="space-y-12">
                <p className="font-bold text-slate-800">
                  {profile.namaDesa || "DESA PONCOL"}, {currentDateFormatted}<br />
                  Kepala Desa / Lurah
                </p>
                <p className="font-bold text-slate-900 underline uppercase">( {profile.namaKepalaDesa || "H. SUPARNO, S.Sos"} )</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

