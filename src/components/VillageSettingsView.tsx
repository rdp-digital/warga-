import React, { useState } from "react";
import { Building2, Save, RotateCcw, Upload, Image as ImageIcon, CheckCircle, Mail, Globe, MapPin, UserCheck, Hash } from "lucide-react";
import { VillageProfile } from "../types";
import { KopSurat } from "./KopSurat";
import { DEFAULT_VILLAGE_PROFILE, OFFICIAL_MAGETAN_LOGO } from "../lib/profile";

interface VillageSettingsViewProps {
  profile: VillageProfile;
  onSaveProfile: (newProfile: VillageProfile) => void;
}

export const VillageSettingsView: React.FC<VillageSettingsViewProps> = ({
  profile,
  onSaveProfile
}) => {
  const [formData, setFormData] = useState<VillageProfile>({ ...profile });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSavedSuccess(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran gambar terlalu besar. Maksimal 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
        setSavedSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefault = () => {
    if (window.confirm("Apakah Anda yakin ingin mengembalikan data Kop Surat ke setelan awal Desa Poncol, Magetan?")) {
      setFormData(DEFAULT_VILLAGE_PROFILE);
      onSaveProfile(DEFAULT_VILLAGE_PROFILE);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Pengaturan Profil Desa &amp; Kop Surat</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Sesuaikan data pemerintah desa, alamat kantor, kontak, dan logo yang akan digunakan secara otomatis pada seluruh dokumen cetak (Rekap RT &amp; Kartu Keluarga).
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Pengaturan berhasil disimpan!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Settings */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Formulir Data Kertas &amp; Kop Surat</span>
            </h3>
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-xs text-slate-500 hover:text-rose-600 font-semibold transition flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Ke Default</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Desa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Nama Desa / Kelurahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaDesa"
                  required
                  placeholder="Contoh: DESA PONCOL"
                  value={formData.namaDesa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Nama Kecamatan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Nama Kecamatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaKecamatan"
                  required
                  placeholder="Contoh: KECAMATAN PONCOL"
                  value={formData.namaKecamatan}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nama Kabupaten */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  3. Nama Kabupaten / Kota <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="namaKabupaten"
                  required
                  placeholder="Contoh: PEMERINTAH KABUPATEN MAGETAN"
                  value={formData.namaKabupaten}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Kode Pos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>7. Kode Pos</span>
                </label>
                <input
                  type="text"
                  name="kodePos"
                  placeholder="Contoh: 633362"
                  value={formData.kodePos}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Alamat Kantor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>4. Alamat Kantor Desa</span> <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="alamatKantor"
                rows={2}
                required
                placeholder="Contoh: Jalan Slamet Riyadi, Desa Poncol"
                value={formData.alamatKantor}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Email Kantor */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>5. Email Kantor</span>
                </label>
                <input
                  type="email"
                  name="emailKantor"
                  placeholder="pemdesponcol@gmail.com"
                  value={formData.emailKantor}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Website Desa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>6. Website Desa</span>
                </label>
                <input
                  type="text"
                  name="websiteDesa"
                  placeholder="https://poncol.magetan.go.id"
                  value={formData.websiteDesa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Nama Kepala Desa */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>8. Nama Kepala Desa / Lurah</span> <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="namaKepalaDesa"
                required
                placeholder="Contoh: H. SUPARNO, S.Sos"
                value={formData.namaKepalaDesa}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Logo Desa / URL / Upload */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>9. Logo Lambang Daerah / Desa</span>
              </label>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
                <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                  <img
                    src={
                      formData.logoUrl && !formData.logoUrl.includes("Screenshot_2026-08-10_074401")
                        ? formData.logoUrl
                        : OFFICIAL_MAGETAN_LOGO
                    }
                    alt="Logo Preview"
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    name="logoUrl"
                    placeholder="URL Gambar Logo (https://...)"
                    value={formData.logoUrl || ""}
                    onChange={handleChange}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Unggah Gambar Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">Format JPG/PNG maks 2MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profile</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Kop Surat Preview Card */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Pratinjau Langsung Kop Surat Dokumen (Ukuran Kertas A4)</span>
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                Ukuran A4 Ready
              </span>
            </div>

            {/* Rendered Kop Surat Component */}
            <div className="bg-white p-4 border border-slate-300 rounded-xl shadow-inner overflow-x-auto">
              <KopSurat profile={formData} />

              <div className="text-center py-6 border border-dashed border-slate-300 rounded-lg text-slate-400 text-xs">
                <p className="font-bold text-slate-600">[ Area Isi Dokumen Rekapitulasi / Kartu Keluarga ]</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Seluruh tabel data dan format penandatanganan oleh Kepala Desa (<strong>{formData.namaKepalaDesa || "H. SUPARNO, S.Sos"}</strong>) akan menyesuaikan kop ini secara otomatis saat dicetak.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <span>💡 Catatan Penting Cetak Kertas A4:</span>
            </p>
            <p className="text-amber-800 leading-relaxed">
              Sistem telah dilengkapi dengan instruksi cetak otomatis untuk ukuran kertas <strong>A4 Portrait (Margin 15mm)</strong>. Saat menekan tombol <strong>Cetak / Simpan PDF</strong> pada menu Rekap RT atau KK, pastikan memilih opsi <strong>"Save as PDF"</strong> atau printer A4 untuk hasil cetakan presisi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
