import React, { useState } from "react";
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface LoginModalProps {
  onLogin: (password: string) => Promise<boolean | { success: boolean; message?: string }>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Masukkan password admin");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await onLogin(password);
    setLoading(false);

    if (typeof res === "boolean") {
      if (!res) {
        setErrorMsg("Password Admin salah. Silakan coba lagi.");
      }
    } else if (res && !res.success) {
      setErrorMsg(res.message || "Password Admin salah. Silakan coba lagi.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white text-center border-b border-slate-800">
          <div className="w-16 h-16 bg-white/10 p-1 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-slate-700/60 mb-3 overflow-hidden">
            <img
              src="https://res.cloudinary.com/maswardi/image/upload/v1786322675/Screenshot_2026-08-10_074401_i01n5t.png"
              alt="Logo WARGA+"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center justify-center gap-1">
            <span>WARGA</span>
            <span className="text-emerald-400">+</span>
          </h1>
          <p className="text-xs text-emerald-400 font-semibold tracking-wide mt-0.5">Data Tepat, Desa Hebat</p>
        </div>

        {/* Login Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="text-center pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Otentikasi Petugas / Admin
            </span>
            <p className="text-slate-600 text-xs mt-1">
              Masukkan password administrator untuk mengelola data kependudukan.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-bold text-slate-700">Password Admin</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password administrator..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition shadow-md shadow-indigo-600/20 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "Memverifikasi..." : "Masuk ke Aplikasi WARGA+"}</span>
          </button>

          <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-400 font-medium">
            developed by : arunika kreatif Media
          </div>
        </form>
      </div>
    </div>
  );
};
