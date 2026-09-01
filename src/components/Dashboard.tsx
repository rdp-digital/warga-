import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Users,
  FileText,
  UserCheck,
  Activity,
  Award,
  MapPin,
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Database,
  Building,
  Heart
} from "lucide-react";
import { StatsData } from "../types";

interface DashboardProps {
  stats: StatsData;
  auditLogsCount?: number;
  isOnline?: boolean;
  onNavigateToRt?: () => void;
  onNavigateToKk?: () => void;
  onNavigateToPenduduk?: () => void;
  onNavigateToSurat?: () => void;
  onOpenDateAuditor?: () => void;
  onOpenCreateModal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  auditLogsCount = 0,
  isOnline = false,
  onNavigateToRt,
  onNavigateToKk,
  onNavigateToPenduduk,
  onNavigateToSurat,
  onOpenDateAuditor,
  onOpenCreateModal
}) => {
  // Extract Gender Data
  const lakiItem = stats.jenisKelamin.find((g) => g.name.toLowerCase().includes("laki")) || { name: "Laki-Laki", value: 0 };
  const perempuanItem = stats.jenisKelamin.find((g) => g.name.toLowerCase().includes("perempuan")) || { name: "Perempuan", value: 0 };
  const totalGender = (lakiItem.value || 0) + (perempuanItem.value || 0);

  const lakiPercent = totalGender > 0 ? ((lakiItem.value / totalGender) * 100).toFixed(1) : "0.0";
  const perempuanPercent = totalGender > 0 ? ((perempuanItem.value / totalGender) * 100).toFixed(1) : "0.0";

  // Detailed 9 Age Brackets
  const kelompokUsiaList = stats.distribusiKelompokUsia || [];
  const maxAgeGroupCount = Math.max(...kelompokUsiaList.map((item) => item.count), 1);

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO BANNER (Modern Dark Navy Style with Original Concept) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a1835] via-[#0f2756] to-[#0a1b3d] border border-blue-950/60 p-6 sm:p-8 text-white shadow-xl">
        {/* Subtle background glow effect */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-black text-[11px] px-3 py-1 rounded tracking-wider uppercase shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>WARGA+ SISTEM KEPENDUDUKAN</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight">
              SISTEM INFORMASI ADMINISTRASI KEPENDUDUKAN
            </h2>
            <p className="text-emerald-300 italic font-semibold text-xs sm:text-sm tracking-wide">
              "Data Tepat, Desa Hebat"
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pt-1">
              Platform administrasi data kependudukan dan pencetakan dokumen kependudukan terpadu terhubung ke Google Sheets Spreadsheet.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 w-full sm:w-auto">
            {onNavigateToSurat && (
              <button
                onClick={onNavigateToSurat}
                className="bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-950" />
                <span>Layanan Surat Desa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
              >
                <span>+ Tambah Data Penduduk</span>
              </button>
            )}
            {onOpenDateAuditor && (
              <button
                onClick={onOpenDateAuditor}
                className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Audit Format Tanggal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STAT SUMMARY CARDS (4 Cards Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Penduduk */}
        <div
          onClick={onNavigateToPenduduk}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL PENDUDUK</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {stats.totalPenduduk} <span className="text-sm font-semibold text-slate-500">Jiwa</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Tercatat terverifikasi NIK</p>
          </div>
          <div className="w-13 h-13 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Total Kartu Keluarga (KK) */}
        <div
          onClick={onNavigateToKk}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">KARTU KELUARGA (KK)</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {stats.totalKK} <span className="text-sm font-semibold text-slate-500">KK</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Kepala keluarga terdata</p>
          </div>
          <div className="w-13 h-13 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Jejak Audit & Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">JEJAK AUDIT & LOG</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {auditLogsCount} <span className="text-sm font-semibold text-slate-500">Aktivitas</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Riwayat transaksi data</p>
          </div>
          <div className="w-13 h-13 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Konektivitas Integrasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">KONEKTIVITAS INTEGRASI</p>
            <h3 className={`text-xl sm:text-2xl font-black mt-1 ${isOnline ? "text-emerald-600" : "text-sky-600"}`}>
              {isOnline ? "TERKONEKSI" : "MODE DEMO"}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isOnline ? "Google Sheets Live" : "Database Lokal Aktif"}
            </p>
          </div>
          <div className="w-13 h-13 rounded-full bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. SECTION DEMOGRAFI HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-800">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
              STATISTIK DEMOGRAFI & DATA KEPENDUDUKAN
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Laporan grafis real-time sebaran biodata kependudukan terintegrasi.
          </p>
        </div>

        <div className="self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SINKRONISASI AKTIF: {stats.totalPenduduk} JIWA</span>
          </span>
        </div>
      </div>

      {/* 4. TWO MAIN DEMOGRAPHIC CARDS (GENDER & 9 AGE BRACKETS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* CARD 1: GENDER & SEBARAN SEX */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              GENDER & SEBARAN SEX
            </p>
            <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
              DATA BERDASARKAN JENIS KELAMIN
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-6 my-8">
            {/* LAKI-LAKI */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 border-2 border-blue-100 flex items-center justify-center shadow-inner mb-3">
                <Users className="w-9 h-9 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                LAKI-LAKI
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900">{lakiItem.value}</span>
                <span className="text-xs font-medium text-slate-500">Jiwa</span>
                <span className="bg-blue-100 text-blue-700 text-xs font-black px-2 py-0.5 rounded-md ml-1">
                  {lakiPercent}%
                </span>
              </div>
            </div>

            {/* PEREMPUAN */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-pink-50 text-pink-600 border-2 border-pink-100 flex items-center justify-center shadow-inner mb-3">
                <Users className="w-9 h-9 stroke-[2.2]" />
              </div>
              <span className="text-xs font-bold text-slate-600 tracking-wider uppercase">
                PEREMPUAN
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-2xl font-black text-slate-900">{perempuanItem.value}</span>
                <span className="text-xs font-medium text-slate-500">Jiwa</span>
                <span className="bg-pink-100 text-pink-700 text-xs font-black px-2 py-0.5 rounded-md ml-1">
                  {perempuanPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Ratio bar */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="h-3 w-full bg-pink-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${lakiPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
              <span>Laki-laki: {lakiPercent}%</span>
              <span>Perempuan: {perempuanPercent}%</span>
            </div>
          </div>
        </div>

        {/* CARD 2: DISTRIBUSI KELOMPOK UMUR (EXACT 9 BRACKETS) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                DISTRIBUSI KELOMPOK UMUR
              </p>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight mt-0.5">
                DATA PENDUDUK BERDASARKAN KELOMPOK USIA
              </h4>
            </div>
            {onOpenDateAuditor && (
              <button
                type="button"
                onClick={onOpenDateAuditor}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Audit Usia</span>
              </button>
            )}
          </div>

          {/* The 9 Horizontal Bar Rows */}
          <div className="space-y-2.5 flex-1 flex flex-col justify-center">
            {kelompokUsiaList.map((item, idx) => {
              const barWidthPercent = stats.totalPenduduk > 0 ? (item.count / maxAgeGroupCount) * 100 : 0;
              return (
                <div key={`${item.range}-${idx}`} className="flex items-center gap-3 text-xs">
                  {/* Age Range Label */}
                  <div className="w-32 sm:w-36 font-semibold text-slate-700 shrink-0 text-left">
                    {item.range}
                  </div>

                  {/* Horizontal Bar Track */}
                  <div className="flex-1 bg-slate-100 h-6 rounded-md relative flex items-center overflow-hidden">
                    <div
                      className="h-full bg-[#132742] rounded-md flex items-center px-2.5 transition-all duration-500 shadow-xs"
                      style={{
                        width: item.count > 0 ? `${Math.max(barWidthPercent, 8)}%` : "0%"
                      }}
                    >
                      {item.count > 0 && (
                        <span className="text-amber-300 font-bold text-[11px] whitespace-nowrap">
                          {item.count} Jiwa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Percentage Value */}
                  <div className="w-12 text-right font-bold text-slate-500 shrink-0">
                    {item.percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. SECONDARY DEMOGRAPHIC BREAKDOWNS (RT, PENDIDIKAN, AGAMA, STATUS KAWIN) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Count per RT */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEBARAN WILAYAH</p>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                JUMLAH PENDUDUK PER RT
              </h4>
            </div>
            {onNavigateToRt && (
              <button
                onClick={onNavigateToRt}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
              >
                <span>Lihat Detail RT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.jumlahPerRT} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                <XAxis dataKey="rt" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => [`${val} Jiwa`, "Jumlah"]} />
                <Bar dataKey="count" fill="#0f2756" radius={[4, 4, 0, 0]} name="Penduduk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Count per Education */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PENDIDIKAN</p>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                TINGKAT PENDIDIKAN TERAKHIR
              </h4>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.pendidikan} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
                <Tooltip formatter={(val) => [`${val} Jiwa`, "Jumlah"]} />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} name="Penduduk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Agama & Status Kawin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Count per Religion */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AGAMA & KEPERCAYAAN</p>
          <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight mb-4 pb-2 border-b border-slate-100">
            KOMPOSISI BERDASARKAN AGAMA
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.agama.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{item.name}</span>
                <span className="text-xl font-black text-slate-900 mt-1">
                  {item.count} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Count per Marital Status */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS PERKAWINAN</p>
          <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight mb-4 pb-2 border-b border-slate-100">
            STATUS PERKAWINAN PENDUDUK
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {stats.statusKawin.map((item, idx) => (
              <div key={`${item.name}-${idx}`} className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100/80 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-blue-800 uppercase">{item.name}</span>
                <span className="text-xl font-black text-slate-900 mt-1">
                  {item.count} <span className="text-xs font-normal text-slate-500">Jiwa</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
