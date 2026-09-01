import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { SuratRecord, VillageProfile } from "../types";
import { KopSurat } from "./KopSurat";
import { formatUniversalDateDisplay } from "../lib/dateUtils";
import { OFFICIAL_MAGETAN_LOGO } from "../lib/profile";
import {
  toIndoTitleCase,
  cleanDesaName,
  cleanKecamatanName,
  cleanKabupatenName,
  getKalimatPembukaSurat,
  formatAgamaResmi,
  formatStatusPerkawinanResmi,
  formatPekerjaanResmi,
  formatAlamatDomisiliResmi
} from "../lib/formatIndoText";

interface SuratPrintLayoutProps {
  surat: SuratRecord;
  profile: VillageProfile;
  id?: string;
  showBorder?: boolean;
}

export const SuratPrintLayout: React.FC<SuratPrintLayoutProps> = ({
  surat,
  profile,
  id = "printable-surat-sheet",
  showBorder = true
}) => {
  const tglLahirFormatted = surat.tanggalLahir
    ? formatUniversalDateDisplay(surat.tanggalLahir)
    : "-";

  const tglSuratFormatted = surat.tanggalSurat
    ? formatUniversalDateDisplay(surat.tanggalSurat)
    : formatUniversalDateDisplay(new Date().toISOString());

  const desaClean = cleanDesaName(profile.namaDesa);
  const kecClean = cleanKecamatanName(profile.namaKecamatan);
  const kabClean = cleanKabupatenName(profile.namaKabupaten);

  const namaKades = (surat.penandatanganNama || profile.namaKepalaDesa || "SAMSUHARI").toUpperCase();
  const nipKades = surat.penandatanganNip || profile.nipKepalaDesa || "-";

  // Kalimat Pembuka Resmi EYD Tata Naskah Dinas
  const kalimatPembuka = getKalimatPembukaSurat(
    surat.penandatanganJabatan || profile.jabatanKepalaDesa || `Kepala Desa ${desaClean}`,
    desaClean,
    kecClean,
    kabClean
  );

  // Nilai-nilai identitas standar
  const namaFormatted = (surat.namaLengkap || "PARTI").toUpperCase();
  const nikFormatted = surat.nik || "-";
  const ttlFormatted = `${surat.tempatLahir ? `${toIndoTitleCase(surat.tempatLahir)}, ` : ""}${tglLahirFormatted}`;
  const jkFormatted = toIndoTitleCase(surat.jenisKelamin || "Perempuan");
  const agamaFormatted = formatAgamaResmi(surat.agama);
  const statusKawinFormatted = formatStatusPerkawinanResmi(surat.statusKawin);
  const pekerjaanFormatted = formatPekerjaanResmi(surat.jenisPekerjaan);
  const alamatDomisiliFormatted = formatAlamatDomisiliResmi(
    surat.alamat,
    surat.rt,
    desaClean,
    kecClean,
    kabClean
  );

  let logoSrc = profile.logoUrl || OFFICIAL_MAGETAN_LOGO;
  if (logoSrc.includes("Screenshot_2026-08-10_074401")) {
    logoSrc = OFFICIAL_MAGETAN_LOGO;
  }

  // Kode Validasi Keabsahan dan Keaslian Dokumen
  const docValidationCode = surat.id
    ? `VAL-${surat.id.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase()}`
    : `VAL-${surat.nik ? surat.nik.slice(-6) : "PCL2026"}`;

  const qrValidationValue = `https://poncol.magetan.go.id/validasi-surat?nomor=${encodeURIComponent(
    surat.nomorSurat || "001/400.4/35.20.01.2001/VII/2026"
  )}&nik=${encodeURIComponent(surat.nik || "")}&id=${encodeURIComponent(
    docValidationCode
  )}&desa=${encodeURIComponent(desaClean)}&status=VALID_ASLI`;

  // Substantive Content depending on surat type
  const renderSubstantiveContent = () => {
    const custom = surat.customData || {};

    switch (surat.jenisSuratId) {
      case "sktm":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas benar-benar keluarga kurang mampu/ekonomi lemah yang terdaftar di Desa {desaClean}.
            </p>
            <p>
              Surat Keterangan Tidak Mampu (SKTM) ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Keringanan Biaya Rumah Sakit / Pengobatan"}</strong>.
            </p>
            {custom.tanggunganKeluarga && (
              <p>
                Tanggungan Keluarga terkait: {custom.tanggunganKeluarga}.
              </p>
            )}
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "sku":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas benar-benar memiliki dan menjalankan kegiatan usaha di wilayah Desa {desaClean} dengan rincian sebagai berikut:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Nama Usaha</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-black uppercase">{custom.namaUsaha || "WARUNG SEMBAKO BERKAH"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Bidang / Jenis Usaha</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-normal text-black">{custom.jenisUsaha || "Perdagangan Sembako"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">3. Lokasi Usaha</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.alamatUsaha || alamatDomisiliFormatted}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">4. Berjalan Sejak</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">Tahun {custom.tahunMulai || "2022"}</span>
              </div>
            </div>
            <p>
              Surat Keterangan Usaha (SKU) ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Pengajuan Kredit Usaha Rakyat (KUR) di Bank"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "domisili":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas benar-benar berdomisili dan bertempat tinggal pada alamat tersebut di atas{custom.lamaTinggal ? ` sejak ${custom.lamaTinggal}` : ""}{custom.statusTempatTinggal ? ` dengan status ${custom.statusTempatTinggal}` : ""}.
            </p>
            <p>
              Surat Keterangan Domisili ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Administrasi Kependudukan dan Instansi"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "skck":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas adalah benar-benar warga penduduk Desa {desaClean} yang berkelakuan baik, tidak pernah tersangkut perkara kriminal atau pidana, serta taat pada hukum dan norma kemasyarakatan yang berlaku.
            </p>
            <p>
              Surat Pengantar SKCK ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Melamar Pekerjaan / Seleksi ASN"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "belum_menikah":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas sepanjang catatan dan pengetahuan kami hingga saat dikeluarkannya surat ini berstatus: <strong className="font-bold uppercase">{custom.statusKeterangan || "BELUM PERNAH MENIKAH / BELUM KAWIN (JEJAKA / PERAWAN)"}</strong>.
            </p>
            <p>
              Surat Keterangan Belum Menikah ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Pendaftaran Pekerjaan / Pengajuan KPR"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "penghasilan":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas bermata pencaharian sebagai <strong>{custom.sumberPenghasilan || "Petani / Wiraswasta"}</strong> dengan rincian rerata penghasilan sebesar <strong>{custom.rataPenghasilan || "Rp 1.500.000,-"}</strong> per bulan dan menanggung keluarga sebanyak <strong>{custom.jumlahTanggungan || "2 (Dua) Orang"}</strong>.
            </p>
            <p>
              Surat Keterangan Penghasilan ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Pendaftaran Kuliah / Bantuan Sekolah"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "beda_nama":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa terdapat perbedaan penulisan identitas / nama pemohon pada dokumen:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Dokumen I</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-black">{custom.dokumenA || "Nama Sesuai KTP"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Dokumen II</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-black">{custom.dokumenB || "Nama Sesuai Dokumen Lain"}</span>
              </div>
            </div>
            <p>
              {custom.keteranganBeda || "Bahwa nama yang tercantum pada Dokumen I dan Dokumen II di atas adalah benar-benar satu orang yang sama."}
            </p>
            <p>
              Surat Keterangan Beda Nama ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Penyesuaian Data Dokumen"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "kematian":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa yang bersangkutan di atas telah meninggal dunia pada:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Hari / Tanggal</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-semibold text-black">
                  {custom.hariMeninggal || "Senin"}, {custom.tanggalMeninggal ? formatUniversalDateDisplay(custom.tanggalMeninggal) : "-"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Tempat Meninggal</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.tempatMeninggal || "Rumah Kediaman"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">3. Penyebab</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.sebabMeninggal || "Sakit Biasa"}</span>
              </div>
            </div>
            <p>
              Surat Keterangan Kematian ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Pengurusan Akta Kematian di Disdukcapil"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "kelahiran":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa telah lahir seorang anak dengan rincian sebagai berikut:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Nama Lengkap Anak</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold uppercase text-black">{custom.namaAnak || "-"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Jenis Kelamin</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{toIndoTitleCase(custom.jenisKelaminAnak || "LAKI-LAKI")}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">3. Tempat, Tanggal Lahir</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">
                  {custom.tempatLahirAnak || "Magetan"}, {custom.tanggalLahirAnak ? formatUniversalDateDisplay(custom.tanggalLahirAnak) : "-"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">4. Orang Tua (Ayah/Ibu)</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">
                  {custom.namaAyah || surat.namaLengkap || "-"} / {custom.namaIbu || "-"}
                </span>
              </div>
            </div>
            <p>
              Surat Keterangan Kelahiran ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Pengurusan Akta Kelahiran di Disdukcapil"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "kehilangan":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} menerangkan bahwa orang tersebut di atas telah melaporkan kehilangan dokumen / barang berupa:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Barang / Dokumen</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-black">{custom.barangHilang || "1 (Satu) Buah KTP Elektronik"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Perkiraan Tempat</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.perkiraanLokasi || `Di wilayah Kecamatan ${kecClean}`}</span>
              </div>
            </div>
            <p>
              Surat Pengantar Kehilangan ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Permohonan Surat Keterangan Tanda Lapor Kehilangan (SKTLK) di Polsek"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      case "izin_keramaian":
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              Kepala Desa {desaClean} memberikan rekomendasi pengantar izin keramaian / kegiatan warga dengan rincian sebagai berikut:
            </p>
            <div className="pl-6 space-y-1 text-[13px] sm:text-[14px]">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">1. Bentuk Kegiatan</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 font-bold text-black">{custom.namaAcara || "Resepsi Pernikahan / Hajatan"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">2. Jenis Hiburan</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.hiburan || "Hiburan Musik / Sound System"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">3. Waktu Pelaksanaan</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.tanggalAcara || "Minggu, Sesuai Jadwal Pemohon"}</span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-4 font-semibold text-black">4. Lokasi Acara</span>
                <span className="col-span-1 text-center">:</span>
                <span className="col-span-7 text-black">{custom.tempatAcara || "Di Kediaman Pemohon"}</span>
              </div>
            </div>
            <p>
              Surat Pengantar Izin Keramaian ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Rekomendasi Izin Keramaian ke Polsek Poncol / Koramil"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );

      default:
        return (
          <div className="space-y-3 mt-3 text-justify leading-relaxed">
            <p>
              {custom.keteranganIsi || `Kepala Desa ${desaClean} menerangkan bahwa yang bersangkutan di atas adalah benar-benar warga penduduk Desa ${desaClean} yang berkelakuan baik dan tidak tersangkut perkara kriminal.`}
            </p>
            <p>
              Surat keterangan ini diberikan untuk digunakan sebagai kelengkapan administrasi: <strong className="font-bold">{surat.keperluan || "Persyaratan Administrasi Umum"}</strong>.
            </p>
            <p>
              Demikian surat keterangan ini kami buat dengan sebenarnya agar dapat dipergunakan seperlunya.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      id={id}
      className={`relative bg-white text-black p-8 sm:p-12 max-w-[210mm] mx-auto text-[13px] sm:text-[14px] leading-normal flex flex-col justify-between ${
        showBorder ? "shadow-2xl border border-slate-300 rounded-sm" : ""
      }`}
      style={{
        minHeight: "297mm",
        color: "#000000",
        boxSizing: "border-box",
        fontFamily: "Arial, Helvetica, sans-serif"
      }}
    >
      {/* KERTAS SURAT BERSIH & RAPI TANPA WATERMARK */}

      <div className="relative z-10 flex flex-col flex-1 justify-between">
        <div>
          {/* 1. KOP SURAT RESMI */}
          <KopSurat profile={profile} />

          {/* 2. JUDUL SURAT & NOMOR */}
          <div className="text-center my-3">
            <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase underline underline-offset-4 decoration-2 text-black">
              {surat.namaSurat || "SURAT KETERANGAN TIDAK MAMPU (SKTM)"}
            </h2>
            <p className="text-xs sm:text-[13px] font-bold mt-1 tracking-wider text-black">
              Nomor: {surat.nomorSurat || "001/400.4/35.20.01.2001/VII/2026"}
            </p>
          </div>

          {/* 3. KALIMAT PEMBUKA */}
          <div className="mt-4 text-justify leading-relaxed">
            <p>{kalimatPembuka}</p>
          </div>

          {/* 4. IDENTITAS PENDUDUK (Numbered 1-8 exact match to example) */}
          <div className="my-3 pl-2 sm:pl-4 space-y-1.5 text-[13px] sm:text-[14px]">
            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                1. Nama Lengkap
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 font-bold uppercase text-black">
                {namaFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                2. NIK (KTP)
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 font-bold text-black tracking-wider">
                {nikFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                3. Tempat, Tanggal Lahir
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 text-black">
                {ttlFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                4. Jenis Kelamin
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 text-black">
                {jkFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                5. Kewarganegaraan / Agama
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 font-bold text-black">
                WNI / {agamaFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                6. Status Perkawinan
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 font-bold text-black">
                {statusKawinFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                7. Pekerjaan
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 font-bold text-black">
                {pekerjaanFormatted}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-1 items-baseline">
              <span className="col-span-4 sm:col-span-4 font-bold text-black">
                8. Alamat Domisili
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <span className="col-span-7 sm:col-span-7 text-black leading-snug">
                {alamatDomisiliFormatted}
              </span>
            </div>
          </div>

          {/* 5. ISI / SUBSTANSI SURAT */}
          {renderSubstantiveContent()}

          {/* 6. TANDA TANGAN KEPALA DESA (Blok Kanan Bawah Sesuai Foto) */}
          <div className="mt-8 pt-2 flex justify-end text-[13px] sm:text-[14px]">
            <div className="text-center w-60 sm:w-68 flex-shrink-0">
              <p className="text-black font-normal">
                {desaClean}, {tglSuratFormatted}
              </p>
              <p className="font-bold text-black uppercase mt-0.5 tracking-wide">
                KEPALA DESA {desaClean.toUpperCase()}
              </p>
              
              {/* Space for signature and official stamp */}
              <div className="h-20 sm:h-24"></div>

              <p className="font-bold underline uppercase text-black tracking-wider text-sm sm:text-base">
                {namaKades}
              </p>
              <p className="text-xs sm:text-[13px] text-black mt-0.5">
                NIP. {nipKades}
              </p>
            </div>
          </div>
        </div>

        {/* 7. FOOTER PALING BAWAH DOKUMEN: KODE QR VALIDASI DI POJOK KIRI BAWAH (UKURAN 50% LEBIH KECIL) */}
        <div className="mt-6 pt-2 flex items-end select-none">
          {/* Pojok Kiri Paling Bawah: QR Code Validasi Keabsahan dan Keaslian Dokumen */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-black rounded-none">
            <div className="bg-white p-0.5 border border-black/80 flex-shrink-0 flex items-center justify-center">
              <QRCodeSVG
                value={qrValidationValue}
                size={32}
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="text-[7px] leading-tight text-black flex flex-col justify-center pr-1">
              <span className="font-bold tracking-tight uppercase text-[6.5px] text-black">
                VALIDASI KEASLIAN DOKUMEN
              </span>
              <span className="text-[5.5px] text-black leading-tight mt-0.5">
                Surat resmi terverifikasi. Pindai QR untuk keabsahan.
              </span>
              <span className="text-[5.5px] font-mono font-bold text-black mt-0.5">
                ID: {docValidationCode}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
