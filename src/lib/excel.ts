import * as XLSX from "xlsx";
import { Penduduk } from "../types";

export function exportPendudukToExcel(data: Penduduk[], fileName: string = "Data_Penduduk_SIAK") {
  const formattedData = data.map((item, index) => ({
    "No": index + 1,
    "Nama Lengkap": item.namaLengkap,
    "Nomor KK Induk": `'${item.nomorKKInduk}`, // prefix single quote to keep leading zeros in Excel
    "NIK": `'${item.nik}`,
    "Jenis Kelamin": item.jenisKelamin,
    "Tempat Lahir": item.tempatLahir,
    "Tanggal Lahir": item.tanggalLahir,
    "Agama": item.agama,
    "Pendidikan": item.pendidikan,
    "Jenis Pekerjaan": item.jenisPekerjaan,
    "Gol Smt": item.golSmt,
    "Status Kawin": item.statusKawin,
    "Hubungan Keluarga": item.hubunganKeluarga,
    "Kewarganegaraan": item.kewarganegaraan,
    "Nama Ayah": item.namaAyah,
    "Nama Ibu": item.namaIbu,
    "Alamat": item.alamat,
    "RT": item.rt
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // No
    { wch: 28 },  // Nama
    { wch: 20 },  // KK
    { wch: 20 },  // NIK
    { wch: 15 },  // JK
    { wch: 18 },  // Tempat Lahir
    { wch: 14 },  // Tgl Lahir
    { wch: 12 },  // Agama
    { wch: 22 },  // Pendidikan
    { wch: 20 },  // Pekerjaan
    { wch: 10 },  // Gol Smt
    { wch: 15 },  // Status Kawin
    { wch: 18 },  // Hubungan Keluarga
    { wch: 14 },  // Kewarganegaraan
    { wch: 22 },  // Nama Ayah
    { wch: 22 },  // Nama Ibu
    { wch: 30 },  // Alamat
    { wch: 8 }    // RT
  ];
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Penduduk");

  const todayStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${fileName}_${todayStr}.xlsx`);
}
