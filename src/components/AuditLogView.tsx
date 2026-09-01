import React, { useState } from "react";
import { History, ShieldCheck, Search, FileText } from "lucide-react";
import { LogAudit } from "../types";

interface AuditLogViewProps {
  logs: LogAudit[];
  onRefresh: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onRefresh }) => {
  const [filterText, setFilterText] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      (log.nikTerkait || "").toLowerCase().includes(q) ||
      (log.aksi || "").toLowerCase().includes(q) ||
      (log.detailPerubahan || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      {/* Audit Log Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Jejak Audit Administrative (Sheet "Log")
          </h2>
          <p className="text-xs text-slate-500">
            Mencatat setiap peristiwa perubahan data (Tambah, Ubah, Hapus) secara realtime ke Google Sheets.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
        >
          Muat Ulang Log
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Cari log berdasarkan NIK, Aksi, atau Detail Perubahan..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
        />
      </div>

      {/* Logs Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="p-3 w-40">Waktu Audit</th>
              <th className="p-3 w-28">Tipe Aksi</th>
              <th className="p-3 w-40">NIK Terkait</th>
              <th className="p-3">Detail Perubahan Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <p className="font-semibold text-slate-600 text-xs">Belum ada catatan log aktivitas.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const aksi = (log.aksi || "").toUpperCase();
                let badgeClass = "bg-slate-100 text-slate-800";
                if (aksi.includes("TAMBAH") || aksi.includes("SEED")) {
                  badgeClass = "bg-emerald-100 text-emerald-800 font-bold";
                } else if (aksi.includes("UBAH") || aksi.includes("PINDAH")) {
                  badgeClass = "bg-blue-100 text-blue-800 font-bold";
                } else if (aksi.includes("HAPUS")) {
                  badgeClass = "bg-rose-100 text-rose-800 font-bold";
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {log.waktu}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${badgeClass}`}>
                        {log.aksi}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-800">
                      {log.nikTerkait || "-"}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      {log.detailPerubahan}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
