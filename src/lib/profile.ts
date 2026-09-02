import { VillageProfile } from "../types";
import { fetchVillageProfileApi, saveVillageProfileApi } from "./api";

export const OFFICIAL_MAGETAN_LOGO = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Seal_of_Magetan_Regency.svg/500px-Seal_of_Magetan_Regency.svg.png";

export const DEFAULT_VILLAGE_PROFILE: VillageProfile = {
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
  logoUrl: OFFICIAL_MAGETAN_LOGO
};

const VILLAGE_PROFILE_KEY = "WARGA_PLUS_VILLAGE_PROFILE";

export function getVillageProfile(): VillageProfile {
  try {
    const saved = localStorage.getItem(VILLAGE_PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If the saved logo was accidentally the application screenshot logo, update to official village logo
      if (parsed.logoUrl && parsed.logoUrl.includes("Screenshot_2026-08-10_074401")) {
        parsed.logoUrl = OFFICIAL_MAGETAN_LOGO;
      }
      return { ...DEFAULT_VILLAGE_PROFILE, ...parsed };
    }
  } catch (e) {
    console.error("Error reading village profile from localStorage:", e);
  }
  return DEFAULT_VILLAGE_PROFILE;
}

export function saveVillageProfile(profile: VillageProfile): void {
  try {
    const cleanProfile = { ...profile };
    if (cleanProfile.logoUrl && cleanProfile.logoUrl.includes("Screenshot_2026-08-10_074401")) {
      cleanProfile.logoUrl = OFFICIAL_MAGETAN_LOGO;
    }
    localStorage.setItem(VILLAGE_PROFILE_KEY, JSON.stringify(cleanProfile));
    
    // Sync to Google Spreadsheet & Server in background
    syncProfileToServer(cleanProfile);
  } catch (e) {
    console.error("Error saving village profile:", e);
  }
}

export async function fetchServerVillageProfile(): Promise<VillageProfile | null> {
  try {
    const prof = await fetchVillageProfileApi();
    if (prof) {
      const cleanProf = { ...prof };
      if (cleanProf.logoUrl && cleanProf.logoUrl.includes("Screenshot_2026-08-10_074401")) {
        cleanProf.logoUrl = OFFICIAL_MAGETAN_LOGO;
      }
      localStorage.setItem(VILLAGE_PROFILE_KEY, JSON.stringify(cleanProf));
      return { ...DEFAULT_VILLAGE_PROFILE, ...cleanProf };
    }
  } catch (e) {
    console.warn("Could not fetch village profile from server/sheets:", e);
  }
  return null;
}

export async function syncProfileToServer(profile: VillageProfile): Promise<boolean> {
  try {
    const res = await saveVillageProfileApi(profile);
    return Boolean(res && res.success);
  } catch (e) {
    console.warn("Could not sync village profile to server/sheets:", e);
    return false;
  }
}

