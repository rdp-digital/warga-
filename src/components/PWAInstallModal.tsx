import React, { useState, useEffect } from "react";
import { Download, Smartphone, Laptop, Share2, PlusSquare, CheckCircle2, Sparkles, X, ShieldCheck } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] Aplikasi WARGA+ berhasil diinstal!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] User accepted install prompt");
          setDeferredPrompt(null);
          setIsInstallable(false);
          setIsInstalled(true);
          return true;
        } else {
          console.log("[PWA] User dismissed install prompt");
          return false;
        }
      } catch (err) {
        console.error("[PWA] Error triggering install:", err);
        return false;
      }
    }
    return false;
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    triggerInstall,
    deferredPrompt
  };
}

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isIOS: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  isInstalled,
  isInstallable
}) => {
  const [installing, setInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    const success = await onInstall();
    setInstalling(false);
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
        setInstallSuccess(false);
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-slate-100 relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Hero */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-[#091428] p-6 text-center border-b border-slate-800 relative">
          <div className="w-20 h-20 mx-auto mb-3 bg-white/10 p-1 rounded-2xl shadow-xl border border-slate-700/80 overflow-hidden flex items-center justify-center relative group">
            <img
              src="https://res.cloudinary.com/maswardi/image/upload/v1786322675/Screenshot_2026-08-10_074401_i01n5t.png"
              alt="WARGA+ App Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl shadow-md"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Progressive Web App (PWA)</span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            Instal Aplikasi <span className="text-emerald-400">WARGA+</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Pasang di HP Android, iPhone, Windows, atau Mac Anda untuk akses instan tanpa perlu membuka browser.
          </p>
        </div>

        {/* Features / Benefits */}
        <div className="p-5 space-y-3.5 bg-slate-900/90 text-xs">
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-[12.5px]">Akses Cepat & Layar Penuh</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Buka aplikasi langsung dari layar beranda / desktop seperti aplikasi resmi native.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white text-[12.5px]">Ringan & Hemat Kuota</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Caching pintar memastikan antarmuka dimuat instan tanpa membebani memori perangkat.
                </p>
              </div>
            </div>
          </div>

          {/* Installation Instructions for iOS / Desktop without direct prompt */}
          {isIOS ? (
            <div className="p-3.5 bg-blue-950/40 border border-blue-800/60 rounded-2xl space-y-2 text-slate-200">
              <div className="flex items-center gap-2 font-bold text-blue-300 text-xs">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span>Cara Instal di iPhone / iPad (Safari):</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11.5px] text-slate-300">
                <li>
                  Tekan tombol <strong className="text-white">Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-400" /> di bagian bawah Safari.
                </li>
                <li>
                  Gulir ke bawah dan pilih <strong className="text-white">"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-blue-400" />.
                </li>
                <li>
                  Tekan <strong className="text-emerald-400">"Tambah" (Add)</strong> di pojok kanan atas.
                </li>
              </ol>
            </div>
          ) : !isInstallable && !isInstalled ? (
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-1.5 text-slate-300 text-[11.5px]">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <span>Petunjuk Instalasi di Browser:</span>
              </p>
              <p className="text-slate-400">
                Klik ikon <strong>Instal (Download)</strong> di bilah alamat (URL bar) browser Anda, atau buka menu browser (titik 3) lalu pilih <strong>"Instal WARGA+"</strong>.
              </p>
            </div>
          ) : null}
        </div>

        {/* Action Footer */}
        <div className="p-5 pt-0 bg-slate-900 flex flex-col gap-2.5">
          {installSuccess || isInstalled ? (
            <div className="w-full py-3 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Aplikasi WARGA+ Berhasil Terpasang!</span>
            </div>
          ) : (
            <>
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={installing}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{installing ? "Memproses..." : "Instal Aplikasi Sekarang"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
