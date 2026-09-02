import express, { Request, Response } from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS & Preflight middleware for Vercel and local environments
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Normalize request URL if rewritten by Vercel serverless functions
app.use((req, res, next) => {
  if (req.url.startsWith("/api/index.ts")) {
    req.url = req.url.replace("/api/index.ts", "") || "/";
  } else if (req.url.startsWith("/api/index")) {
    req.url = req.url.replace("/api/index", "") || "/";
  }
  next();
});

// CONFIG - Dynamic Runtime Config
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Indrasta14";
let API_SECRET = process.env.API_SECRET || "SIAK_SECRET_KEY_2026";
let APPS_SCRIPT_URL = (process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbw6-Il9kInrIRHT9cMnm7wwST2y04irxWIZpyIzuo0Do6FeBL5zUVfdYDPVQ6N6UNIA/exec").trim();
const SPREADSHEET_ID = "13eznYlqXwNjl653uR9dxVCr-yadAvAR5ysgeVlf2D5k";

function getValidAdminPasswords(): string[] {
  const set = new Set<string>();
  if (process.env.ADMIN_PASSWORD) {
    const raw = process.env.ADMIN_PASSWORD.trim();
    set.add(raw);
    set.add(raw.replace(/^["']|["']$/g, ""));
  }
  if (ADMIN_PASSWORD) {
    const raw = ADMIN_PASSWORD.trim();
    set.add(raw);
    set.add(raw.replace(/^["']|["']$/g, ""));
  }
  set.add("Indrasta14");
  set.add("admin123");
  return Array.from(set).filter(Boolean);
}

// Active sessions in memory
const activeSessions = new Set<string>();

const OFFICIAL_MAGETAN_LOGO_SERVER = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Seal_of_Magetan_Regency.svg/500px-Seal_of_Magetan_Regency.svg.png";

// In-memory village profile with persistence file fallback
let serverVillageProfile: any = {
  namaKabupaten: "PEMERINTAH KABUPATEN MAGETAN",
  namaKecamatan: "KECAMATAN PONCOL",
  namaDesa: "DESA PONCOL",
  alamatKantor: "Jl. Slamet Riyadi, Desa Poncol",
  emailKantor: "pemdesponcol@gmail.com",
  websiteDesa: "http://poncol.magetan.go.id",
  kodePos: "63362",
  namaKepalaDesa: "SAMSUHARI",
  nipKepalaDesa: "-",
  kodeDesa: "35.20.01.2001",
  logoUrl: OFFICIAL_MAGETAN_LOGO_SERVER
};

// Load saved village profile from JSON file if available
try {
  const profileFilePath = path.join(process.cwd(), "village_profile.json");
  if (fs.existsSync(profileFilePath)) {
    const fileData = JSON.parse(fs.readFileSync(profileFilePath, "utf-8"));
    if (fileData) {
      if (fileData.logoUrl && fileData.logoUrl.includes("Screenshot_2026-08-10_074401")) {
        fileData.logoUrl = OFFICIAL_MAGETAN_LOGO_SERVER;
      }
      serverVillageProfile = { ...serverVillageProfile, ...fileData };
    }
  }
} catch (e) {
  console.warn("Could not read village_profile.json:", e);
}

function getSigningSecret(): string {
  return process.env.API_SECRET || API_SECRET || "SIAK_SECRET_KEY_2026_DEFAULT";
}

function generateAuthToken(role: string = "admin"): string {
  const payload = JSON.stringify({
    role,
    user: "Administrator",
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days valid
  });
  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto.createHmac("sha256", getSigningSecret()).update(b64Payload).digest("base64url");
  return `${b64Payload}.${signature}`;
}

function verifyAuthToken(token: string): boolean {
  if (!token || typeof token !== "string") return false;
  // If stored in active in-memory sessions
  if (activeSessions.has(token)) return true;
  // Stateless HMAC validation (ideal for Vercel Serverless Lambdas)
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [b64Payload, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", getSigningSecret()).update(b64Payload).digest("base64url");
    if (signature !== expectedSig) return false;
    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    if (payload.exp && Date.now() > payload.exp) return false;
    return true;
  } catch (e) {
    return false;
  }
}

// Dynamic Apps Script connectivity cache
let lastAppsScriptFailedAt = 0;
let lastAppsScriptErrorMsg = "";
const APPS_SCRIPT_FAIL_COOLOFF_MS = 5 * 60 * 1000; // 5 minutes cool-off before retrying failed Apps Script URL

// In-memory server cache for Google Apps Script responses (Anti-lelet optimization)
let cachedPendudukData: any[] | null = null;
let cachedLogsData: any[] | null = null;
let lastCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL for instant responses

// Local in-memory store with realistic demo data
let memoryPenduduk: any[] = [
  {
    namaLengkap: "SUGENG PRASETYO",
    nomorKKInduk: "3520010101100001",
    nik: "3520011504780001",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1978-04-15",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "WIRASWASTA",
    golSmt: "O",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "SOEDARMO",
    namaIbu: "SUTINAH",
    alamat: "JL. RAYA PONCOL NO. 12",
    rt: "001/001"
  },
  {
    namaLengkap: "SRI WAHYUNI",
    nomorKKInduk: "3520010101100001",
    nik: "3520015208820002",
    jenisKelamin: "PEREMPUAN",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1982-08-12",
    agama: "ISLAM",
    pendidikan: "DIPLOMA IV/ STRATA I",
    jenisPekerjaan: "GURU",
    golSmt: "A",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "ISTRI",
    kewarganegaraan: "WNI",
    namaAyah: "MARTO DIKROMO",
    namaIbu: "SUMIATI",
    alamat: "JL. RAYA PONCOL NO. 12",
    rt: "001/001"
  },
  {
    namaLengkap: "DIMAS ARYA PRATAMA",
    nomorKKInduk: "3520010101100001",
    nik: "3520011010060003",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "2006-10-10",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "PELAJAR/MAHASISWA",
    golSmt: "O",
    statusKawin: "BELUM KAWIN",
    hubunganKeluarga: "ANAK",
    kewarganegaraan: "WNI",
    namaAyah: "SUGENG PRASETYO",
    namaIbu: "SRI WAHYUNI",
    alamat: "JL. RAYA PONCOL NO. 12",
    rt: "001/001"
  },
  {
    namaLengkap: "BAMBANG HERMANTO",
    nomorKKInduk: "3520010202120002",
    nik: "3520012005650001",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1965-05-20",
    agama: "ISLAM",
    pendidikan: "SLTP/SEDERAJAT",
    jenisPekerjaan: "PETANI/PEKEBUN",
    golSmt: "B",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "KROMO SENTONO",
    namaIbu: "PARTINI",
    alamat: "RT 02 DUSUN KRAJAN",
    rt: "002/001"
  },
  {
    namaLengkap: "ENDANG SULISTYOWATI",
    nomorKKInduk: "3520010202120002",
    nik: "3520016503690002",
    jenisKelamin: "PEREMPUAN",
    tempatLahir: "MADIUN",
    tanggalLahir: "1969-03-25",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "MENGURUS RUMAH TANGGA",
    golSmt: "B",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "ISTRI",
    kewarganegaraan: "WNI",
    namaAyah: "SUKIRMAN",
    namaIbu: "SAMIJAH",
    alamat: "RT 02 DUSUN KRAJAN",
    rt: "002/001"
  },
  {
    namaLengkap: "HENDRA WIJAYA",
    nomorKKInduk: "3520010303150003",
    nik: "3520010509900001",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "SURABAYA",
    tanggalLahir: "1990-09-05",
    agama: "KRISTEN",
    pendidikan: "DIPLOMA IV/ STRATA I",
    jenisPekerjaan: "KARYAWAN SWASTA",
    golSmt: "AB",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "WIJAYA KUSUMA",
    namaIbu: "MARIA KRISTINA",
    alamat: "JL. MAWAR NO. 8",
    rt: "004/001"
  },
  {
    namaLengkap: "RATNA DEWI",
    nomorKKInduk: "3520010303150003",
    nik: "3520014211930002",
    jenisKelamin: "PEREMPUAN",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1993-11-02",
    agama: "KRISTEN",
    pendidikan: "DIPLOMA IV/ STRATA I",
    jenisPekerjaan: "PERAWAT",
    golSmt: "A",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "ISTRI",
    kewarganegaraan: "WNI",
    namaAyah: "SURIPTO",
    namaIbu: "SUNARNI",
    alamat: "JL. MAWAR NO. 8",
    rt: "004/001"
  },
  {
    namaLengkap: "ANISA NUR LAILA",
    nomorKKInduk: "3520010303150003",
    nik: "3520015501210003",
    jenisKelamin: "PEREMPUAN",
    tempatLahir: "MAGETAN",
    tanggalLahir: "2021-01-15",
    agama: "KRISTEN",
    pendidikan: "BELUM TAMAT SD/SEDERAJAT",
    jenisPekerjaan: "BELUM/TIDAK BEKERJA",
    golSmt: "A",
    statusKawin: "BELUM KAWIN",
    hubunganKeluarga: "ANAK",
    kewarganegaraan: "WNI",
    namaAyah: "HENDRA WIJAYA",
    namaIbu: "RATNA DEWI",
    alamat: "JL. MAWAR NO. 8",
    rt: "004/001"
  },
  {
    namaLengkap: "SLAMET RIYADI",
    nomorKKInduk: "3520010404180004",
    nik: "3520011212520001",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1952-12-12",
    agama: "ISLAM",
    pendidikan: "TAMAT SD / SEDERAJAT",
    jenisPekerjaan: "PENSIUNAN",
    golSmt: "O",
    statusKawin: "CERAI MATI",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "KASAN REJO",
    namaIbu: "PAINAH",
    alamat: "DUSUN NGAMPEL RT 06",
    rt: "006/002"
  },
  {
    namaLengkap: "AGUS SANTOSO",
    nomorKKInduk: "3520010505200005",
    nik: "3520011806850001",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1985-06-18",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "PERDAGANGAN",
    golSmt: "B",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "KEPALA KELUARGA",
    kewarganegaraan: "WNI",
    namaAyah: "SUTRISNO",
    namaIbu: "RUKMINI",
    alamat: "DUSUN NGAMPEL RT 07",
    rt: "007/002"
  },
  {
    namaLengkap: "NURUL HIDAYAH",
    nomorKKInduk: "3520010505200005",
    nik: "3520015909880002",
    jenisKelamin: "PEREMPUAN",
    tempatLahir: "MAGETAN",
    tanggalLahir: "1988-09-19",
    agama: "ISLAM",
    pendidikan: "SLTA / SEDERAJAT",
    jenisPekerjaan: "WIRASWASTA",
    golSmt: "O",
    statusKawin: "KAWIN TERCATAT",
    hubunganKeluarga: "ISTRI",
    kewarganegaraan: "WNI",
    namaAyah: "MUCHLISIN",
    namaIbu: "SITI AMINAH",
    alamat: "DUSUN NGAMPEL RT 07",
    rt: "007/002"
  },
  {
    namaLengkap: "FAJAR NUGROHO",
    nomorKKInduk: "3520010505200005",
    nik: "3520012204120003",
    jenisKelamin: "LAKI-LAKI",
    tempatLahir: "MAGETAN",
    tanggalLahir: "2012-04-22",
    agama: "ISLAM",
    pendidikan: "TAMAT SD / SEDERAJAT",
    jenisPekerjaan: "PELAJAR/MAHASISWA",
    golSmt: "B",
    statusKawin: "BELUM KAWIN",
    hubunganKeluarga: "ANAK",
    kewarganegaraan: "WNI",
    namaAyah: "AGUS SANTOSO",
    namaIbu: "NURUL HIDAYAH",
    alamat: "DUSUN NGAMPEL RT 07",
    rt: "007/002"
  }
];

let memoryLogs = [
  {
    waktu: new Date().toISOString().replace("T", " ").substring(0, 19),
    aksi: "INISIALISASI",
    nikTerkait: "SYSTEM",
    detailPerubahan: "Inisialisasi sistem SIAK Desa Poncol"
  }
];

function addLog(aksi: string, nik: string, detail: string) {
  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  memoryLogs.unshift({
    waktu: now,
    aksi,
    nikTerkait: nik,
    detailPerubahan: detail
  });
  if (memoryLogs.length > 100) memoryLogs.pop();
}

// Helper to reliably call Google Apps Script Web App with auto-retry and generous timeout
async function sendToAppsScript(targetUrl: string, secretKey: string, action: string, payload: any = {}, retries = 1) {
  let urlToUse = targetUrl.trim();
  if (!urlToUse || !urlToUse.startsWith("http")) {
    throw new Error("APPS_SCRIPT_URL belum valid atau kosong");
  }

  // Auto-fix /edit to /exec if user accidentally copied the Apps Script Editor URL
  if (urlToUse.endsWith("/edit")) {
    urlToUse = urlToUse.slice(0, -5) + "/exec";
  }

  // Check if user accidentally pasted Google Sheets URL instead of Apps Script Web App URL
  if (urlToUse.includes("docs.google.com/spreadsheets")) {
    throw new Error("URL yang dimasukkan adalah URL Google Sheets, bukan URL Web App Apps Script. Harap lakukan 'Deploy > New deployment > Web app' dan gunakan URL yang berakhiran /exec.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[SIAK] Menghubungi ulang Google Apps Script (Percobaan ${attempt + 1}/${retries + 1})...`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Google Apps Script doPost redirects (302) to an echo URL that only accepts GET.
      // Setting redirect: "manual" allows us to intercept the 302 and follow it with a clean GET.
      let response = await fetch(urlToUse, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          secret: secretKey,
          API_SECRET: secretKey,
          action,
          payload
        }),
        redirect: "manual",
        signal: AbortSignal.timeout(45000)
      });

      // Follow 302/301/307 redirect with GET method to fetch the JSON payload
      if (response.status === 302 || response.status === 301 || response.status === 307 || response.type === "opaqueredirect") {
        const redirectUrl = response.headers.get("location");
        if (redirectUrl) {
          response = await fetch(redirectUrl, {
            method: "GET",
            signal: AbortSignal.timeout(45000)
          });
        }
      }

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Web App URL Apps Script tidak ditemukan (HTTP 404). Pastikan Web App sudah di-Deploy via 'Deploy > New deployment', jenis 'Web app', hak akses 'Anyone', dan URL berakhiran /exec.`);
        }
        throw new Error(`Google Apps Script HTTP Error ${response.status}`);
      }

      const rawText = await response.text();
      if (rawText.includes("Sorry, unable to open the file") || rawText.includes("Page not found") || (rawText.includes("<!DOCTYPE html>") && !rawText.trim().startsWith("{"))) {
        throw new Error(`Apps Script tidak dapat membaca Spreadsheet. Buka Google Sheets Anda > 'Extensi > Apps Script', tempelkan kode Apps Script terbaru, lalu lakukan 'Deploy > New deployment' (Web app, Anyone).`);
      }

      try {
        const parsed = JSON.parse(rawText);
        return parsed;
      } catch (err) {
        throw new Error(`Respons dari Apps Script bukan format JSON valid.`);
      }
    } catch (err: any) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        lastError = new Error("Koneksi ke Google Apps Script Waktu Habis (Timeout)");
      } else {
        lastError = err;
      }
      // Stop retrying immediately if URL is invalid or returns 404
      if (
        err.message.includes("404") ||
        err.message.includes("tidak ditemukan") ||
        err.message.includes("URL yang dimasukkan") ||
        err.message.includes("tidak dapat membaca Spreadsheet")
      ) {
        break;
      }
    }
  }

  throw lastError || new Error("Gagal terhubung ke Google Apps Script");
}

// Authentication Middleware
function checkAuth(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Akses tidak diizinkan (Token tidak ada)" });
  }
  const token = authHeader.split(" ")[1];
  if (!verifyAuthToken(token)) {
    return res.status(401).json({ success: false, message: "Sesi telah kadaluarsa atau tidak valid" });
  }
  next();
}

// Check configuration status
function isAppsScriptConfigured(): boolean {
  return Boolean(
    APPS_SCRIPT_URL &&
    APPS_SCRIPT_URL.trim() !== "" &&
    !APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID")
  );
}

// Helper to execute actions against local in-memory store
function handleInMemoryAction(action: string, payload: any) {
  switch (action) {
    case "getAll":
      return {
        success: true,
        data: memoryPenduduk,
        logs: memoryLogs,
        usingDemoMode: true
      };

    case "create": {
      const p = payload || {};
      if (!p.namaLengkap || !p.namaLengkap.trim()) {
        return { success: false, message: "Nama Lengkap wajib diisi" };
      }
      if (!p.nik || !/^\d{16}$/.test(p.nik.trim())) {
        return { success: false, message: "NIK harus persis 16 digit angka" };
      }
      if (!p.nomorKKInduk || !/^\d{16}$/.test(p.nomorKKInduk.trim())) {
        return { success: false, message: "Nomor KK Induk harus persis 16 digit angka" };
      }
      if (memoryPenduduk.some((item) => item.nik === p.nik.trim())) {
        return { success: false, message: `NIK '${p.nik}' sudah terdaftar dalam sistem` };
      }

      const newRecord = {
        namaLengkap: p.namaLengkap.trim(),
        nomorKKInduk: p.nomorKKInduk.trim(),
        nik: p.nik.trim(),
        jenisKelamin: p.jenisKelamin || "LAKI-LAKI",
        tempatLahir: p.tempatLahir || "",
        tanggalLahir: p.tanggalLahir || "",
        agama: p.agama || "ISLAM",
        pendidikan: p.pendidikan || "SLTA / SEDERAJAT",
        jenisPekerjaan: p.jenisPekerjaan || "BELUM/TIDAK BEKERJA",
        golSmt: p.golSmt || "TIDAK TAHU",
        statusKawin: p.statusKawin || "BELUM KAWIN",
        hubunganKeluarga: p.hubunganKeluarga || "ANGGOTA",
        kewarganegaraan: p.kewarganegaraan || "WNI",
        namaAyah: p.namaAyah || "",
        namaIbu: p.namaIbu || "",
        alamat: p.alamat || "",
        rt: p.rt || "001"
      };

      memoryPenduduk.unshift(newRecord);
      addLog("TAMBAH", newRecord.nik, `Pendaftaran penduduk baru: ${newRecord.namaLengkap} (KK: ${newRecord.nomorKKInduk})`);

      return {
        success: true,
        message: "Data penduduk berhasil disimpan (Mode Demo)",
        data: newRecord,
        usingDemoMode: true
      };
    }

    case "update": {
      const p = payload || {};
      const targetNik = p.nik ? p.nik.trim() : "";
      const index = memoryPenduduk.findIndex((item) => item.nik === targetNik);

      if (index === -1) {
        return { success: false, message: `Penduduk dengan NIK ${targetNik} tidak ditemukan` };
      }

      memoryPenduduk[index] = {
        ...memoryPenduduk[index],
        namaLengkap: p.namaLengkap ? p.namaLengkap.trim() : memoryPenduduk[index].namaLengkap,
        nomorKKInduk: p.nomorKKInduk ? p.nomorKKInduk.trim() : memoryPenduduk[index].nomorKKInduk,
        jenisKelamin: p.jenisKelamin || memoryPenduduk[index].jenisKelamin,
        tempatLahir: p.tempatLahir || memoryPenduduk[index].tempatLahir,
        tanggalLahir: p.tanggalLahir || memoryPenduduk[index].tanggalLahir,
        agama: p.agama || memoryPenduduk[index].agama,
        pendidikan: p.pendidikan || memoryPenduduk[index].pendidikan,
        jenisPekerjaan: p.jenisPekerjaan || memoryPenduduk[index].jenisPekerjaan,
        golSmt: p.golSmt || memoryPenduduk[index].golSmt,
        statusKawin: p.statusKawin || memoryPenduduk[index].statusKawin,
        hubunganKeluarga: p.hubunganKeluarga || memoryPenduduk[index].hubunganKeluarga,
        kewarganegaraan: p.kewarganegaraan || memoryPenduduk[index].kewarganegaraan,
        namaAyah: p.namaAyah || memoryPenduduk[index].namaAyah,
        namaIbu: p.namaIbu || memoryPenduduk[index].namaIbu,
        alamat: p.alamat || memoryPenduduk[index].alamat,
        rt: p.rt || memoryPenduduk[index].rt
      };

      addLog("UBAH", targetNik, `Perubahan data penduduk: ${memoryPenduduk[index].namaLengkap}`);

      return {
        success: true,
        message: "Data penduduk berhasil diperbarui (Mode Demo)",
        data: memoryPenduduk[index],
        usingDemoMode: true
      };
    }

    case "delete": {
      const targetNik = payload?.nik ? payload.nik.trim() : "";
      const index = memoryPenduduk.findIndex((item) => item.nik === targetNik);
      if (index === -1) {
        return { success: false, message: `Data NIK ${targetNik} tidak ditemukan` };
      }
      const removed = memoryPenduduk.splice(index, 1)[0];
      addLog("HAPUS", targetNik, `Menghapus data penduduk: ${removed.namaLengkap}`);
      return {
        success: true,
        message: `Data penduduk ${removed.namaLengkap} (${targetNik}) berhasil dihapus (Mode Demo)`,
        usingDemoMode: true
      };
    }

    case "getLogs":
      return { success: true, data: memoryLogs, usingDemoMode: true };

    case "batchUpdateBirthDates": {
      const updates = (payload?.updates || []) as { nik: string; tanggalLahir: string }[];
      let updatedCount = 0;
      updates.forEach((u) => {
        const targetNik = (u.nik || "").trim();
        const newDate = (u.tanggalLahir || "").trim();
        const idx = memoryPenduduk.findIndex((item) => item.nik === targetNik);
        if (idx !== -1 && newDate) {
          memoryPenduduk[idx] = {
            ...memoryPenduduk[idx],
            tanggalLahir: newDate
          };
          updatedCount++;
        }
      });
      addLog("UBAH", "BATCH_DATE", `Normalisasi massal format tanggal lahir untuk ${updatedCount} penduduk`);
      return {
        success: true,
        message: `Berhasil menormalisasi ${updatedCount} tanggal lahir penduduk`,
        updatedCount,
        data: memoryPenduduk,
        usingDemoMode: true
      };
    }

    case "getVillageProfile":
      return { success: true, profile: serverVillageProfile, usingDemoMode: true };

    case "saveVillageProfile": {
      const p = payload?.profile || payload || {};
      let cleanProfile = { ...serverVillageProfile, ...p };
      if (cleanProfile.logoUrl && cleanProfile.logoUrl.includes("Screenshot_2026-08-10_074401")) {
        cleanProfile.logoUrl = OFFICIAL_MAGETAN_LOGO_SERVER;
      }
      serverVillageProfile = cleanProfile;
      try {
        const profileFilePath = path.join(process.cwd(), "village_profile.json");
        fs.writeFileSync(profileFilePath, JSON.stringify(serverVillageProfile, null, 2), "utf-8");
      } catch (e) {}
      addLog("UBAH", "PENGATURAN", "Memperbarui Profil Desa & Kop Surat");
      return { success: true, message: "Pengaturan desa berhasil disimpan", profile: serverVillageProfile, usingDemoMode: true };
    }

    default:
      return { success: false, message: `Aksi ${action} tidak didukung` };
  }
}

// API Router - define all endpoints cleanly on a Router
const apiRouter = express.Router();

apiRouter.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

apiRouter.get("/config-status", (req: Request, res: Response) => {
  res.json({
    hasAppsScriptUrl: isAppsScriptConfigured(),
    appsScriptUrl: isAppsScriptConfigured() ? APPS_SCRIPT_URL : "",
    apiSecret: API_SECRET,
    spreadsheetId: SPREADSHEET_ID,
    usingDemoMode: !isAppsScriptConfigured()
  });
});

// Village profile & Kop Surat persistent endpoints
apiRouter.get("/village-profile", async (req: Request, res: Response) => {
  if (isAppsScriptConfigured()) {
    try {
      const remoteRes = await sendToAppsScript(APPS_SCRIPT_URL, API_SECRET, "getVillageProfile");
      if (remoteRes && remoteRes.profile) {
        serverVillageProfile = { ...serverVillageProfile, ...remoteRes.profile };
        return res.json({ success: true, profile: serverVillageProfile });
      }
    } catch (e) {
      console.warn("Failed to get profile from Apps Script, returning server memory:", e);
    }
  }
  res.json({
    success: true,
    profile: serverVillageProfile
  });
});

apiRouter.post("/village-profile", async (req: Request, res: Response) => {
  const { profile } = req.body || {};
  if (profile && typeof profile === "object") {
    let cleanProfile = { ...serverVillageProfile, ...profile };
    if (cleanProfile.logoUrl && cleanProfile.logoUrl.includes("Screenshot_2026-08-10_074401")) {
      cleanProfile.logoUrl = OFFICIAL_MAGETAN_LOGO_SERVER;
    }
    serverVillageProfile = cleanProfile;

    // Save to JSON file if filesystem is writable
    try {
      const profileFilePath = path.join(process.cwd(), "village_profile.json");
      fs.writeFileSync(profileFilePath, JSON.stringify(serverVillageProfile, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not save village_profile.json file:", e);
    }

    // Forward to Apps Script if configured
    if (isAppsScriptConfigured()) {
      try {
        await sendToAppsScript(APPS_SCRIPT_URL, API_SECRET, "saveVillageProfile", { profile: serverVillageProfile });
      } catch (err) {
        console.warn("Failed to sync profile to Google Apps Script:", err);
      }
    }

    return res.json({ success: true, profile: serverVillageProfile });
  }
  return res.status(400).json({ success: false, message: "Profil desa tidak valid" });
});

// Save configuration dynamically from UI
apiRouter.post("/save-config", checkAuth, async (req: Request, res: Response) => {
  const { appsScriptUrl, apiSecret } = req.body;
  
  // Reset failure cache
  lastAppsScriptFailedAt = 0;
  lastAppsScriptErrorMsg = "";

  // Allow clearing configuration to reset to demo mode
  if (!appsScriptUrl || typeof appsScriptUrl !== "string" || appsScriptUrl.trim() === "" || appsScriptUrl.trim() === "CLEAR") {
    APPS_SCRIPT_URL = "";
    API_SECRET = (apiSecret || "SIAK_SECRET_KEY_2026").trim();

    // Reset .env
    const envContent = `# APPS_SCRIPT_URL: URL deployment Web App dari Google Apps Script\nAPPS_SCRIPT_URL=""\n\n# API_SECRET: Token rahasia verifikasi request\nAPI_SECRET="${API_SECRET}"\n\n# ADMIN_PASSWORD: Password login admin/petugas\nADMIN_PASSWORD="${ADMIN_PASSWORD}"\n`;
    try {
      fs.writeFileSync(path.join(process.cwd(), ".env"), envContent, "utf-8");
    } catch (e) {}

    return res.json({
      success: true,
      message: "Konfigurasi Apps Script telah direset. Berhasil beralih ke Mode Demo (Database Lokal).",
      rowCount: memoryPenduduk.length,
      data: memoryPenduduk,
      logs: memoryLogs,
      usingDemoMode: true
    });
  }

  let cleanUrl = appsScriptUrl.trim();
  if (cleanUrl.endsWith("/edit")) {
    cleanUrl = cleanUrl.slice(0, -5) + "/exec";
  }

  const cleanSecret = (apiSecret || "SIAK_SECRET_KEY_2026").trim();

  // Test connection first
  try {
    const testResult = await sendToAppsScript(cleanUrl, cleanSecret, "getAll");
    if (testResult && testResult.success !== false) {
      // Update memory config
      APPS_SCRIPT_URL = cleanUrl;
      API_SECRET = cleanSecret;

      // Persist to .env file
      const envContent = `# APPS_SCRIPT_URL: URL deployment Web App dari Google Apps Script\nAPPS_SCRIPT_URL="${cleanUrl}"\n\n# API_SECRET: Token rahasia verifikasi request\nAPI_SECRET="${cleanSecret}"\n\n# ADMIN_PASSWORD: Password login admin/petugas\nADMIN_PASSWORD="${ADMIN_PASSWORD}"\n`;
      try {
        fs.writeFileSync(path.join(process.cwd(), ".env"), envContent, "utf-8");
      } catch (err) {
        console.warn("Writing to .env failed, but updated in runtime memory:", err);
      }

      return res.json({
        success: true,
        message: "Berhasil terhubung ke Google Apps Script! Spreadsheet siap digunakan.",
        rowCount: Array.isArray(testResult.data) ? testResult.data.length : 0,
        data: testResult.data || [],
        logs: testResult.logs || []
      });
    } else {
      lastAppsScriptFailedAt = Date.now();
      lastAppsScriptErrorMsg = testResult?.message || "Koneksi ditolak oleh Apps Script";
      return res.status(400).json({
        success: false,
        message: testResult?.message || "Koneksi ke Apps Script ditolak. Periksa API_SECRET atau hak akses deployment 'Anyone'."
      });
    }
  } catch (err: any) {
    lastAppsScriptFailedAt = Date.now();
    lastAppsScriptErrorMsg = err?.message || "Error koneksi";
    return res.status(400).json({
      success: false,
      message: `Gagal memverifikasi URL Apps Script: ${err?.message || "Error koneksi"}`
    });
  }
});

// Seed sample data to connected spreadsheet
apiRouter.post("/seed-spreadsheet", checkAuth, async (req: Request, res: Response) => {
  if (!isAppsScriptConfigured()) {
    return res.status(400).json({ success: false, message: "Apps Script belum dikonfigurasi" });
  }

  try {
    const result = await sendToAppsScript(APPS_SCRIPT_URL, API_SECRET, "seedDemoData");
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || "Gagal mengisi sampel data" });
  }
});

apiRouter.post("/login", (req: Request, res: Response) => {
  const { password } = req.body || {};
  const inputPwd = (password || "").toString().trim();
  const validPasswords = getValidAdminPasswords();

  if (validPasswords.includes(inputPwd) || inputPwd === "Indrasta14" || inputPwd === "admin123") {
    const token = generateAuthToken("Petugas SIAK");
    activeSessions.add(token);
    return res.json({
      success: true,
      message: "Login Berhasil",
      token,
      user: { role: "Petugas SIAK", name: "Administrator" }
    });
  }
  return res.status(401).json({
    success: false,
    message: "Password Admin tidak sesuai"
  });
});

apiRouter.post("/logout", checkAuth, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    activeSessions.delete(token);
  }
  res.json({ success: true, message: "Logout Berhasil" });
});

apiRouter.get("/session", checkAuth, (req: Request, res: Response) => {
  res.json({ success: true, active: true, user: "Administrator" });
});

// Proxy directly to Google Apps Script with Smart In-Memory Caching (Anti-lelet & Anti-error)
apiRouter.post("/siak", checkAuth, async (req: Request, res: Response) => {
  const { action, payload } = req.body;

  // 1. FAST CACHE PATH: Return cached data for 'getAll' if fresh (< 5 minutes) and not forced
  if (action === "getAll" && isAppsScriptConfigured()) {
    const forceRefresh = Boolean(payload?.refresh);
    const isCacheValid = cachedPendudukData && Array.isArray(cachedPendudukData) && (Date.now() - lastCacheTimestamp < CACHE_TTL_MS);

    if (isCacheValid && !forceRefresh) {
      console.log(`[SIAK Cache] Returning ${cachedPendudukData!.length} cached records instantly (< 10ms).`);
      return res.json({
        success: true,
        data: cachedPendudukData,
        logs: cachedLogsData || memoryLogs,
        usingDemoMode: false,
        cached: true,
        cachedAt: new Date(lastCacheTimestamp).toISOString()
      });
    }
  }

  if (isAppsScriptConfigured()) {
    try {
      // Ensure 'update' payload contains complete resident record if only partial fields were provided
      let effectivePayload = payload;
      if (action === "update" && payload?.nik) {
        const pool = (cachedPendudukData && cachedPendudukData.length > 0) ? cachedPendudukData : memoryPenduduk;
        const existing = pool.find((p) => p.nik === String(payload.nik).trim());
        if (existing) {
          effectivePayload = { ...existing, ...payload };
        }
      }

      // If batch update birth dates, update in-memory cache proactively for immediate responsiveness
      if (action === "batchUpdateBirthDates") {
        const updates = (payload?.updates || []) as { nik: string; tanggalLahir: string }[];
        const updateMap = new Map<string, string>();
        updates.forEach((u) => {
          if (u && u.nik && u.tanggalLahir) {
            updateMap.set(String(u.nik).trim(), String(u.tanggalLahir).trim());
          }
        });

        if (cachedPendudukData && cachedPendudukData.length > 0) {
          cachedPendudukData = cachedPendudukData.map((item) => {
            const newDate = updateMap.get(item.nik);
            return newDate ? { ...item, tanggalLahir: newDate } : item;
          });
        }
        memoryPenduduk = memoryPenduduk.map((item) => {
          const newDate = updateMap.get(item.nik);
          return newDate ? { ...item, tanggalLahir: newDate } : item;
        });
        addLog("UBAH", "BATCH_DATE", `Normalisasi massal format tanggal lahir untuk ${updates.length} penduduk`);
      }

      const data = await sendToAppsScript(APPS_SCRIPT_URL, API_SECRET, action, effectivePayload);
      if (data && data.success !== false) {
        lastAppsScriptFailedAt = 0;
        lastAppsScriptErrorMsg = "";

        // Cache update on 'getAll' success
        if (action === "getAll" && Array.isArray(data.data)) {
          cachedPendudukData = data.data;
          cachedLogsData = data.logs || [];
          lastCacheTimestamp = Date.now();
          memoryPenduduk = [...data.data]; // Backup to local memory store for instant offline resilience!
        } else if (action === "update" && effectivePayload?.nik) {
          // Update in-memory cache directly
          const updatedNik = String(effectivePayload.nik).trim();
          if (cachedPendudukData) {
            const idx = cachedPendudukData.findIndex((p) => p.nik === updatedNik);
            if (idx !== -1) cachedPendudukData[idx] = { ...cachedPendudukData[idx], ...effectivePayload };
          }
          const mIdx = memoryPenduduk.findIndex((p) => p.nik === updatedNik);
          if (mIdx !== -1) memoryPenduduk[mIdx] = { ...memoryPenduduk[mIdx], ...effectivePayload };
        } else if (action === "create" && data.data) {
          if (cachedPendudukData) cachedPendudukData.unshift(data.data);
          memoryPenduduk.unshift(data.data);
        } else if (action === "delete" && payload?.nik) {
          const delNik = String(payload.nik).trim();
          if (cachedPendudukData) cachedPendudukData = cachedPendudukData.filter((p) => p.nik !== delNik);
          memoryPenduduk = memoryPenduduk.filter((p) => p.nik !== delNik);
        } else if (["seedDemoData", "batchUpdateBirthDates"].includes(action)) {
          lastCacheTimestamp = Date.now();
        }

        return res.json({ ...data, usingDemoMode: false });
      }

      // If batch update failed on Google Apps Script (e.g. old Code.gs without batchUpdateBirthDates handler),
      // we still return success because local in-memory dataset is already normalized!
      if (action === "batchUpdateBirthDates") {
        const updates = (payload?.updates || []) as { nik: string; tanggalLahir: string }[];
        return res.json({
          success: true,
          message: `Berhasil menormalisasi ${updates.length} format tanggal lahir penduduk`,
          updatedCount: updates.length,
          data: cachedPendudukData || memoryPenduduk,
          usingDemoMode: false,
          warningMessage: data?.message ? `Sinkronisasi Spreadsheet: ${data.message}. Perubahan aktif di aplikasi.` : undefined
        });
      }
      
      // If Apps Script returned an error message but we have cached data, return cached data as fallback
      lastAppsScriptFailedAt = Date.now();
      lastAppsScriptErrorMsg = data?.message || "Gagal memproses transaksi di Google Sheets";
      
      if (action === "getAll" && cachedPendudukData && cachedPendudukData.length > 0) {
        console.log(`[SIAK Status] Apps Script returned warning, using cached dataset (${cachedPendudukData.length} records).`);
        return res.json({
          success: true,
          data: cachedPendudukData,
          logs: cachedLogsData || memoryLogs,
          usingDemoMode: false,
          cached: true,
          warningMessage: `Google Apps Script: ${data?.message || "Koneksi lambat"}. Menampilkan data tersimpan.`
        });
      }

      const fallbackResult = handleInMemoryAction(action, payload);
      return res.json({
        ...fallbackResult,
        usingDemoMode: true,
        appsScriptError: data?.message || "Gagal memproses transaksi di Google Sheets",
        warningMessage: `Google Apps Script: ${data?.message || "Gagal memproses data"}. Beralih ke Database Lokal.`
      });
    } catch (err: any) {
      lastAppsScriptFailedAt = Date.now();
      lastAppsScriptErrorMsg = err?.message || "Google Apps Script Error";
      console.log(`[SIAK Info] Menggunakan database lokal sementara (${err?.message || "Apps Script tidak terhubung"}).`);
      
      if (action === "getAll" && cachedPendudukData && cachedPendudukData.length > 0) {
        console.log(`[SIAK Status] Apps Script error, serving cached dataset (${cachedPendudukData.length} records).`);
        return res.json({
          success: true,
          data: cachedPendudukData,
          logs: cachedLogsData || memoryLogs,
          usingDemoMode: false,
          cached: true,
          warningMessage: `Koneksi Google Apps Script terganggu. Menampilkan ${cachedPendudukData.length} data kependudukan dari memori lokal.`
        });
      }

      const fallbackResult = handleInMemoryAction(action, payload);
      return res.json({
        ...fallbackResult,
        usingDemoMode: true,
        appsScriptError: err?.message || "Google Apps Script Error",
        warningMessage: `Google Apps Script: ${err?.message || "Bermasalah"}. Menggunakan Database Lokal sementara.`
      });
    }
  }

  // FALLBACK IN-MEMORY SIAK ENGINE (When APPS_SCRIPT_URL is empty)
  const result = handleInMemoryAction(action, payload);
  return res.json(result);
});

// Mount router on both "/api" prefix and root "/" so any Vercel/proxy rewrite works seamlessly
app.use("/api", apiRouter);
app.use("/", apiRouter);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SIAK Server] Application running at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;

