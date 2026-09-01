import React, { useState, useEffect } from "react";
import { X, Save, AlertCircle, User, CreditCard, Home, Briefcase, Calendar } from "lucide-react";
import { Penduduk } from "../types";
import {
  JENIS_KELAMIN_OPTIONS,
  AGAMA_OPTIONS,
  STATUS_KAWIN_OPTIONS,
  HUBUNGAN_KELUARGA_OPTIONS,
  KEWARGANEGARAAN_OPTIONS,
  GOL_DARAH_OPTIONS,
  PENDIDIKAN_OPTIONS,
  RT_OPTIONS,
  normalizeAgama,
  normalizeStatusKawin
} from "../lib/constants";
import { formatToHtmlInputDate, formatToIndoDate, calculateAgeAccurate } from "../lib/dateUtils";

interface PendudukFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Penduduk>) => Promise<boolean>;
  initialData?: Penduduk | null;
  presetNomorKK?: string;
  presetAlamat?: string;
  presetRt?: string;
}

export const PendudukFormModal: React.FC<PendudukFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  presetNomorKK,
  presetAlamat,
  presetRt
}) => {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState<Partial<Penduduk>>({
    namaLengkap: "",
    nomorKKInduk: "",
    nik: "",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "",
    tanggalLahir: "",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "BELUM/TIDAK BEKERJA",
    golSmt: "TIDAK TAHU",
    statusKawin: "BELUM KAWIN",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "",
    namaIbu: "",
    alamat: "",
    rt: RT_OPTIONS[0]
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tanggalLahir: formatToHtmlInputDate(initialData.tanggalLahir),
        agama: normalizeAgama(initialData.agama),
        statusKawin: normalizeStatusKawin(initialData.statusKawin)
      });
    } else {
      setFormData({
        namaLengkap: "",
        nomorKKInduk: presetNomorKK || "",
        nik: "",
        jenisKelamin: "LAKI-LAKI",
        tempatLahir: "",
        tanggalLahir: "",
        agama: "ISLAM",
        pendidikan: "SLTA / SEDERAJAT",
        jenisPekerjaan: "BELUM/TIDAK BEKERJA",
        golSmt: "TIDAK TAHU",
        statusKawin: "BELUM KAWIN",
        hubunganKeluarga: presetNomorKK ? "ANAK" : "KEPALA KELUARGA",
        kewarganegaraan: "WNI",
        namaAyah: "",
        namaIbu: "",
        alamat: presetAlamat || "",
        rt: presetRt || RT_OPTIONS[0]
      });
    }
    setErrorMsg(null);
  }, [initialData, isOpen, presetNomorKK, presetAlamat, presetRt]);

  if (!isOpen) return null;

  const handleChange = (key: keyof Penduduk, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrorMsg(null);
  };

  const currentCalculatedAge = formData.tanggalLahir ? calculateAgeAccurate(formData.tanggalLahir) : 0;
  const currentIndoFormattedDate = formData.tanggalLahir ? formatToIndoDate(formData.tanggalLahir, "/") : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Form Validations
    if (!formData.namaLengkap || formData.namaLengkap.trim() === "") {
      setErrorMsg("Nama Lengkap wajib diisi");
      return;
    }

    const cleanNik = (formData.nik || "").trim();
    if (!/^\d{16}$/.test(cleanNik)) {
      setErrorMsg("NIK harus persis 16 digit angka (sekarang " + cleanNik.length + " digit)");
      return;
    }

    const cleanKK = (formData.nomorKKInduk || "").trim();
    if (!/^\d{16}$/.test(cleanKK)) {
      setErrorMsg("Nomor KK Induk harus persis 16 digit angka (sekarang " + cleanKK.length + " digit)");
      return;
    }

    if (!formData.tanggalLahir) {
      setErrorMsg("Tanggal Lahir wajib diisi");
      return;
    }

    // Always standardize to Indonesian format DD/MM/YYYY for spreadsheet storage
    const standardizedIndoDate = formatToIndoDate(formData.tanggalLahir, "/");

    setSubmitting(true);
    const success = await onSave({
      ...formData,
      nik: cleanNik,
      nomorKKInduk: cleanKK,
      tanggalLahir: standardizedIndoDate
    });
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-6 border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isEdit ? "Ubah Data Penduduk" : "Tambah Penduduk Baru"}
              </h2>
              <p className="text-xs text-slate-400">Formulir Pendaftaran & Pemutakhiran Data 17 Kolom Standar SIAK</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identitas Utama (NIK & Nama) */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              1. Identitas Utama & Kartu Keluarga
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  disabled={isEdit}
                  placeholder="16 digit angka NIK"
                  value={formData.nik || ""}
                  onChange={(e) => handleChange("nik", e.target.value.replace(/\D/g, ""))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100 disabled:text-slate-500"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {(formData.nik || "").length}/16 Digit
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor KK Induk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="16 digit angka Nomor KK"
                  value={formData.nomorKKInduk || ""}
                  onChange={(e) => handleChange("nomorKKInduk", e.target.value.replace(/\D/g, ""))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {(formData.nomorKKInduk || "").length}/16 Digit
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai Akta/KTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Ir. Budi Santoso"
                  value={formData.namaLengkap || ""}
                  onChange={(e) => handleChange("namaLengkap", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Bio Data Kependudukan */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              2. Data Kelahiran & Status Sosial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Jenis Kelamin <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.jenisKelamin || "LAKI-LAKI"}
                  onChange={(e) => handleChange("jenisKelamin", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {JENIS_KELAMIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  placeholder="Kota/Kabupaten"
                  value={formData.tempatLahir || ""}
                  onChange={(e) => handleChange("tempatLahir", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">
                    Tanggal Lahir <span className="text-rose-500">*</span>
                  </label>
                  {currentCalculatedAge > 0 && (
                    <span className="text-[10px] font-extrabold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      Umur: {currentCalculatedAge} Tahun
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={formData.tanggalLahir || ""}
                  onChange={(e) => handleChange("tanggalLahir", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
                {currentIndoFormattedDate && (
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Format Indonesia: <strong className="text-slate-800">{currentIndoFormattedDate}</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Agama</label>
                <select
                  value={formData.agama || "ISLAM"}
                  onChange={(e) => handleChange("agama", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {AGAMA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Perkawinan</label>
                <select
                  value={formData.statusKawin || "BELUM KAWIN"}
                  onChange={(e) => handleChange("statusKawin", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {STATUS_KAWIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hubungan Dalam Keluarga</label>
                <select
                  value={formData.hubunganKeluarga || "ANGGOTA"}
                  onChange={(e) => handleChange("hubunganKeluarga", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {HUBUNGAN_KELUARGA_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Golongan Darah (Gol Smt)</label>
                <select
                  value={formData.golSmt || "TIDAK TAHU"}
                  onChange={(e) => handleChange("golSmt", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {GOL_DARAH_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kewarganegaraan</label>
                <select
                  value={formData.kewarganegaraan || "WNI"}
                  onChange={(e) => handleChange("kewarganegaraan", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {KEWARGANEGARAAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Pendidikan & Pekerjaan */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-amber-600" />
              3. Pendidikan, Pekerjaan & Orang Tua
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pendidikan Terakhir</label>
                <select
                  value={formData.pendidikan || "SLTA / SEDERAJAT"}
                  onChange={(e) => handleChange("pendidikan", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {PENDIDIKAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Jenis Pekerjaan</label>
                <input
                  type="text"
                  placeholder="Contoh: PNS, WIRASWASTA, KARYAWAN SWASTA"
                  value={formData.jenisPekerjaan || ""}
                  onChange={(e) => handleChange("jenisPekerjaan", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Ayah Kandung</label>
                <input
                  type="text"
                  placeholder="Nama Ayah"
                  value={formData.namaAyah || ""}
                  onChange={(e) => handleChange("namaAyah", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Ibu Kandung</label>
                <input
                  type="text"
                  placeholder="Nama Ibu"
                  value={formData.namaIbu || ""}
                  onChange={(e) => handleChange("namaIbu", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Domisili / Alamat */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <Home className="w-4 h-4 text-purple-600" />
              4. Domisili Tempat Tinggal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap (Jalan, No, Dusun)</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Mawar No. 12"
                  value={formData.alamat || ""}
                  onChange={(e) => handleChange("alamat", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Wilayah RT</label>
                <select
                  value={formData.rt || RT_OPTIONS[0]}
                  onChange={(e) => handleChange("rt", e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {RT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Daftarkan Penduduk"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
