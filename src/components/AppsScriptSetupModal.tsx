import React, { useState, useEffect } from "react";
import { Copy, Check, ExternalLink, Code2, AlertTriangle, ShieldCheck, Database, X, Link, RefreshCw, Send, Sparkles, HelpCircle } from "lucide-react";
import { APPS_SCRIPT_CODE } from "../lib/constants";
import { ConfigStatus } from "../types";

interface AppsScriptSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  configStatus: ConfigStatus;
  onSaveConfig: (url: string, secret: string) => Promise<{ success: boolean; message?: string; rowCount?: number }>;
  onSeedData: () => Promise<{ success: boolean; message?: string }>;
  onReloadData: () => Promise<void>;
}

export const AppsScriptSetupModal: React.FC<AppsScriptSetupModalProps> = ({
  isOpen,
  onClose,
  configStatus,
  onSaveConfig,
  onSeedData,
  onReloadData
}) => {
  const [copied, setCopied] = useState(false);
  const [inputUrl, setInputUrl] = useState(configStatus.appsScriptUrl || "");
  const [inputSecret, setInputSecret] = useState(configStatus.apiSecret || "SIAK_SECRET_KEY_2026");
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    setInputUrl(configStatus.appsScriptUrl || "");
    setInputSecret(configStatus.apiSecret || "SIAK_SECRET_KEY_2026");
  }, [configStatus]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setFeedback({ type: "error", message: "Masukkan Web App URL dari Google Apps Script" });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const res = await onSaveConfig(inputUrl.trim(), inputSecret.trim());
    setSaving(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: `Berhasil terhubung ke Google Sheets! Terdeteksi ${res.rowCount || 0} baris data penduduk.`
      });
      await onReloadData();
    } else {
      setFeedback({
        type: "error",
        message: res.message || "Gagal menghubungkan. Periksa kembali Web App URL & tingkat akses 'Anyone'."
      });
    }
  };

  const handleResetToDemo = async () => {
    setSaving(true);
    setFeedback(null);
    const res = await onSaveConfig("CLEAR", inputSecret.trim());
    setSaving(false);
    if (res.success) {
      setInputUrl("");
      setFeedback({
        type: "success",
        message: "Konfigurasi Apps Script berhasil direset. Aplikasi kini berjalan dalam Mode Demo (Lokal)."
      });
      await onReloadData();
    } else {
      setFeedback({
        type: "error",
        message: res.message || "Gagal mereset konfigurasi."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Pengaturan Integrasi Google Sheets</h2>
              <p className="text-xs text-slate-400">Spreadsheet ID Target: <code className="font-mono text-emerald-400">{configStatus.spreadsheetId}</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Direct Connection Input Form Box */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-5 rounded-2xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Hubungkan Langsung ke Spreadsheet Anda</h3>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                configStatus.hasAppsScriptUrl
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border-amber-500/30"
              }`}>
                {configStatus.hasAppsScriptUrl ? "Status: TERHUBUNG KE SHEETS" : "Status: MODE DEMO (LOKAL)"}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Tempelkan URL Web App dari deployment Google Apps Script Anda di bawah ini. Aplikasi akan langsung menyimpan dan membaca seluruh data kependudukan secara realtime dari Google Sheets.
            </p>

            {/* Quick explanation guide for where to get these */}
            <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>Darimana mengambil APPS_SCRIPT_URL & API_SECRET?</span>
              </div>
              <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed list-disc list-inside">
                <li>
                  <strong className="text-white">APPS_SCRIPT_URL:</strong> Diperoleh setelah melakukan <strong>Deploy &gt; Web App</strong> di Google Sheets. URL ini berakhiran <code className="bg-slate-900 text-emerald-300 px-1 py-0.5 rounded font-mono">/exec</code>.
                </li>
                <li>
                  <strong className="text-white">API_SECRET:</strong> Kunci rahasia pengaman yang Anda tentukan (secara default diset: <code className="bg-slate-900 text-emerald-300 px-1 py-0.5 rounded font-mono">SIAK_SECRET_KEY_2026</code>).
                </li>
              </ul>
            </div>

            {feedback && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-200"
                  : "bg-rose-950/80 border-rose-500 text-rose-200"
              }`}>
                {feedback.type === "success" ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveConnection} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-200">
                  APPS_SCRIPT_URL (Web App URL)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-200">
                    API_SECRET Token
                  </label>
                  <input
                    type="text"
                    placeholder="SIAK_SECRET_KEY_2026"
                    value={inputSecret}
                    onChange={(e) => setInputSecret(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>{saving ? "Memverifikasi..." : "Simpan & Hubungkan"}</span>
                  </button>

                  {configStatus.hasAppsScriptUrl && (
                    <button
                      type="button"
                      onClick={handleResetToDemo}
                      disabled={saving}
                      className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition disabled:opacity-50 flex items-center gap-1.5 shrink-0 border border-slate-700"
                      title="Hapus URL dan beralih ke Mode Demo Lokal"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Reset Mode Demo</span>
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Deployment Step-by-Step */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Panduan Langkah-demi-Langkah Deploy Google Apps Script
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200 font-normal leading-relaxed text-xs">
              <li>
                Buka Spreadsheet target Anda di Google Sheets:{" "}
                <a
                  href={`https://docs.google.com/spreadsheets/d/${configStatus.spreadsheetId}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  Buka Spreadsheet ID: {configStatus.spreadsheetId} <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>Klik menu <strong>Extensi (Extensions)</strong> &gt; <strong>Apps Script</strong>.</li>
              <li>Hapus semua kode bawaan di file <code className="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs">Code.gs</code>.</li>
              <li>Salin kode lengkap Apps Script di kotak di bawah ini dan tempelkan ke editor Apps Script.</li>
              <li>
                Klik tombol <strong>Deploy</strong> (kanan atas) &gt; <strong>New deployment</strong>.
              </li>
              <li>
                Pilih Tipe Deployment: <strong>Web app</strong>.
              </li>
              <li>
                Atur Konfigurasi Wajib:
                <ul className="list-disc list-inside ml-5 mt-1 space-y-1 font-mono text-xs text-slate-800 font-semibold">
                  <li>Execute as: Me (Pemilik Spreadsheet)</li>
                  <li>Who has access: Anyone (Siapa saja) — Penting agar API frontend dapat mengirim data</li>
                </ul>
              </li>
              <li>
                Klik <strong>Deploy</strong>, izinkan otorisasi akun Google Anda, lalu salin <strong>Web App URL</strong> yang berakhiran <code className="bg-slate-200 px-1 py-0.5 rounded text-xs">/exec</code>.
              </li>
              <li>Tempelkan URL tersebut ke kolom formulir di atas dan klik <strong>Simpan &amp; Hubungkan</strong>.</li>
            </ol>
          </div>

          {/* Apps Script Code Box with Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
                Kode File Apps Script Lengkap (Code.gs)
              </span>
              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? "Berhasil Disalin!" : "Salin Kode Apps Script"}
              </button>
            </div>
            <div className="relative">
              <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono max-h-64 overflow-y-auto border border-slate-800 leading-relaxed">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

