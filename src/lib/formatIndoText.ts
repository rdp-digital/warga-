/**
 * Utility for formatting Indonesian Official Letter (Surat Resmi Desa) text
 * adhering strictly to PUEBI / EYD (Pedoman Umum Ejaan Bahasa Indonesia)
 * and standard Tata Naskah Dinas Pemerintah Desa.
 */

/**
 * Converts a string to Title Case (Kapital di Awal Kata).
 * Example: "LAKI-LAKI" -> "Laki-laki", "PEREMPUAN" -> "Perempuan"
 */
export function toIndoTitleCase(str?: string | null): string {
  if (!str) return "-";
  const trimmed = str.trim();
  if (!trimmed) return "-";

  // Handle special cases
  if (trimmed.toUpperCase() === "WNI") return "WNI";
  if (trimmed.toUpperCase() === "WNA") return "WNA";
  if (trimmed.toUpperCase() === "ISLAM") return "Islam";
  if (trimmed.toUpperCase() === "KRISTEN") return "Kristen";
  if (trimmed.toUpperCase() === "KATOLIK") return "Katolik";
  if (trimmed.toUpperCase() === "HINDU") return "Hindu";
  if (trimmed.toUpperCase() === "BUDDHA") return "Buddha";
  if (trimmed.toUpperCase() === "KHONGHUCU") return "Khonghucu";
  if (trimmed.toUpperCase() === "LAKI-LAKI" || trimmed.toUpperCase() === "L") return "Laki-laki";
  if (trimmed.toUpperCase() === "PEREMPUAN" || trimmed.toUpperCase() === "P") return "Perempuan";

  return trimmed
    .toLowerCase()
    .split(/([\s/-]+)/)
    .map((word) => {
      if (!word.trim() || word === "/" || word === "-") return word;
      const lower = word.toLowerCase();
      if (["dan", "atau", "ke", "di", "dari", "yang", "pada", "untuk"].includes(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join("");
}

/**
 * Format agama to uppercase for official letter style (e.g. ISLAM, KRISTEN, dll)
 */
export function formatAgamaResmi(agama?: string | null): string {
  if (!agama) return "ISLAM";
  const clean = agama.trim().toUpperCase();
  if (clean.includes("ISLAM")) return "ISLAM";
  if (clean.includes("KRISTEN")) return "KRISTEN";
  if (clean.includes("KATOLIK")) return "KATOLIK";
  if (clean.includes("HINDU")) return "HINDU";
  if (clean.includes("BUDDHA")) return "BUDDHA";
  if (clean.includes("KHONGHUCU")) return "KHONGHUCU";
  return clean;
}

/**
 * Format status perkawinan to uppercase (e.g. KAWIN TERCATAT, BELUM KAWIN)
 */
export function formatStatusPerkawinanResmi(status?: string | null): string {
  if (!status) return "KAWIN TERCATAT";
  const clean = status.trim().toUpperCase();
  if (clean.includes("BELUM")) return "BELUM KAWIN";
  if (clean.includes("CERAI MATI")) return "CERAI MATI";
  if (clean.includes("CERAI HIDUP")) return "CERAI HIDUP";
  if (clean.includes("TERCATAT")) return "KAWIN TERCATAT";
  if (clean.includes("KAWIN")) return "KAWIN TERCATAT";
  return clean;
}

/**
 * Format pekerjaan to uppercase official (e.g. PETANI/PEKEBUN, WIRASWASTA)
 */
export function formatPekerjaanResmi(pekerjaan?: string | null): string {
  if (!pekerjaan) return "PETANI/PEKEBUN";
  const clean = pekerjaan.trim().toUpperCase();
  if (clean.includes("PETANI") || clean.includes("PEKEBUN")) return "PETANI/PEKEBUN";
  if (clean.includes("WIRASWASTA")) return "WIRASWASTA";
  if (clean.includes("KARYAWAN SWASTA")) return "KARYAWAN SWASTA";
  if (clean.includes("PNS") || clean.includes("PEGAWAI NEGERI")) return "PNS";
  if (clean.includes("IBU RUMAH TANGGA") || clean.includes("MENGURUS RUMAH")) return "MENGURUS RUMAH TANGGA";
  if (clean.includes("PELAJAR") || clean.includes("MAHASISWA")) return "PELAJAR/MAHASISWA";
  if (clean.includes("BELUM") || clean.includes("TIDAK BEKERJA")) return "BELUM/TIDAK BEKERJA";
  return clean.replace(/\s*\/\s*/g, "/");
}

/**
 * Strips duplicate prefixes from Kabupaten name and formats nicely.
 * e.g. "PEMERINTAH KABUPATEN MAGETAN" -> "Magetan"
 */
export function cleanKabupatenName(kabupaten?: string | null): string {
  if (!kabupaten) return "Magetan";
  return kabupaten
    .replace(/^(PEMERINTAH\s+)?(KABUPATEN|KAB\.?|KOTA)\s+/i, "")
    .trim() || "Magetan";
}

/**
 * Strips duplicate prefixes from Kecamatan name and formats nicely.
 * e.g. "KECAMATAN PONCOL" -> "Poncol"
 */
export function cleanKecamatanName(kecamatan?: string | null): string {
  if (!kecamatan) return "Poncol";
  return kecamatan
    .replace(/^KECAMATAN\s+/i, "")
    .trim() || "Poncol";
}

/**
 * Strips duplicate prefixes from Desa name and formats nicely.
 * e.g. "DESA PONCOL" -> "Poncol"
 */
export function cleanDesaName(desa?: string | null): string {
  if (!desa) return "Poncol";
  return desa
    .replace(/^(DESA|KELURAHAN)\s+/i, "")
    .trim() || "Poncol";
}

/**
 * Formats official designation (Jabatan) in proper Title Case for running text.
 * e.g. "KEPALA DESA PONCOL" -> "Kepala Desa Poncol"
 */
export function formatJabatanTitleCase(jabatan?: string | null, defaultDesa: string = "Poncol"): string {
  if (!jabatan) return `Kepala Desa ${toIndoTitleCase(cleanDesaName(defaultDesa))}`;
  
  const clean = jabatan.trim();
  if (/^kepala\s+desa/i.test(clean)) {
    const desa = clean.replace(/^kepala\s+desa\s*/i, "").trim();
    return `Kepala Desa ${toIndoTitleCase(cleanDesaName(desa || defaultDesa))}`;
  }
  if (/^sekretaris\s+desa/i.test(clean)) {
    const desa = clean.replace(/^sekretaris\s+desa\s*/i, "").trim();
    return `Sekretaris Desa ${toIndoTitleCase(cleanDesaName(desa || defaultDesa))}`;
  }
  return toIndoTitleCase(clean);
}

/**
 * Formats formal Indonesian opening paragraph exactly matching Tata Naskah Dinas:
 * "Yang bertanda tangan di bawah ini Kepala Desa Poncol, Kecamatan Poncol, Kabupaten Magetan, menerangkan dengan sebenarnya bahwa penduduk dengan identitas di bawah ini:"
 */
export function getKalimatPembukaSurat(
  jabatan: string,
  desa: string,
  kecamatan: string,
  kabupaten: string
): string {
  const desaClean = toIndoTitleCase(cleanDesaName(desa));
  const kecClean = toIndoTitleCase(cleanKecamatanName(kecamatan));
  const kabClean = toIndoTitleCase(cleanKabupatenName(kabupaten));

  let jabatanText = jabatan.trim();
  if (/^kepala\s+desa/i.test(jabatanText) || !jabatanText) {
    jabatanText = `Kepala Desa ${desaClean}`;
  } else {
    jabatanText = toIndoTitleCase(jabatanText);
  }

  return `Yang bertanda tangan di bawah ini ${jabatanText}, Kecamatan ${kecClean}, Kabupaten ${kabClean}, menerangkan dengan sebenarnya bahwa penduduk dengan identitas di bawah ini:`;
}

/**
 * Formats standard RT/RW address line:
 * "RT/RW : 001/001 Desa Poncol Kec. Poncol Kab. Magetan"
 */
export function formatAlamatDomisiliResmi(
  alamat: string | undefined,
  rt: string | undefined,
  desa: string,
  kecamatan: string,
  kabupaten: string
): string {
  const desaClean = toIndoTitleCase(cleanDesaName(desa));
  const kecClean = toIndoTitleCase(cleanKecamatanName(kecamatan));
  const kabClean = toIndoTitleCase(cleanKabupatenName(kabupaten));

  // Extract or format RT/RW (format to 3 digits like 001/001 or 020/006)
  let rtClean = "001";
  let rwClean = "001";

  if (rt) {
    const parts = rt.split(/[/ -]+/);
    if (parts.length >= 2) {
      rtClean = parts[0].padStart(3, "0");
      rwClean = parts[1].padStart(3, "0");
    } else {
      rtClean = parts[0].padStart(3, "0");
      rwClean = "001";
    }
  }

  const baseRtRw = `RT/RW : ${rtClean}/${rwClean} Desa ${desaClean} Kec. ${kecClean} Kab. ${kabClean}`;

  if (alamat && alamat.trim() && !alamat.toLowerCase().includes("rt") && !alamat.toLowerCase().includes("desa")) {
    return `${toIndoTitleCase(alamat.trim())}, ${baseRtRw}`;
  }

  return baseRtRw;
}
