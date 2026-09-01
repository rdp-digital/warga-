import { Penduduk, StatsData, AgeGroupStat } from "../types";
import { normalizeStatusKawin, STATUS_KAWIN_OPTIONS, normalizeAgama, AGAMA_OPTIONS } from "./constants";
import { calculateAgeAccurate, calculateDetailedAgeMonths } from "./dateUtils";

export function calculateAge(birthDateStr: string): number {
  return calculateAgeAccurate(birthDateStr);
}

export function computeStats(data: Penduduk[]): StatsData {
  const totalPenduduk = data.length;

  // Total Unique Family Cards (KK)
  const uniqueKK = new Set(data.map((d) => d.nomorKKInduk?.trim()).filter(Boolean));
  const totalKK = uniqueKK.size;

  // Gender Distribution
  let laki = 0;
  let perempuan = 0;
  data.forEach((d) => {
    const jk = (d.jenisKelamin || "").toUpperCase();
    if (jk.includes("LAKI")) laki++;
    else if (jk.includes("PEREMPUAN")) perempuan++;
  });

  const jenisKelamin = [
    { name: "Laki-Laki", value: laki },
    { name: "Perempuan", value: perempuan }
  ];

  // Detailed 9 Age Brackets matching the design
  const kelompokUsiaDefs = [
    { range: "0 - 11 bulan", test: (info: { years: number; totalMonths: number }) => info.totalMonths < 12 },
    { range: "12 bulan - 6 tahun", test: (info: { years: number; totalMonths: number }) => info.totalMonths >= 12 && info.years <= 6 },
    { range: "7 - 12 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 7 && info.years <= 12 },
    { range: "13 - 15 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 13 && info.years <= 15 },
    { range: "16 - 17 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 16 && info.years <= 17 },
    { range: "18 - 29 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 18 && info.years <= 29 },
    { range: "30 - 39 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 30 && info.years <= 39 },
    { range: "40 - 59 tahun", test: (info: { years: number; totalMonths: number }) => info.years >= 40 && info.years <= 59 },
    { range: "60 tahun keatas", test: (info: { years: number; totalMonths: number }) => info.years >= 60 }
  ];

  const kelompokUsiaCounts = kelompokUsiaDefs.map((def) => ({ range: def.range, count: 0, percentage: 0 }));

  // Standard 5-year step Age Distribution (for backward compatibility)
  const ageRanges = [
    { range: "0-4", count: 0 },
    { range: "5-9", count: 0 },
    { range: "10-14", count: 0 },
    { range: "15-19", count: 0 },
    { range: "20-24", count: 0 },
    { range: "25-29", count: 0 },
    { range: "30-34", count: 0 },
    { range: "35-39", count: 0 },
    { range: "40-44", count: 0 },
    { range: "45-49", count: 0 },
    { range: "50-54", count: 0 },
    { range: "55-59", count: 0 },
    { range: "60-64", count: 0 },
    { range: "65+", count: 0 }
  ];

  data.forEach((d) => {
    const age = calculateAge(d.tanggalLahir);
    const ageDetailed = calculateDetailedAgeMonths(d.tanggalLahir);

    // Standard 5-yr ranges
    if (age <= 4) ageRanges[0].count++;
    else if (age <= 9) ageRanges[1].count++;
    else if (age <= 14) ageRanges[2].count++;
    else if (age <= 19) ageRanges[3].count++;
    else if (age <= 24) ageRanges[4].count++;
    else if (age <= 29) ageRanges[5].count++;
    else if (age <= 34) ageRanges[6].count++;
    else if (age <= 39) ageRanges[7].count++;
    else if (age <= 44) ageRanges[8].count++;
    else if (age <= 49) ageRanges[9].count++;
    else if (age <= 54) ageRanges[10].count++;
    else if (age <= 59) ageRanges[11].count++;
    else if (age <= 64) ageRanges[12].count++;
    else ageRanges[13].count++;

    // 9 Brackets matching the design
    let matched = false;
    for (let i = 0; i < kelompokUsiaDefs.length; i++) {
      if (kelompokUsiaDefs[i].test(ageDetailed)) {
        kelompokUsiaCounts[i].count++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Fallback
      if (ageDetailed.years >= 60) {
        kelompokUsiaCounts[8].count++;
      } else {
        kelompokUsiaCounts[7].count++;
      }
    }
  });

  // Calculate percentages for the 9 brackets
  const distribusiKelompokUsia: AgeGroupStat[] = kelompokUsiaCounts.map((item) => ({
    range: item.range,
    count: item.count,
    percentage: totalPenduduk > 0 ? Number(((item.count / totalPenduduk) * 100).toFixed(1)) : 0
  }));

  // Count per RT
  const rtMap: Record<string, number> = {};
  data.forEach((d) => {
    const rtKey = d.rt ? `RT ${d.rt}` : "RT -";
    rtMap[rtKey] = (rtMap[rtKey] || 0) + 1;
  });
  const jumlahPerRT = Object.keys(rtMap)
    .sort()
    .map((key) => ({
      rt: key,
      count: rtMap[key]
    }));

  // Count per Education
  const eduMap: Record<string, number> = {};
  data.forEach((d) => {
    const eduKey = d.pendidikan || "TIDAK / BELUM SEKOLAH";
    eduMap[eduKey] = (eduMap[eduKey] || 0) + 1;
  });
  const pendidikan = Object.keys(eduMap).map((key) => ({
    name: key,
    count: eduMap[key]
  }));

  // Count per Marital Status
  const kawinMap: Record<string, number> = {};
  // Pre-initialize standard options
  STATUS_KAWIN_OPTIONS.forEach((opt) => {
    kawinMap[opt] = 0;
  });

  data.forEach((d) => {
    const kKey = normalizeStatusKawin(d.statusKawin);
    kawinMap[kKey] = (kawinMap[kKey] || 0) + 1;
  });

  const statusKawin = Object.keys(kawinMap)
    .filter((key) => kawinMap[key] > 0)
    .map((key) => ({
      name: key,
      count: kawinMap[key]
    }));

  // Count per Religion
  const agamaMap: Record<string, number> = {};
  AGAMA_OPTIONS.forEach((opt) => {
    agamaMap[opt] = 0;
  });

  data.forEach((d) => {
    const aKey = normalizeAgama(d.agama);
    agamaMap[aKey] = (agamaMap[aKey] || 0) + 1;
  });

  const agama = Object.keys(agamaMap)
    .filter((key) => agamaMap[key] > 0)
    .map((key) => ({
      name: key,
      count: agamaMap[key]
    }));

  return {
    totalPenduduk,
    totalKK,
    jenisKelamin,
    distribusiUsia: ageRanges,
    distribusiKelompokUsia,
    jumlahPerRT,
    pendidikan,
    statusKawin,
    agama
  };
}
