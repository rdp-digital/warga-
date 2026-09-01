/**
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

// CONFIGURATION
var SPREADSHEET_ID = ""; // Kosongkan agar otomatis menggunakan Google Sheet aktif atau membuat otomatis di Drive Anda
var SHEET_PENDUDUK_NAME = "Penduduk";
var SHEET_LOG_NAME = "Log";
var DEFAULT_API_SECRET = "SIAK_SECRET_KEY_2026";

var HEADERS = [
  "Nama Lengkap",
  "Nomor KK Induk",
  "NIK",
  "Jenis Kelamin",
  "Tempat Lahir",
  "Tanggal Lahir",
  "Agama",
  "Pendidikan",
  "Jenis Pekerjaan",
  "Gol Smt",
  "Status Kawin",
  "Hubungan Keluarga",
  "Kewarganegaraan",
  "Nama Ayah",
  "Nama Ibu",
  "Alamat",
  "RT"
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
    // Check if headers exist
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

    if (action === "ping") {
      return respondJSON({ success: true, message: "Pone success" });
    } else if (action === "getAll") {
      return handleGetAll(sheet, ss);
    } else if (action === "create") {
      return handleCreate(sheet, ss, payload);
    } else if (action === "update") {
      return handleUpdate(sheet, ss, payload);
    } else if (action === "delete") {
      return handleDelete(sheet, ss, payload);
    } else if (action === "getStats") {
      return handleGetStats(sheet);
    } else if (action === "getLogs") {
      return handleGetLogs(ss);
    } else if (action === "batchUpdateBirthDates") {
      return handleBatchUpdateBirthDates(sheet, ss, payload);
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
    if (!row[2]) continue; // NIK empty
    list.push(rowToPenduduk(row));
  }

  return respondJSON({
    success: true,
    data: list,
    logs: getLogsData(ss)
  });
}

function rowToPenduduk(row) {
  return {
    namaLengkap: String(row[0] || ""),
    nomorKKInduk: String(row[1] || ""),
    nik: String(row[2] || ""),
    jenisKelamin: String(row[3] || ""),
    tempatLahir: String(row[4] || ""),
    tanggalLahir: formatDateValue(row[5]),
    agama: String(row[6] || ""),
    pendidikan: String(row[7] || ""),
    jenisPekerjaan: String(row[8] || ""),
    golSmt: String(row[9] || ""),
    statusKawin: String(row[10] || ""),
    hubunganKeluarga: String(row[11] || ""),
    kewarganegaraan: String(row[12] || ""),
    namaAyah: String(row[13] || ""),
    namaIbu: String(row[14] || ""),
    alamat: String(row[15] || ""),
    rt: String(row[16] || "")
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
  if (!p.nik || !/^\d{16}$/.test(p.nik.trim())) return "NIK harus persis 16 digit angka";
  if (!p.nomorKKInduk || !/^\d{16}$/.test(p.nomorKKInduk.trim())) return "Nomor KK Induk harus persis 16 digit angka";
  if (!p.tanggalLahir || p.tanggalLahir.trim() === "") return "Tanggal Lahir wajib diisi";

  // Check NIK uniqueness on Create
  if (isCreate) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]).trim() === p.nik.trim()) {
        return "NIK '" + p.nik + "' sudah terdaftar dalam sistem (Duplikasi NIK)";
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
  if (error) {
    return respondJSON({ success: false, message: error });
  }

  var newRow = [
    payload.namaLengkap.trim(),
    payload.nomorKKInduk.trim(),
    payload.nik.trim(),
    payload.jenisKelamin || "",
    payload.tempatLahir || "",
    payload.tanggalLahir || "",
    payload.agama || "",
    payload.pendidikan || "",
    payload.jenisPekerjaan || "",
    payload.golSmt || "",
    payload.statusKawin || "",
    payload.hubunganKeluarga || "",
    payload.kewarganegaraan || "WNI",
    payload.namaAyah || "",
    payload.namaIbu || "",
    payload.alamat || "",
    payload.rt || ""
  ];

  var targetRow = getNextFilledRowIndex(sheet);
  sheet.getRange(targetRow, 1, 1, newRow.length).setValues([newRow]);
  writeLog(ss, "TAMBAH", payload.nik.trim(), "Pendaftaran data penduduk baru: " + payload.namaLengkap + " (KK: " + payload.nomorKKInduk + ")");

  return respondJSON({
    success: true,
    message: "Data penduduk berhasil ditambahkan",
    data: rowToPenduduk(newRow)
  });
}

function handleUpdate(sheet, ss, payload) {
  var targetNik = String(payload.nik || "").trim();
  if (!targetNik) {
    return respondJSON({ success: false, message: "NIK wajib diisi" });
  }

  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;
  var existingRow = null;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).trim() === targetNik) {
      rowIndex = i + 1; // 1-indexed in sheet
      existingRow = data[i];
      break;
    }
  }

  if (rowIndex === -1 || !existingRow) {
    return respondJSON({ success: false, message: "Penduduk dengan NIK " + targetNik + " tidak ditemukan" });
  }

  var updatedRow = [
    payload.namaLengkap !== undefined ? String(payload.namaLengkap).trim() : String(existingRow[0] || ""),
    payload.nomorKKInduk !== undefined ? String(payload.nomorKKInduk).trim() : String(existingRow[1] || ""),
    targetNik,
    payload.jenisKelamin !== undefined ? payload.jenisKelamin : String(existingRow[3] || ""),
    payload.tempatLahir !== undefined ? payload.tempatLahir : String(existingRow[4] || ""),
    payload.tanggalLahir !== undefined ? payload.tanggalLahir : String(existingRow[5] || ""),
    payload.agama !== undefined ? payload.agama : String(existingRow[6] || ""),
    payload.pendidikan !== undefined ? payload.pendidikan : String(existingRow[7] || ""),
    payload.jenisPekerjaan !== undefined ? payload.jenisPekerjaan : String(existingRow[8] || ""),
    payload.golSmt !== undefined ? payload.golSmt : String(existingRow[9] || ""),
    payload.statusKawin !== undefined ? payload.statusKawin : String(existingRow[10] || ""),
    payload.hubunganKeluarga !== undefined ? payload.hubunganKeluarga : String(existingRow[11] || ""),
    payload.kewarganegaraan !== undefined ? payload.kewarganegaraan : String(existingRow[12] || "WNI"),
    payload.namaAyah !== undefined ? payload.namaAyah : String(existingRow[13] || ""),
    payload.namaIbu !== undefined ? payload.namaIbu : String(existingRow[14] || ""),
    payload.alamat !== undefined ? payload.alamat : String(existingRow[15] || ""),
    payload.rt !== undefined ? payload.rt : String(existingRow[16] || "")
  ];

  sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
  writeLog(ss, "UBAH", targetNik, "Perubahan data penduduk: " + updatedRow[0]);

  return respondJSON({
    success: true,
    message: "Data penduduk berhasil diperbarui",
    data: rowToPenduduk(updatedRow)
  });
}

function handleBatchUpdateBirthDates(sheet, ss, payload) {
  var updates = payload.updates || [];
  if (!updates.length) {
    return respondJSON({ success: false, message: "Daftar pembaruan tanggal lahir kosong" });
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return respondJSON({ success: false, message: "Spreadsheet kosong" });
  }

  var updateMap = {};
  for (var j = 0; j < updates.length; j++) {
    var u = updates[j];
    if (u && u.nik) {
      updateMap[String(u.nik).trim()] = String(u.tanggalLahir || "").trim();
    }
  }

  var count = 0;
  var dateColumnValues = [];
  for (var i = 1; i < data.length; i++) {
    var nik = String(data[i][2]).trim();
    var existingDate = String(data[i][5] || "");
    if (updateMap[nik] !== undefined && updateMap[nik] !== "") {
      dateColumnValues.push([updateMap[nik]]);
      count++;
    } else {
      dateColumnValues.push([existingDate]);
    }
  }

  if (dateColumnValues.length > 0) {
    var dateRange = sheet.getRange(2, 6, dateColumnValues.length, 1);
    dateRange.setNumberFormat("@"); // Set column format as Plain Text so DD/MM/YYYY is preserved exactly
    dateRange.setValues(dateColumnValues);
  }

  writeLog(ss, "UBAH", "BATCH_DATE", "Normalisasi format tanggal lahir untuk " + count + " penduduk");

  return respondJSON({
    success: true,
    message: "Berhasil menormalisasi " + count + " tanggal lahir di Google Spreadsheet",
    updatedCount: count
  });
}

function handleDelete(sheet, ss, payload) {
  var targetNik = String(payload.nik || "").trim();
  if (!targetNik) {
    return respondJSON({ success: false, message: "NIK wajib diberikan untuk menghapus" });
  }

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

  if (rowIndex === -1) {
    return respondJSON({ success: false, message: "Data dengan NIK " + targetNik + " tidak ditemukan" });
  }

  sheet.deleteRow(rowIndex);
  writeLog(ss, "HAPUS", targetNik, "Menghapus data penduduk: " + nama);

  return respondJSON({
    success: true,
    message: "Data penduduk " + nama + " (NIK: " + targetNik + ") berhasil dihapus"
  });
}

function getLogsData(ss) {
  try {
    var logSheet = ss.getSheetByName(SHEET_LOG_NAME);
    if (!logSheet) return [];
    var data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    var logs = [];
    for (var i = data.length - 1; i >= 1; i--) { // latest first
      logs.push({
        waktu: formatDateValue(data[i][0]),
        aksi: String(data[i][1] || ""),
        nikTerkait: String(data[i][2] || ""),
        detailPerubahan: String(data[i][3] || "")
      });
      if (logs.length >= 100) break; // max 100 recent logs
    }
    return logs;
  } catch (e) {
    return [];
  }
}

function handleGetLogs(ss) {
  return respondJSON({
    success: true,
    data: getLogsData(ss)
  });
}

function handleSeedDemoData(sheet, ss) {
  var data = sheet.getDataRange().getValues();
  if (data.length > 1) {
    return respondJSON({ success: true, message: "Data sudah ada, tidak perlu demo seed." });
  }

  var demoList = [
    ["Ir. Budi Santoso", "3174011203080001", "3174011505800001", "LAKI-LAKI", "Jakarta", "1980-05-15", "ISLAM", "STRATA I", "PNS", "O", "KAWIN", "KEPALA KELUARGA", "WNI", "Ahmad Santoso", "Siti Rahmah", "Jl. Mawar No. 12", "001"],
    ["Endang Rahayu", "3174011203080001", "3174015208820002", "PEREMPUAN", "Bandung", "1982-08-12", "ISLAM", "SLTA / SEDERAJAT", "WIRASWASTA", "A", "KAWIN", "ISTRI", "WNI", "Bambang S", "Yulia", "Jl. Mawar No. 12", "001"],
    ["Rizky Pratama Santoso", "3174011203080001", "3174011010080003", "LAKI-LAKI", "Jakarta", "2008-10-10", "ISLAM", "SLTP/SEDERAJAT", "PELAJAR/MAHASISWA", "B", "BELUM KAWIN", "ANAK", "WNI", "Budi Santoso", "Endang Rahayu", "Jl. Mawar No. 12", "001"],
    ["Dr. Hendra Wijaya", "3174012004100002", "3174012201750001", "LAKI-LAKI", "Surabaya", "1975-01-22", "KRISTEN", "STRATA II", "DOKTER", "AB", "KAWIN", "KEPALA KELUARGA", "WNI", "Yohanes W", "Maria W", "Jl. Melati No. 45", "002"],
    ["Clara Christiani", "3174012004100002", "3174016503780002", "PEREMPUAN", "Semarang", "1978-03-25", "KRISTEN", "STRATA I", "GURU", "O", "KAWIN", "ISTRI", "WNI", "Paulus K", "Elisabeth", "Jl. Melati No. 45", "002"],
    ["Gabriel Wijaya", "3174012004100002", "3174011411120003", "LAKI-LAKI", "Jakarta", "2012-11-14", "KRISTEN", "TAMAT SD / SEDERAJAT", "PELAJAR/MAHASISWA", "O", "BELUM KAWIN", "ANAK", "WNI", "Hendra Wijaya", "Clara Christiani", "Jl. Melati No. 45", "002"],
    ["Wayan Sudiarta", "3174010506150003", "3174010804880001", "LAKI-LAKI", "Denpasar", "1988-04-08", "HINDU", "STRATA I", "KARYAWAN SWASTA", "A", "KAWIN", "KEPALA KELUARGA", "WNI", "Made Sudi", "Ketut Asri", "Jl. Anggrek No. 88", "003"],
    ["Ni Made Ratna", "3174010506150003", "3174014909900002", "PEREMPUAN", "Singaraja", "1990-09-09", "HINDU", "SLTA / SEDERAJAT", "IBU RUMAH TANGGA", "B", "KAWIN", "ISTRI", "WNI", "Nyoman B", "Ni Wayan C", "Jl. Anggrek No. 88", "003"]
  ];

  for (var i = 0; i < demoList.length; i++) {
    sheet.appendRow(demoList[i]);
  }

  writeLog(ss, "SEED", "SYSTEM", "Inisialisasi sampel data kependudukan awal SIAK");
  return respondJSON({ success: true, message: "Seed data berhasil ditambahkan" });
}

function respondJSON(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
