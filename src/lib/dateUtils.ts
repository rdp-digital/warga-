/**
 * Date & Age Utilities for SIAK Desa
 * Robust parsing and formatting for Indonesian date formats, ISO, Excel serials, and custom strings.
 */

// Indonesian month names mapping
export const INDO_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const INDO_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const MONTH_MAP: Record<string, number> = {
  // Indonesian
  januari: 0, jan: 0,
  februari: 1, feb: 1,
  maret: 2, mar: 2,
  april: 3, apr: 3,
  mei: 4, may: 4,
  juni: 5, jun: 5,
  juli: 6, jul: 6,
  agustus: 7, agust: 7, ags: 7, agu: 7,
  september: 8, sept: 8, sep: 8,
  oktober: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  desember: 11, des: 11, dec: 11,
  // English
  january: 0, february: 1, march: 2, june: 5, july: 6, august: 7, october: 9, december: 11
};

export interface ParsedDateResult {
  date: Date | null;
  day: number;
  month: number; // 0-indexed
  year: number;
  isValid: boolean;
  raw: string;
}

/**
 * Universal Date Parser supporting:
 * - DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (Standard Indonesia)
 * - YYYY-MM-DD or YYYY/MM/DD (ISO)
 * - DD MMMM YYYY (e.g. 10 Agustus 1970 or 10 Aug 1970)
 * - Excel Serial number (e.g. 25790)
 * - Full ISO timestamp (1970-08-10T00:00:00.000Z)
 */
export function parseUniversalDate(input: any): ParsedDateResult {
  if (input === null || input === undefined) {
    return { date: null, day: 0, month: 0, year: 0, isValid: false, raw: "" };
  }

  const rawStr = String(input).trim();
  if (!rawStr || rawStr === "-" || rawStr === "0" || rawStr === "null") {
    return { date: null, day: 0, month: 0, year: 0, isValid: false, raw: rawStr };
  }

  // 1. Check if input is a pure numeric string (Excel Serial Date)
  if (/^\d{4,5}$/.test(rawStr)) {
    const serial = parseInt(rawStr, 10);
    // Excel epoch: Dec 30, 1899
    if (serial > 1000 && serial < 80000) {
      const utcDays = serial - 25569;
      const utcValue = utcDays * 86400;
      const dateInfo = new Date(utcValue * 1000);
      if (!isNaN(dateInfo.getTime())) {
        return {
          date: dateInfo,
          day: dateInfo.getUTCDate(),
          month: dateInfo.getUTCMonth(),
          year: dateInfo.getUTCFullYear(),
          isValid: true,
          raw: rawStr
        };
      }
    }
  }

  // 2. Check for ISO Date format: YYYY-MM-DD or YYYY/MM/DD or YYYY-MM-DDTHH:mm:ss...
  const isoMatch = rawStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      const dt = new Date(y, m, d);
      return { date: dt, day: d, month: m, year: y, isValid: true, raw: rawStr };
    }
  }

  // 3. Check for Indonesian / European format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = rawStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10) - 1;
    const y = parseInt(dmyMatch[3], 10);
    if (y >= 1900 && y <= 2100 && m >= 0 && m <= 11 && d >= 1 && d <= 31) {
      const dt = new Date(y, m, d);
      return { date: dt, day: d, month: m, year: y, isValid: true, raw: rawStr };
    }
  }

  // 4. Check for Text Month: e.g. "17 Agustus 1945" or "17-Agu-1945" or "Aug 17, 1945"
  const textMatch = rawStr.match(/^(\d{1,2})[\s\-/\.,]+([a-zA-Z]+)[\s\-/\.,]+(\d{4})$/);
  if (textMatch) {
    const d = parseInt(textMatch[1], 10);
    const monthWord = textMatch[2].toLowerCase();
    const y = parseInt(textMatch[3], 10);
    if (MONTH_MAP[monthWord] !== undefined) {
      const m = MONTH_MAP[monthWord];
      if (y >= 1900 && y <= 2100 && d >= 1 && d <= 31) {
        const dt = new Date(y, m, d);
        return { date: dt, day: d, month: m, year: y, isValid: true, raw: rawStr };
      }
    }
  }

  // 5. Month first text: "August 17, 1945"
  const textMatchMonthFirst = rawStr.match(/^([a-zA-Z]+)[\s\-/\.,]+(\d{1,2})[\s\-/\.,]+(\d{4})$/);
  if (textMatchMonthFirst) {
    const monthWord = textMatchMonthFirst[1].toLowerCase();
    const d = parseInt(textMatchMonthFirst[2], 10);
    const y = parseInt(textMatchMonthFirst[3], 10);
    if (MONTH_MAP[monthWord] !== undefined) {
      const m = MONTH_MAP[monthWord];
      if (y >= 1900 && y <= 2100 && d >= 1 && d <= 31) {
        const dt = new Date(y, m, d);
        return { date: dt, day: d, month: m, year: y, isValid: true, raw: rawStr };
      }
    }
  }

  // 6. Fallback native JS Date constructor
  const fallbackDt = new Date(rawStr);
  if (!isNaN(fallbackDt.getTime()) && fallbackDt.getFullYear() >= 1900 && fallbackDt.getFullYear() <= 2100) {
    return {
      date: fallbackDt,
      day: fallbackDt.getDate(),
      month: fallbackDt.getMonth(),
      year: fallbackDt.getFullYear(),
      isValid: true,
      raw: rawStr
    };
  }

  return { date: null, day: 0, month: 0, year: 0, isValid: false, raw: rawStr };
}

/**
 * Calculates accurate age with months from any birth date string
 */
export function calculateDetailedAgeMonths(birthDateStr: string | any): { years: number; months: number; totalMonths: number } {
  const parsed = parseUniversalDate(birthDateStr);
  if (!parsed.isValid || !parsed.date) return { years: 0, months: 0, totalMonths: 0 };

  const today = new Date();
  let years = today.getFullYear() - parsed.year;
  let months = today.getMonth() - parsed.month;
  if (today.getDate() < parsed.day) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 0) {
    years = 0;
    months = 0;
  }
  return { years, months, totalMonths: years * 12 + months };
}

/**
 * Calculates accurate age from any birth date string
 */
export function calculateAgeAccurate(birthDateStr: string | any): number {
  const parsed = parseUniversalDate(birthDateStr);
  if (!parsed.isValid || !parsed.date) return 0;

  const today = new Date();
  let age = today.getFullYear() - parsed.year;
  const m = today.getMonth() - parsed.month;
  if (m < 0 || (m === 0 && today.getDate() < parsed.day)) {
    age--;
  }
  return age < 0 ? 0 : age;
}

/**
 * Formats birth date into standardized Indonesian format: DD/MM/YYYY
 */
export function formatToIndoDate(birthDateStr: string | any, separator: "/" | "-" = "/"): string {
  const parsed = parseUniversalDate(birthDateStr);
  if (!parsed.isValid) return String(birthDateStr || "").trim();

  const d = String(parsed.day).padStart(2, "0");
  const m = String(parsed.month + 1).padStart(2, "0");
  const y = parsed.year;
  return `${d}${separator}${m}${separator}${y}`;
}

/**
 * Formats birth date into long Indonesian text: 10 Agustus 1970
 */
export function formatToIndoLongDate(birthDateStr: string | any): string {
  const parsed = parseUniversalDate(birthDateStr);
  if (!parsed.isValid) return String(birthDateStr || "").trim();

  const monthName = INDO_MONTHS[parsed.month] || "";
  return `${parsed.day} ${monthName} ${parsed.year}`;
}

/**
 * Universal display date for official village documents: e.g. "10 Agustus 1970"
 */
export function formatUniversalDateDisplay(birthDateStr: string | any): string {
  return formatToIndoLongDate(birthDateStr);
}

/**
 * Formats to HTML date input format: YYYY-MM-DD
 */
export function formatToHtmlInputDate(birthDateStr: string | any): string {
  const parsed = parseUniversalDate(birthDateStr);
  if (!parsed.isValid) return "";

  const d = String(parsed.day).padStart(2, "0");
  const m = String(parsed.month + 1).padStart(2, "0");
  const y = parsed.year;
  return `${y}-${m}-${d}`;
}

export type DateFormatStatusType = "STANDARD_INDO" | "AUTO_CONVERTIBLE" | "INVALID_OR_EMPTY";

export interface DateAuditItem {
  nik: string;
  namaLengkap: string;
  rt: string;
  nomorKKInduk: string;
  rawTanggalLahir: string;
  status: DateFormatStatusType;
  statusLabel: string;
  recommendedIndoDate: string;
  calculatedAge: number;
  issueDescription: string;
}

/**
 * Audits a single resident's birth date format
 */
export function auditResidentBirthDate(
  nik: string,
  namaLengkap: string,
  rawTanggal: string,
  rt: string = "",
  nomorKKInduk: string = ""
): DateAuditItem {
  const raw = String(rawTanggal || "").trim();

  if (!raw || raw === "-" || raw === "null" || raw === "0") {
    return {
      nik,
      namaLengkap,
      rt,
      nomorKKInduk,
      rawTanggalLahir: raw || "(Kosong)",
      status: "INVALID_OR_EMPTY",
      statusLabel: "Tanggal Kosong",
      recommendedIndoDate: "",
      calculatedAge: 0,
      issueDescription: "Data tanggal lahir kosong atau bertanda strip (-)"
    };
  }

  // Check if it's already strictly DD/MM/YYYY or DD-MM-YYYY
  const isStrictIndo = /^(\d{2})[/](\d{2})[/](\d{4})$/.test(raw) || /^(\d{2})[-](\d{2})[-](\d{4})$/.test(raw);
  const parsed = parseUniversalDate(raw);

  if (!parsed.isValid) {
    return {
      nik,
      namaLengkap,
      rt,
      nomorKKInduk,
      rawTanggalLahir: raw,
      status: "INVALID_OR_EMPTY",
      statusLabel: "Format Rusak / Tidak Terbaca",
      recommendedIndoDate: "",
      calculatedAge: 0,
      issueDescription: `Format '${raw}' tidak dapat dipahami kalender sistem`
    };
  }

  const standardIndo = formatToIndoDate(raw, "/");
  const age = calculateAgeAccurate(raw);

  if (isStrictIndo) {
    return {
      nik,
      namaLengkap,
      rt,
      nomorKKInduk,
      rawTanggalLahir: raw,
      status: "STANDARD_INDO",
      statusLabel: "Format Standar Indonesia",
      recommendedIndoDate: standardIndo,
      calculatedAge: age,
      issueDescription: "Format tanggal sudah valid (DD/MM/YYYY)"
    };
  }

  // Not strictly DD/MM/YYYY, but parseable (e.g. ISO YYYY-MM-DD, Excel serial, English/timestamp)
  let reason = "Format Non-Indonesia (ISO YYYY-MM-DD / Lainnya)";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    reason = "Format ISO Internasional (YYYY-MM-DD)";
  } else if (/^\d{4,5}$/.test(raw)) {
    reason = "Format Angka Serial Excel";
  } else if (raw.includes("T") || raw.includes("Z")) {
    reason = "Format Timestamp ISO";
  } else if (/[a-zA-Z]/.test(raw)) {
    reason = "Format Teks Bulan";
  } else if (raw.includes(".")) {
    reason = "Pemisah Titik (DD.MM.YYYY)";
  }

  return {
    nik,
    namaLengkap,
    rt,
    nomorKKInduk,
    rawTanggalLahir: raw,
    status: "AUTO_CONVERTIBLE",
    statusLabel: "Dapat Dikonversi Otomatis",
    recommendedIndoDate: standardIndo,
    calculatedAge: age,
    issueDescription: reason
  };
}
