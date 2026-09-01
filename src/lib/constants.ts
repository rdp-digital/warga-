export const JENIS_KELAMIN_OPTIONS = [
  "LAKI-LAKI",
  "PEREMPUAN"
];

export const AGAMA_OPTIONS = [
  "ISLAM",
  "KRISTEN",
  "KATOLIK",
  "HINDU",
  "BUDDHA",
  "KHONGHUCU",
  "LAINNYA"
];

export function normalizeAgama(raw?: string): string {
  if (!raw) return "ISLAM";
  const str = raw.toString().replace(/\u00A0/g, " ").trim().toUpperCase().replace(/\s+/g, " ");
  if (!str || str === "-" || str === "N/A" || str === "NULL") return "ISLAM";

  if (str.includes("ISLAM")) return "ISLAM";
  if (str.includes("KRISTEN") || str.includes("PROTESTAN")) return "KRISTEN";
  if (str.includes("KATOLIK") || str.includes("KATHOLIK") || str.includes("CATHOLIC")) return "KATOLIK";
  if (str.includes("HINDU")) return "HINDU";
  if (str.includes("BUDDHA") || str.includes("BUDHA")) return "BUDDHA";
  if (str.includes("KHONGHUCU") || str.includes("KONGHUCU")) return "KHONGHUCU";

  return str;
}

export const STATUS_KAWIN_OPTIONS = [
  "BELUM KAWIN",
  "KAWIN TERCATAT",
  "KAWIN BELUM TERCATAT",
  "KAWIN",
  "CERAI HIDUP",
  "CERAI MATI"
];

export function normalizeStatusKawin(raw?: string): string {
  if (!raw) return "BELUM KAWIN";
  const str = raw.toString().trim().toUpperCase().replace(/\s+/g, " ");
  if (!str || str === "-" || str === "N/A" || str === "NULL") return "BELUM KAWIN";

  if (str === "BELUM KAWIN" || str.includes("BELUM KAWIN")) return "BELUM KAWIN";
  if (str === "KAWIN TERCATAT" || str.includes("KAWIN TERCATAT")) return "KAWIN TERCATAT";
  if (str === "KAWIN BELUM TERCATAT" || str.includes("KAWIN BELUM TERCATAT")) return "KAWIN BELUM TERCATAT";
  if (str === "KAWIN") return "KAWIN";
  if (str === "CERAI MATI" || str.includes("CERAI MATI")) return "CERAI MATI";
  if (str === "CERAI HIDUP" || str.includes("CERAI HIDUP") || str.includes("CERAI TERCATAT") || str.includes("CERAI BELUM TERCATAT")) return "CERAI HIDUP";

  return str;
}

export const HUBUNGAN_KELUARGA_OPTIONS = [
  "KEPALA KELUARGA",
  "SUAMI",
  "ISTRI",
  "ANAK",
  "MENANTU",
  "CUCU",
  "ORANG TUA",
  "MERTUA",
  "FAMILI LAIN",
  "PEMBANTU",
  "LAINNYA"
];

export const KEWARGANEGARAAN_OPTIONS = [
  "WNI",
  "WNA"
];

export const GOL_DARAH_OPTIONS = [
  "A",
  "B",
  "AB",
  "O",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "TIDAK TAHU"
];

export const PENDIDIKAN_OPTIONS = [
  "TIDAK / BELUM SEKOLAH",
  "BELUM TAMAT SD/SEDERAJAT",
  "TAMAT SD / SEDERAJAT",
  "SLTP/SEDERAJAT",
  "SLTA / SEDERAJAT",
  "DIPLOMA I / II",
  "AKADEMI/ DIPLOMA III/S. MUDA",
  "DIPLOMA IV/ STRATA I",
  "STRATA II",
  "STRATA III"
];

export const RT_OPTIONS = [
  "001/001",
  "002/001",
  "004/001",
  "005/001",
  "006/002",
  "007/002",
  "008/003",
  "009/003",
  "010/004",
  "011/004",
  "012/005",
  "013/005",
  "014/005",
  "015/005",
  "016/006",
  "017/006",
  "018/006",
  "019/006",
  "020/006",
  "021/006",
  "022/007",
  "023/007",
  "024/007",
  "025/007",
  "026/007",
  "027/008",
  "028/008",
  "029/008",
  "030/008",
  "031/008",
  "032/009",
  "033/009",
  "034/009"
];

export const APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT - SIAK BACKEND (Google Sheets Database)
 * ============================================================================
 * SPREADSHEET ID: 13eznYlqXwNjl653uR9dxVCr-yadAvAR5ysgeVlf2D5k
 *
 * INSTRUKSI DEPLOYMENT:
 * 1. Buka Spreadsheet di Google Sheets (ID: 13eznYlqXwNjl653uR9dxVCr-yadAvAR5ysgeVlf2D5k)
 * 2. Klik menu Extensi (Extensions) > Apps Script
 * 3. Hapus semua kode default dan tempelkan SELURUH kode di bawah ini ke file Code.gs
 * 4. Ubah variabel API_SECRET di bawah jika diperlukan (sesuaikan dengan API_SECRET di file .env frontend)
 * 5. Klik 'Deploy' > 'New deployment'
 * 6. Pilih tipe: 'Web app'
 * 7. Isikan Description: SIAK Web App API
 * 8. Execute as: 'Me' (Pemilik Spreadsheet)
 * 9. Who has access: 'Anyone' (Siapa saja)
 * 10. Klik 'Deploy', lalu salin Web App URL (berakhiran /exec) dan masukkan ke APPS_SCRIPT_URL di .env frontend.
 * ============================================================================
 */

var SPREADSHEET_ID = ""; // Kosongkan agar otomatis menggunakan Google Sheet tempat Apps Script dipasang
var SHEET_PENDUDUK_NAME = "Penduduk";
var SHEET_LOG_NAME = "Log";
var DEFAULT_API_SECRET = "SIAK_SECRET_KEY_2026";

var HEADERS = [
  "Nama Lengkap", "Nomor KK Induk", "NIK", "Jenis Kelamin", "Tempat Lahir",
  "Tanggal Lahir", "Agama", "Pendidikan", "Jenis Pekerjaan", "Gol Smt",
  "Status Kawin", "Hubungan Keluarga", "Kewarganegaraan", "Nama Ayah",
  "Nama Ibu", "Alamat", "RT"
];

var LOG_HEADERS = ["Waktu", "Aksi", "NIK Terkait", "Detail Perubahan"];

function getSpreadsheet() {
  var ss = null;

  // 1. Try active spreadsheet (if script is opened directly from Google Sheets via Extensions > Apps Script)
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  // 2. Try previously auto-created Spreadsheet ID saved in Script Properties
  try {
    var savedId = PropertiesService.getScriptProperties().getProperty("AUTO_SPREADSHEET_ID");
    if (savedId) {
      ss = SpreadsheetApp.openById(savedId);
      if (ss) return ss;
    }
  } catch (e) {}

  // 3. Try configured SPREADSHEET_ID
  if (typeof SPREADSHEET_ID !== "undefined" && SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
      if (ss) return ss;
    } catch (e) {}
  }

  // 4. Fallback: Automatically create a new Google Sheet in the user's Google Drive
  try {
    ss = SpreadsheetApp.create("DATABASE_SIAK_DESA_PONCOL");
    if (ss) {
      PropertiesService.getScriptProperties().setProperty("AUTO_SPREADSHEET_ID", ss.getId());
      return ss;
    }
  } catch (e) {}

  throw new Error("Gagal membuka Spreadsheet. Pastikan Google Apps Script memiliki izin untuk mengakses Google Drive & Sheets.");
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
  } else {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#e2e8f0");
    }
  }
  return sheet;
}

function verifySecret(receivedSecret) {
  var scriptSecret = PropertiesService.getScriptProperties().getProperty("API_SECRET");
  if (!scriptSecret) {
    scriptSecret = DEFAULT_API_SECRET;
  }
  return receivedSecret === scriptSecret;
}

function writeLog(ss, aksi, nikTerkait, detail) {
  try {
    var logSheet = getOrCreateSheet(ss, SHEET_LOG_NAME, LOG_HEADERS);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    logSheet.appendRow([timestamp, aksi, String(nikTerkait || ""), String(detail || "")]);
  } catch (e) {
    Logger.log("Failed to write log: " + e.toString());
  }
}

function doGet(e) {
  return respondJSON({
    status: "ok",
    message: "SIAK API Google Apps Script Running Successfully",
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respondJSON({ success: false, message: "Payload kosong" });
    }

    var requestData = JSON.parse(e.postData.contents);
    var secret = requestData.secret || requestData.API_SECRET;
    
    if (!verifySecret(secret)) {
      return respondJSON({ success: false, message: "Akses Ditolak: API_SECRET tidak valid" });
    }

    var action = requestData.action;
    var payload = requestData.payload || {};
    var ss = getSpreadsheet();
    var sheet = getOrCreateSheet(ss, SHEET_PENDUDUK_NAME, HEADERS);

    if (action === "getAll") {
      return handleGetAll(sheet, ss);
    } else if (action === "create") {
      return handleCreate(sheet, ss, payload);
    } else if (action === "update") {
      return handleUpdate(sheet, ss, payload);
    } else if (action === "delete") {
      return handleDelete(sheet, ss, payload);
    } else if (action === "getLogs") {
      return handleGetLogs(ss);
    } else if (action === "seedDemoData") {
      return handleSeedDemoData(sheet, ss);
    } else {
      return respondJSON({ success: false, message: "Aksi '" + action + "' tidak dikenali" });
    }

  } catch (err) {
    return respondJSON({ success: false, message: "Server Error: " + err.toString() });
  }
}

function handleGetAll(sheet, ss) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return respondJSON({ success: true, data: [], logs: getLogsData(ss) });
  }

  var list = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[2]) continue;
    list.push(rowToPenduduk(row));
  }

  return respondJSON({
    success: true,
    data: list,
    logs: getLogsData(ss)
  });
}

function rowToPenduduk(row) {
  var rawStatus = String(row[10] || "").trim();
  if (rawStatus === "-" || !rawStatus) rawStatus = "BELUM KAWIN";
  return {
    namaLengkap: String(row[0] || "").trim(),
    nomorKKInduk: String(row[1] || "").trim(),
    nik: String(row[2] || "").trim(),
    jenisKelamin: String(row[3] || "").trim(),
    tempatLahir: String(row[4] || "").trim(),
    tanggalLahir: formatDateValue(row[5]),
    agama: String(row[6] || "").trim(),
    pendidikan: String(row[7] || "").trim(),
    jenisPekerjaan: String(row[8] || "").trim(),
    golSmt: String(row[9] || "").trim(),
    statusKawin: rawStatus,
    hubunganKeluarga: String(row[11] || "").trim(),
    kewarganegaraan: String(row[12] || "").trim(),
    namaAyah: String(row[13] || "").trim(),
    namaIbu: String(row[14] || "").trim(),
    alamat: String(row[15] || "").trim(),
    rt: String(row[16] || "").trim()
  };
}

function formatDateValue(val) {
  if (!val) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd");
  }
  return String(val);
}

function validatePenduduk(p, isCreate, sheet) {
  if (!p.namaLengkap || p.namaLengkap.trim() === "") return "Nama Lengkap wajib diisi";
  if (!p.nik || !/^\\d{16}$/.test(p.nik.trim())) return "NIK harus persis 16 digit angka";
  if (!p.nomorKKInduk || !/^\\d{16}$/.test(p.nomorKKInduk.trim())) return "Nomor KK Induk harus persis 16 digit angka";
  if (!p.tanggalLahir || p.tanggalLahir.trim() === "") return "Tanggal Lahir wajib diisi";

  if (isCreate) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim() === p.nik.trim()) {
        return "NIK '" + p.nik + "' sudah terdaftar dalam sistem";
      }
    }
  }
  return null;
}

function getNextFilledRowIndex(sheet) {
  var data = sheet.getDataRange().getValues();
  var lastFilledRow = 1; // Baris 1 adalah Header
  for (var i = 1; i < data.length; i++) {
    var nama = String(data[i][0] || "").trim();
    var nik = String(data[i][2] || "").trim();
    if (nama !== "" || nik !== "") {
      lastFilledRow = i + 1; // Konversi ke baris 1-indexed Google Sheets
    }
  }
  return lastFilledRow + 1;
}

function handleCreate(sheet, ss, payload) {
  var error = validatePenduduk(payload, true, sheet);
  if (error) return respondJSON({ success: false, message: error });

  var newRow = [
    payload.namaLengkap.trim(), payload.nomorKKInduk.trim(), payload.nik.trim(),
    payload.jenisKelamin || "", payload.tempatLahir || "", payload.tanggalLahir || "",
    payload.agama || "", payload.pendidikan || "", payload.jenisPekerjaan || "",
    payload.golSmt || "", payload.statusKawin || "", payload.hubunganKeluarga || "",
    payload.kewarganegaraan || "WNI", payload.namaAyah || "", payload.namaIbu || "",
    payload.alamat || "", payload.rt || ""
  ];

  var targetRow = getNextFilledRowIndex(sheet);
  sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
  writeLog(ss, "TAMBAH", payload.nik.trim(), "Pendaftaran data penduduk baru: " + payload.namaLengkap);

  return respondJSON({ success: true, message: "Data berhasil disimpan", data: rowToPenduduk(newRow) });
}

function handleUpdate(sheet, ss, payload) {
  var error = validatePenduduk(payload, false, sheet);
  if (error) return respondJSON({ success: false, message: error });

  var targetNik = payload.nik.trim();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === targetNik) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return respondJSON({ success: false, message: "NIK " + targetNik + " tidak ditemukan" });

  var updatedRow = [
    payload.namaLengkap.trim(), payload.nomorKKInduk.trim(), payload.nik.trim(),
    payload.jenisKelamin || "", payload.tempatLahir || "", payload.tanggalLahir || "",
    payload.agama || "", payload.pendidikan || "", payload.jenisPekerjaan || "",
    payload.golSmt || "", payload.statusKawin || "", payload.hubunganKeluarga || "",
    payload.kewarganegaraan || "WNI", payload.namaAyah || "", payload.namaIbu || "",
    payload.alamat || "", payload.rt || ""
  ];

  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  writeLog(ss, "UBAH", targetNik, "Perubahan data penduduk: " + payload.namaLengkap);

  return respondJSON({ success: true, message: "Data berhasil diperbarui", data: rowToPenduduk(updatedRow) });
}

function handleDelete(sheet, ss, payload) {
  var targetNik = String(payload.nik || "").trim();
  if (!targetNik) return respondJSON({ success: false, message: "NIK wajib disertakan" });

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var nama = "";

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === targetNik) {
      rowIndex = i + 1;
      nama = String(data[i][0]);
      break;
    }
  }

  if (rowIndex === -1) return respondJSON({ success: false, message: "NIK " + targetNik + " tidak ditemukan" });

  sheet.deleteRow(rowIndex);
  writeLog(ss, "HAPUS", targetNik, "Menghapus data penduduk: " + nama);

  return respondJSON({ success: true, message: "Data penduduk " + nama + " berhasil dihapus" });
}

function getLogsData(ss) {
  try {
    var logSheet = ss.getSheetByName(SHEET_LOG_NAME);
    if (!logSheet) return [];
    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var logs = [];
    for (var i = data.length - 1; i >= 1; i--) {
      logs.push({
        waktu: formatDateValue(data[i][0]),
        aksi: String(data[i][1] || ""),
        nikTerkait: String(data[i][2] || ""),
        detailPerubahan: String(data[i][3] || "")
      });
      if (logs.length >= 100) break;
    }
    return logs;
  } catch (e) { return []; }
}

function handleGetLogs(ss) {
  return respondJSON({ success: true, data: getLogsData(ss) });
}

function respondJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;
