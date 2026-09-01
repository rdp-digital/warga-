import { SuratRecord, VillageProfile, JenisSuratId } from "../types";
import { generateNomorSurat, getTemplateById } from "./suratTemplates";

const STORAGE_KEY_SURAT = "siak_desa_surat_records_v1";
const STORAGE_KEY_COUNTER = "siak_desa_surat_counter_v1";

export function loadSuratRecords(): SuratRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SURAT);
    if (!raw) {
      // Return empty array initially or initial seed
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load surat records from localStorage:", err);
    return [];
  }
}

export function saveSuratRecord(record: SuratRecord): SuratRecord[] {
  const current = loadSuratRecords();
  const index = current.findIndex((r) => r.id === record.id);
  let updated: SuratRecord[];

  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    updated = [record, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY_SURAT, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save surat record:", err);
  }

  return updated;
}

export function deleteSuratRecord(id: string): SuratRecord[] {
  const current = loadSuratRecords();
  const updated = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_SURAT, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete surat record:", err);
  }
  return updated;
}

export function getNextSuratCounter(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COUNTER);
    const num = raw ? parseInt(raw, 10) : 1;
    return isNaN(num) || num <= 0 ? 1 : num;
  } catch {
    return 1;
  }
}

export function incrementSuratCounter(): number {
  const next = getNextSuratCounter() + 1;
  try {
    localStorage.setItem(STORAGE_KEY_COUNTER, String(next));
  } catch (err) {
    console.error("Failed to increment surat counter:", err);
  }
  return next;
}

export function setSuratCounter(val: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_COUNTER, String(Math.max(1, val)));
  } catch (err) {
    console.error("Failed to set surat counter:", err);
  }
}
