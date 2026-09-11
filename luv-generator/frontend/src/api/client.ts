const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

export class ApiClientError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });

  if (!res.ok) {
    let message = "Ein Fehler ist aufgetreten.";
    let code = "unknown_error";
    try {
      const body = await res.json();
      message = body?.error?.message || message;
      code = body?.error?.code || code;
    } catch {
      // Antwort war kein JSON (z.B. Netzwerkfehler) - Standardmeldung verwenden.
    }
    throw new ApiClientError(res.status, code, message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined })
};

export async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new ApiClientError(res.status, "fetch_text_failed", "Text konnte nicht geladen werden.");
  return res.text();
}

export async function downloadDocx(caseId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/cases/${caseId}/export/docx`);
  if (!res.ok) {
    let message = "Export fehlgeschlagen.";
    try {
      const body = await res.json();
      message = body?.error?.message || message;
    } catch {
      // ignore
    }
    throw new ApiClientError(res.status, "export_failed", message);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `LUV_TESTSYSTEM_${caseId}.docx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export { API_BASE };
