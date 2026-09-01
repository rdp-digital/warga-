export interface Penduduk {
  namaLengkap: string;
  nomorKKInduk: string;
  nik: string;
  jenisKelamin: 'LAKI-LAKI' | 'PEREMPUAN' | string;
  tempatLahir: string;
  tanggalLahir: string;
  agama: string;
  pendidikan: string;
  jenisPekerjaan: string;
  golSmt: string;
  statusKawin: string;
  hubunganKeluarga: string;
  kewarganegaraan: string;
  namaAyah: string;
  namaIbu: string;
  alamat: string;
  rt: string;
}

export interface LogAudit {
  id?: string;
  waktu: string;
  aksi: 'TAMBAH' | 'UBAH' | 'HAPUS' | 'PINDAH_KK' | string;
  nikTerkait: string;
  detailPerubahan: string;
}

export interface KartuKeluarga {
  nomorKK: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  jumlahAnggota: number;
  anggota: Penduduk[];
}

export interface FilterOptions {
  searchQuery: string;
  jenisKelamin: string;
  pendidikan: string;
  rt: string;
  statusKawin: string;
  agama: string;
  jenisPekerjaan: string;
}

export interface AgeGroupStat {
  range: string;
  count: number;
  percentage: number;
}

export interface StatsData {
  totalPenduduk: number;
  totalKK: number;
  jenisKelamin: { name: string; value: number }[];
  distribusiUsia: { range: string; count: number }[];
  distribusiKelompokUsia?: AgeGroupStat[];
  jumlahPerRT: { rt: string; count: number }[];
  pendidikan: { name: string; count: number }[];
  statusKawin: { name: string; count: number }[];
  agama: { name: string; count: number }[];
}

export interface ConfigStatus {
  hasAppsScriptUrl: boolean;
  appsScriptUrl: string;
  apiSecret?: string;
  spreadsheetId: string;
  usingDemoMode: boolean;
}

export interface VillageProfile {
  namaDesa: string;
  namaKecamatan: string;
  namaKabupaten: string;
  alamatKantor: string;
  emailKantor: string;
  websiteDesa: string;
  kodePos: string;
  namaKepalaDesa: string;
  jabatanKepalaDesa?: string;
  nipKepalaDesa?: string;
  namaSekdes?: string;
  nipSekdes?: string;
  kodeDesa?: string;
  logoUrl?: string;
}

export type JenisSuratId =
  | "sku"
  | "sktm"
  | "domisili"
  | "skck"
  | "belum_menikah"
  | "kematian"
  | "kelahiran"
  | "beda_nama"
  | "penghasilan"
  | "kehilangan"
  | "izin_keramaian"
  | "keterangan_umum";

export interface SuratFieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number;
  required?: boolean;
  helpText?: string;
}

export interface SuratTemplateConfig {
  id: JenisSuratId;
  namaSurat: string;
  judulResmi: string;
  kategori: "Administrasi Umum" | "Usaha & Ekonomi" | "Bantuan & Sosial" | "Kepolisian & Lembaga" | "Keluarga & Catatan Sipil";
  kodeKlasifikasi: string;
  deskripsi: string;
  iconName: string;
  fields: SuratFieldDef[];
  keperluanDefault: string;
}

export interface SuratRecord {
  id: string;
  nomorSurat: string;
  jenisSuratId: JenisSuratId;
  namaSurat: string;
  kodeKlasifikasi: string;
  nik: string;
  namaLengkap: string;
  nomorKK: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  agama: string;
  pendidikan: string;
  jenisPekerjaan: string;
  statusKawin: string;
  alamat: string;
  rt: string;
  keperluan: string;
  keteranganTambahan?: string;
  customData: Record<string, any>;
  tanggalSurat: string;
  penandatanganJabatan: string;
  penandatanganNama: string;
  penandatanganNip?: string;
  status: "DICETAK" | "DRAF" | "DIARSIPKAN";
  createdAt: string;
  updatedAt?: string;
}

