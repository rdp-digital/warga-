import { Penduduk, LogAudit, ConfigStatus } from "../types";

const TOKEN_KEY = "siak_admin_token";

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export async function saveConfig(appsScriptUrl: string, apiSecret: string): Promise<{ success: boolean; message?: string; rowCount?: number; data?: Penduduk[]; logs?: LogAudit[] }> {
  const token = getStoredToken();
  if (!token) return { success: false, message: "Sesi tidak valid. Silakan login." };

  try {
    const res = await fetch("/api/save-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ appsScriptUrl, apiSecret })
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal menyimpan konfigurasi" };
  }
}

export async function seedSpreadsheetData(): Promise<{ success: boolean; message?: string }> {
  const token = getStoredToken();
  if (!token) return { success: false, message: "Sesi tidak valid" };

  try {
    const res = await fetch("/api/seed-spreadsheet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      }
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal memproses data sampel" };
  }
}

export async function checkConfigStatus(): Promise<ConfigStatus> {
  try {
    const res = await fetch("/api/config-status");
    if (!res.ok) throw new Error("Failed to fetch config status");
    return await res.json();
  } catch (e) {
    return {
      hasAppsScriptUrl: false,
      appsScriptUrl: "",
      spreadsheetId: "13eznYlqXwNjl653uR9dxVCr-yadAvAR5ysgeVlf2D5k",
      usingDemoMode: true
    };
  }
}

const HARDCODED_PASSWORDS = ["Indrasta14", "admin123"];

export function createClientFallbackToken(): string {
  const payload = btoa(JSON.stringify({
    role: "Petugas SIAK",
    user: "Administrator",
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000
  }));
  return `client.${payload}`;
}

export async function loginAdmin(password: string): Promise<{ success: boolean; token?: string; message?: string }> {
  const inputPwd = (password || "").toString().trim();

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: inputPwd })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.token) {
        setStoredToken(data.token);
        return data;
      }
    }
  } catch (err) {
    // If backend serverless is unreachable (e.g. static CDN or network issue), evaluate hardcoded fallback
  }

  // Robust Client-Side Fallback: If password matches hardcoded password
  if (HARDCODED_PASSWORDS.includes(inputPwd)) {
    const token = createClientFallbackToken();
    setStoredToken(token);
    return {
      success: true,
      token,
      message: "Login Berhasil"
    };
  }

  return { success: false, message: "Password Admin tidak sesuai. Silakan coba lagi." };
}

export async function logoutAdmin(): Promise<void> {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
    } catch (e) {}
  }
  clearStoredToken();
}

export async function verifySession(): Promise<boolean> {
  const token = getStoredToken();
  if (!token) return false;

  if (token.startsWith("client.")) {
    try {
      const payloadStr = atob(token.replace("client.", ""));
      const payload = JSON.parse(payloadStr);
      if (payload.exp && Date.now() > payload.exp) {
        clearStoredToken();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  try {
    const res = await fetch("/api/session", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // If server returned 401 or not found, check if it's a valid JWT format
      return token.split(".").length === 2;
    }
    const data = await res.json();
    return Boolean(data.success && data.active);
  } catch (e) {
    // Server is unreachable, treat stored token as active session
    return Boolean(token);
  }
}

async function callSiakApi(action: string, payload?: any): Promise<any> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Sesi tidak valid. Silakan login kembali.");
  }

  const res = await fetch("/api/siak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ action, payload })
  });

  if (res.status === 401) {
    clearStoredToken();
    throw new Error("Sesi telah berakhir. Silakan login kembali.");
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `API Error (${res.status})`);
  }
  return data;
}

export async function fetchAllData(forceRefresh = false): Promise<{ success: boolean; data: Penduduk[]; logs: LogAudit[]; usingDemoMode?: boolean; cached?: boolean; message?: string }> {
  try {
    const res = await callSiakApi("getAll", { refresh: forceRefresh });
    return {
      success: res.success !== false,
      data: res.data || [],
      logs: res.logs || [],
      usingDemoMode: res.usingDemoMode,
      cached: res.cached,
      message: res.message
    };
  } catch (err: any) {
    return {
      success: false,
      data: [],
      logs: [],
      message: err?.message || "Gagal mengambil data kependudukan"
    };
  }
}

export async function createPenduduk(penduduk: Partial<Penduduk>): Promise<{ success: boolean; message?: string; data?: Penduduk; usingDemoMode?: boolean }> {
  try {
    const res = await callSiakApi("create", penduduk);
    return res;
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal menyimpan data penduduk" };
  }
}

export async function updatePenduduk(penduduk: Partial<Penduduk>): Promise<{ success: boolean; message?: string; data?: Penduduk; usingDemoMode?: boolean }> {
  try {
    const res = await callSiakApi("update", penduduk);
    return res;
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal memperbarui data penduduk" };
  }
}

export async function deletePenduduk(nik: string): Promise<{ success: boolean; message?: string; usingDemoMode?: boolean }> {
  try {
    const res = await callSiakApi("delete", { nik });
    return res;
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal menghapus data penduduk" };
  }
}

export async function batchUpdateBirthDates(updates: { nik: string; tanggalLahir: string }[]): Promise<{ success: boolean; message?: string; updatedCount?: number; usingDemoMode?: boolean }> {
  try {
    if (!updates || updates.length === 0) {
      return { success: true, message: "Tidak ada data tanggal yang perlu diperbarui", updatedCount: 0 };
    }

    // If payload is reasonably sized (<= 1500 items), send in single request
    if (updates.length <= 1500) {
      const res = await callSiakApi("batchUpdateBirthDates", { updates });
      return res;
    }

    // For very large datasets (> 1500 records), split into chunks to ensure stability
    const CHUNK_SIZE = 1000;
    let totalUpdated = 0;
    let lastResponse: any = null;

    for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
      const chunk = updates.slice(i, i + CHUNK_SIZE);
      const res = await callSiakApi("batchUpdateBirthDates", { updates: chunk });
      if (!res.success) {
        throw new Error(res.message || `Gagal pada batch ke-${Math.floor(i / CHUNK_SIZE) + 1}`);
      }
      totalUpdated += (res.updatedCount !== undefined ? res.updatedCount : chunk.length);
      lastResponse = res;
    }

    return {
      success: true,
      message: `Berhasil menormalisasi ${totalUpdated} tanggal lahir penduduk`,
      updatedCount: totalUpdated,
      usingDemoMode: lastResponse?.usingDemoMode
    };
  } catch (err: any) {
    return { success: false, message: err?.message || "Gagal memperbarui format tanggal lahir secara massal" };
  }
}

export async function fetchAuditLogs(): Promise<{ success: boolean; data: LogAudit[]; message?: string }> {
  try {
    const res = await callSiakApi("getLogs");
    return { success: true, data: res.data || [] };
  } catch (err: any) {
    return { success: false, data: [], message: err?.message };
  }
}
