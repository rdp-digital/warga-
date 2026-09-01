import { SuratTemplateConfig, JenisSuratId, VillageProfile, SuratRecord } from "../types";
import { formatUniversalDateDisplay } from "./dateUtils";

export const ROMAN_MONTHS = [
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"
];

export function getRomanMonth(date: Date = new Date()): string {
  return ROMAN_MONTHS[date.getMonth()] || "I";
}

/**
 * Generate standard Indonesian village letter number:
 * Format: {NomorUrut}/{KodeKlasifikasi}/{KodeWilayahDesa}/{BulanRomawi}/{Tahun}
 * Example: 001/400.4/35.20.01.2001/VII/2026
 */
export function generateNomorSurat(
  kodeKlasifikasi: string,
  noUrut: number,
  profile?: VillageProfile,
  date: Date = new Date()
): string {
  const padNo = String(noUrut).padStart(3, "0");
  const kodeWilayah = profile?.kodeDesa || "35.20.01.2001";
  const romanMonth = getRomanMonth(date);
  const year = date.getFullYear();

  return `${padNo}/${kodeKlasifikasi}/${kodeWilayah}/${romanMonth}/${year}`;
}

export const SURAT_TEMPLATES: SuratTemplateConfig[] = [
  {
    id: "sku",
    namaSurat: "Surat Keterangan Usaha (SKU)",
    judulResmi: "SURAT KETERANGAN USAHA",
    kategori: "Usaha & Ekonomi",
    kodeKlasifikasi: "510",
    deskripsi: "Untuk permohonan kredit/KUR bank, izin usaha mikro, verifikasi legalitas usaha warga.",
    iconName: "Briefcase",
    keperluanDefault: "Persyaratan pengajuan permodalan Kredit Usaha Rakyat (KUR) di Bank",
    fields: [
      {
        key: "namaUsaha",
        label: "Nama Usaha / Toko / Bengkel",
        type: "text",
        placeholder: "Contoh: Warung Berkah / Toko Kelontong Barokah",
        required: true,
        defaultValue: ""
      },
      {
        key: "jenisUsaha",
        label: "Bidang / Jenis Usaha",
        type: "text",
        placeholder: "Contoh: Perdagangan Sembako / Pertanian / Peternakan",
        required: true,
        defaultValue: "Perdagangan Sembako & Kebutuhan Pokok"
      },
      {
        key: "alamatUsaha",
        label: "Lokasi / Alamat Tempat Usaha",
        type: "text",
        placeholder: "Contoh: RT 02 / RW 01 Desa Poncol",
        required: true,
        defaultValue: ""
      },
      {
        key: "tahunMulai",
        label: "Berjalan Sejak Tahun",
        type: "text",
        placeholder: "Contoh: 2021 (atau sudah berjalan 5 tahun)",
        required: true,
        defaultValue: "2022"
      }
    ]
  },
  {
    id: "sktm",
    namaSurat: "Surat Keterangan Tidak Mampu (SKTM)",
    judulResmi: "SURAT KETERANGAN TIDAK MAMPU",
    kategori: "Bantuan & Sosial",
    kodeKlasifikasi: "401",
    deskripsi: "Untuk beasiswa (KIP/KJS/PIP), keringanan biaya pendidikan/sekolah, atau keringanan BPJS/RS.",
    iconName: "HeartHandshake",
    keperluanDefault: "Persyaratan pengajuan beasiswa / bantuan biaya pendidikan anak sekolah",
    fields: [
      {
        key: "namaAnak",
        label: "Nama Anak / Anggota yang Ditanggung (Opsional)",
        type: "text",
        placeholder: "Kosongkan jika SKTM untuk orang yang bersangkutan sendiri",
        defaultValue: ""
      },
      {
        key: "sekolahTujuan",
        label: "Instansi / Sekolah / Universitas Tujuan",
        type: "text",
        placeholder: "Contoh: SMPN 1 / SMAN 1 / Universitas Brawijaya / RSUD",
        defaultValue: ""
      },
      {
        key: "kategoriSKTM",
        label: "Jenis SKTM",
        type: "select",
        options: ["Pendidikan / Beasiswa Sekolah", "Keringanan Biaya Rumah Sakit / Medis", "Bantuan Sosial / Program Pemerintah", "Keperluan Umum"],
        defaultValue: "Pendidikan / Beasiswa Sekolah"
      }
    ]
  },
  {
    id: "domisili",
    namaSurat: "Surat Keterangan Domisili",
    judulResmi: "SURAT KETERANGAN DOMISILI",
    kategori: "Administrasi Umum",
    kodeKlasifikasi: "470",
    deskripsi: "Keterangan resmi warga benar-benar bertempat tinggal dan menetap di wilayah desa/RT setempat.",
    iconName: "Home",
    keperluanDefault: "Persyaratan administrasi kependudukan dan kelengkapan dokumen instansi",
    fields: [
      {
        key: "alamatDomisili",
        label: "Alamat Tempat Tinggal Saat Ini",
        type: "text",
        placeholder: "Contoh: RT 03 Desa Poncol, Kec. Poncol, Kab. Magetan",
        defaultValue: ""
      },
      {
        key: "lamaTinggal",
        label: "Lama Bertempat Tinggal",
        type: "text",
        placeholder: "Contoh: Sejak Lahir / Sejak Tahun 2018",
        defaultValue: "Sejak Lahir"
      },
      {
        key: "statusTempatTinggal",
        label: "Status Tempat Tinggal",
        type: "select",
        options: ["Rumah Sendiri / Milik Sendiri", "Menumpang Orang Tua / Keluarga", "Sewa / Kontrak", "Rumah Dinas"],
        defaultValue: "Rumah Sendiri / Milik Sendiri"
      }
    ]
  },
  {
    id: "skck",
    namaSurat: "Surat Pengantar SKCK",
    judulResmi: "SURAT PENGANTAR CATATAN KEPOLISIAN",
    kategori: "Kepolisian & Lembaga",
    kodeKlasifikasi: "300",
    deskripsi: "Surat pengantar dari desa ke Polsek / Polres guna penerbitan SKCK pemohon.",
    iconName: "ShieldAlert",
    keperluanDefault: "Persyaratan melamar pekerjaan / pendaftaran instansi / seleksi ASN",
    fields: [
      {
        key: "tujuanPolsek",
        label: "Tujuan Pengantar Ke",
        type: "text",
        defaultValue: "Kepolisian Sektor (POLSEK) Setempat"
      },
      {
        key: "catatanKelakuan",
        label: "Keterangan Kelakuan Warga di Lingkungan",
        type: "select",
        options: [
          "Berkelakuan baik, tidak pernah tersangkut perkara kriminal/pidana dan taat hukum",
          "Berkelakuan baik dan aktif dalam kegiatan kemasyarakatan",
          "Tidak pernah terlibat dalam organisasi terlarang dan tindak pidana kejahatan"
        ],
        defaultValue: "Berkelakuan baik, tidak pernah tersangkut perkara kriminal/pidana dan taat hukum"
      }
    ]
  },
  {
    id: "belum_menikah",
    namaSurat: "Surat Keterangan Belum Menikah",
    judulResmi: "SURAT KETERANGAN BELUM MENIKAH / BELUM KAWIN",
    kategori: "Keluarga & Catatan Sipil",
    kodeKlasifikasi: "474.2",
    deskripsi: "Keterangan resmi bahwa warga berstatus jejaka/perawan dan belum pernah melangsungkan pernikahan.",
    iconName: "UserCheck",
    keperluanDefault: "Persyaratan pendaftaran pekerjaan / pengajuan Kredit Perumahan (KPR) / Nikah",
    fields: [
      {
        key: "statusKeterangan",
        label: "Status Pernikahan Saat Ini",
        type: "select",
        options: [
          "Belum Pernah Menikah / Kawin (Jejaka / Perawan)",
          "Duda (Cerai Mati / Cerai Hidup)",
          "Janda (Cerai Mati / Cerai Hidup)"
        ],
        defaultValue: "Belum Pernah Menikah / Kawin (Jejaka / Perawan)"
      }
    ]
  },
  {
    id: "penghasilan",
    namaSurat: "Surat Keterangan Penghasilan",
    judulResmi: "SURAT KETERANGAN PENGHASILAN ORANG TUA / WALI",
    kategori: "Bantuan & Sosial",
    kodeKlasifikasi: "400",
    deskripsi: "Keterangan nominal rerata penghasilan per bulan bagi warga non-slip gaji untuk pendaftaran kuliah/KPR.",
    iconName: "Coins",
    keperluanDefault: "Persyaratan verifikasi Uang Kuliah Tunggal (UKT) / pendaftaran mahasiswa baru",
    fields: [
      {
        key: "rataPenghasilan",
        label: "Rata-rata Penghasilan per Bulan (Rp)",
        type: "text",
        placeholder: "Contoh: Rp 1.500.000,- (Satu Juta Lima Ratus Ribu Rupiah)",
        required: true,
        defaultValue: "Rp 1.500.000,-"
      },
      {
        key: "sumberPenghasilan",
        label: "Sumber Penghasilan / Pekerjaan",
        type: "text",
        placeholder: "Contoh: Hasil Bertani / Buruh Lepas / Pedagang",
        defaultValue: "Hasil Bertani & Buruh Harian"
      },
      {
        key: "jumlahTanggungan",
        label: "Jumlah Tanggungan Keluarga",
        type: "text",
        placeholder: "Contoh: 3 (Tiga) orang anak",
        defaultValue: "2 (Dua) Orang"
      }
    ]
  },
  {
    id: "beda_nama",
    namaSurat: "Surat Keterangan Beda Nama",
    judulResmi: "SURAT KETERANGAN BEDA IDENTITAS / NAMA",
    kategori: "Administrasi Umum",
    kodeKlasifikasi: "470",
    deskripsi: "Klarifikasi resmi bahwa nama yang tertera di KTP/KK dan Ijazah/Sertifikat/Paspor adalah satu orang yang sama.",
    iconName: "FileCheck",
    keperluanDefault: "Penyesuaian dan sinkronisasi berkas dokumen di instansi terkait",
    fields: [
      {
        key: "dokumenA",
        label: "Identitas di Dokumen 1 (Misal: KTP / KK)",
        type: "text",
        placeholder: "Contoh: Sdr. MUHAMMAD WARDI (tertulis di KTP)",
        required: true,
        defaultValue: ""
      },
      {
        key: "dokumenB",
        label: "Identitas di Dokumen 2 (Misal: Ijazah / Sertifikat / Buku Nikah)",
        type: "text",
        placeholder: "Contoh: Sdr. M. WARDI (tertulis di Ijazah)",
        required: true,
        defaultValue: ""
      },
      {
        key: "keteranganBeda",
        label: "Pernyataan Kesamaan Orang",
        type: "textarea",
        defaultValue: "Bahwa nama yang tercantum pada Dokumen 1 dan Dokumen 2 di atas adalah BENAR-BENAR SATU ORANG YANG SAMA."
      }
    ]
  },
  {
    id: "kematian",
    namaSurat: "Surat Keterangan Kematian",
    judulResmi: "SURAT KETERANGAN KEMATIAN",
    kategori: "Keluarga & Catatan Sipil",
    kodeKlasifikasi: "474.3",
    deskripsi: "Keterangan resmi warga telah meninggal dunia untuk pengurusan Akta Kematian, waris, atau asuransi.",
    iconName: "FileX",
    keperluanDefault: "Persyaratan penerbitan Akta Kematian di Disdukcapil dan klaim asuransi / taspen",
    fields: [
      {
        key: "hariMeninggal",
        label: "Hari Meninggal Dunia",
        type: "text",
        placeholder: "Contoh: Senin Kliwon",
        defaultValue: "Senin"
      },
      {
        key: "tanggalMeninggal",
        label: "Tanggal Meninggal Dunia",
        type: "text",
        placeholder: "Contoh: 15 Agustus 2026",
        defaultValue: ""
      },
      {
        key: "jamMeninggal",
        label: "Pukul / Jam Meninggal",
        type: "text",
        placeholder: "Contoh: 04.30 WIB",
        defaultValue: "08.00 WIB"
      },
      {
        key: "tempatMeninggal",
        label: "Tempat Meninggal Dunia",
        type: "text",
        placeholder: "Contoh: Di Rumah Duka / RSUD Magetan",
        defaultValue: "Di Rumah Kediaman"
      },
      {
        key: "sebabMeninggal",
        label: "Penyebab Meninggal",
        type: "text",
        placeholder: "Contoh: Sakit Usia Lanjut / Sakit Jantung",
        defaultValue: "Sakit Usia Lanjut"
      }
    ]
  },
  {
    id: "kelahiran",
    namaSurat: "Surat Keterangan Kelahiran",
    judulResmi: "SURAT KETERANGAN KELAHIRAN",
    kategori: "Keluarga & Catatan Sipil",
    kodeKlasifikasi: "474.1",
    deskripsi: "Keterangan kelahiran bayi untuk pembuatan Akta Kelahiran dan penambahan anggota KK.",
    iconName: "Baby",
    keperluanDefault: "Persyaratan pengurusan Akta Kelahiran baru di Disdukcapil dan pendaftaran BPJS",
    fields: [
      {
        key: "namaBayi",
        label: "Nama Lengkap Anak / Bayi",
        type: "text",
        placeholder: "Nama anak yang baru lahir",
        required: true,
        defaultValue: ""
      },
      {
        key: "jenisKelaminBayi",
        label: "Jenis Kelamin Anak",
        type: "select",
        options: ["LAKI-LAKI", "PEREMPUAN"],
        defaultValue: "LAKI-LAKI"
      },
      {
        key: "hariLahir",
        label: "Hari Lahir",
        type: "text",
        placeholder: "Contoh: Rabu Pahing",
        defaultValue: "Rabu"
      },
      {
        key: "tanggalLahirBayi",
        label: "Tanggal Lahir Anak",
        type: "text",
        placeholder: "Contoh: 20 Agustus 2026",
        defaultValue: ""
      },
      {
        key: "tempatLahirBayi",
        label: "Tempat Lahir Anak",
        type: "text",
        placeholder: "Contoh: Poncol / Puskesmas Poncol / RSUD",
        defaultValue: "Magetan"
      },
      {
        key: "anakKe",
        label: "Kelahiran Anak Ke-",
        type: "text",
        placeholder: "Contoh: 1 (Satu) / 2 (Dua)",
        defaultValue: "1 (Satu)"
      }
    ]
  },
  {
    id: "kehilangan",
    namaSurat: "Surat Pengantar Kehilangan",
    judulResmi: "SURAT KETERANGAN PENGANTAR LAPORAN KEHILANGAN",
    kategori: "Kepolisian & Lembaga",
    kodeKlasifikasi: "300",
    deskripsi: "Surat pengantar desa ke Polsek bagi warga yang kehilangan KTP, KK, SIM, Ijazah, atau Buku Tabungan.",
    iconName: "FileQuestion",
    keperluanDefault: "Persyaratan pelaporan surat kehilangan di Kepolisian Sektor (Polsek)",
    fields: [
      {
        key: "barangHilang",
        label: "Barang / Dokumen yang Hilang",
        type: "textarea",
        placeholder: "Contoh: 1 (satu) buah KTP asli a.n Pemohon dan 1 (satu) buah STNK Motor",
        required: true,
        defaultValue: "1 (satu) lembar Kartu Tanda Penduduk (KTP) Asli dan Kartu BPJS Kesehatan"
      },
      {
        key: "perkiraanWaktu",
        label: "Perkiraan Waktu & Lokasi Kehilangan",
        type: "text",
        placeholder: "Contoh: Pada hari Selasa, di sekitar Jalan Raya Poncol",
        defaultValue: "Diperkirakan tercecer di sekitar wilayah Kecamatan Poncol"
      }
    ]
  },
  {
    id: "izin_keramaian",
    namaSurat: "Surat Pengantar Izin Keramaian",
    judulResmi: "SURAT PENGANTAR IZIN KERAMAIAN / HAJATAN",
    kategori: "Kepolisian & Lembaga",
    kodeKlasifikasi: "331",
    deskripsi: "Surat pengantar dari desa ke Muspika/Polsek/Koramil untuk kegiatan hajatan atau acara warga.",
    iconName: "Volume2",
    keperluanDefault: "Persyaratan izin kegiatan keramaian / hajatan di Polsek & Koramil",
    fields: [
      {
        key: "namaAcara",
        label: "Nama Acara / Hajatan",
        type: "text",
        placeholder: "Contoh: Resepsi Pernikahan / Walimatul Ursy / Khitanan",
        required: true,
        defaultValue: "Resepsi Pernikahan (Hajatan Keluarga)"
      },
      {
        key: "hiburan",
        label: "Jenis Hiburan / Kegiatan",
        type: "text",
        placeholder: "Contoh: Musik Hadrah / Akustik / Sound System Sedang",
        defaultValue: "Musik Dangdut Akustik / Sound System"
      },
      {
        key: "tanggalAcara",
        label: "Hari & Tanggal Pelaksanaan",
        type: "text",
        placeholder: "Contoh: Sabtu-Minggu, 12-13 September 2026",
        required: true,
        defaultValue: ""
      },
      {
        key: "tempatAcara",
        label: "Tempat / Lokasi Acara",
        type: "text",
        placeholder: "Contoh: Di Rumah Pemohon RT 02 / RW 01 Desa Poncol",
        defaultValue: "Di Kediaman Pemohon"
      }
    ]
  },
  {
    id: "keterangan_umum",
    namaSurat: "Surat Keterangan Umum / Serbaguna",
    judulResmi: "SURAT KETERANGAN",
    kategori: "Administrasi Umum",
    kodeKlasifikasi: "470",
    deskripsi: "Surat keterangan umum resmi dari Pemerintah Desa untuk berbagai keperluan khusus warga.",
    iconName: "FileText",
    keperluanDefault: "Memenuhi persyaratan kelengkapan berkas administrasi",
    fields: [
      {
        key: "keteranganIsi",
        label: "Isi Pernyataan / Keterangan Desa",
        type: "textarea",
        placeholder: "Tuliskan keterangan detail yang ingin dinyatakan oleh Pemerintah Desa mengenai warga tersebut...",
        required: true,
        defaultValue: "Bahwa orang tersebut di atas adalah benar-benar warga penduduk Desa Poncol yang berkelakuan baik dan tercatat aktif dalam kehidupan sosial kemasyarakatan."
      }
    ]
  }
];

export function getTemplateById(id: JenisSuratId): SuratTemplateConfig | undefined {
  return SURAT_TEMPLATES.find((t) => t.id === id);
}
