import { clearToken, getToken } from "@/lib/auth-storage";

function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (see .env.example) and restart the dev server.",
    );
  }
  return raw.replace(/\/$/, "");
}

export const API_BASE_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Messaggi NestJS: string | string[] | oggetto annidato */
function formatApiErrorMessage(parsed: unknown, fallback: string): string {
  if (typeof parsed !== "object" || parsed === null) {
    if (typeof parsed === "string" && parsed.trim()) return parsed;
    return fallback;
  }
  const m = (parsed as { message?: unknown }).message;
  if (typeof m === "string") return m;
  if (Array.isArray(m)) return m.filter((x) => typeof x === "string").join(", ");
  if (typeof m === "object" && m !== null && "message" in m) {
    const inner = (m as { message?: unknown }).message;
    if (typeof inner === "string") return inner;
    if (Array.isArray(inner))
      return inner.filter((x) => typeof x === "string").join(", ");
  }
  return fallback;
}

function errorMessageFallback(res: Response): string {
  const s = res.statusText?.trim();
  if (s) return `${res.status} ${s}`;
  return `HTTP ${res.status}`;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  skipAuth?: boolean;
};

function buildHeaders(init?: HeadersInit, jsonBody?: boolean): Headers {
  const h = new Headers(init);
  if (jsonBody && !h.has("Content-Type")) {
    h.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) {
    h.set("Authorization", `Bearer ${token}`);
  }
  return h;
}

/**
 * Legge sempre il body come testo. Prova JSON.parse senza mai lanciare.
 * — Content-Type con "json" → parse (anche numeri, stringhe, null).
 * — Altrimenti, se il testo (trim) inizia con { o [, prova parse.
 * — Se il parse fallisce o non si applica, si restituisce la stringa grezza.
 */
async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text === "") return null;

  const ct = res.headers.get("content-type") ?? "";
  const contentTypeSuggestsJson =
    /\bjson\b/i.test(ct) || /\+json/i.test(ct);

  const trimmed = text.trimStart();
  const looksLikeJsonObjectOrArray =
    trimmed.startsWith("{") || trimmed.startsWith("[");

  if (contentTypeSuggestsJson || looksLikeJsonObjectOrArray) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }

  return text;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth, ...rest } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  const isJson =
    body !== undefined &&
    body !== null &&
    typeof body === "object" &&
    !(body instanceof FormData);

  const headers = buildHeaders(rest.headers, isJson);
  if (body instanceof FormData) {
    headers.delete("Content-Type");
  }
  if (skipAuth) {
    headers.delete("Authorization");
  }

  let serializedBody: BodyInit | undefined;
  if (body === undefined || body === null) {
    serializedBody = undefined;
  } else if (isJson) {
    serializedBody = JSON.stringify(body);
  } else {
    serializedBody = body as BodyInit;
  }

  const init: RequestInit = {
    ...rest,
    headers,
    body: serializedBody,
  };

  const res = await fetch(url, init);
  const parsed = await parseResponseBody(res);

  if (!res.ok) {
    const fallback = errorMessageFallback(res);
    const msg = formatApiErrorMessage(parsed, fallback);
    if (res.status === 401) {
      clearToken();
    }
    throw new ApiError(msg, res.status, parsed);
  }

  return parsed as T;
}

export function apiGet<T>(path: string, init?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

/** Body risposta grezzo (oggetto o stringa); compatibile con extractObject. */
export function apiPost<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "POST", body });
}

export function apiPut<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "PUT", body });
}

/** Body risposta grezzo (oggetto o stringa); compatibile con extractObject. */
export function apiPatch<T = unknown>(
  path: string,
  body?: unknown,
  init?: RequestOptions
): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "PATCH", body });
}

export function apiDelete<T>(path: string, init?: RequestOptions): Promise<T> {
  return apiRequest<T>(path, { ...init, method: "DELETE" });
}

/** GET binario (es. PDF) con Authorization */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers();
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const parsed = await parseResponseBody(res);
    const fallback = errorMessageFallback(res);
    const msg = formatApiErrorMessage(parsed, fallback);
    if (res.status === 401) {
      clearToken();
    }
    throw new ApiError(msg, res.status, parsed);
  }
  return res.blob();
}

/** Estrae un array da risposte Nest `{ data: T[] }`, annidate o con `items`. */
function extractListArray(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object") return [];

  const o = raw as Record<string, unknown>;
  if ("items" in o && Array.isArray(o.items)) return o.items;

  if ("data" in o) {
    const d = o.data;
    if (Array.isArray(d)) return d;
    if (d !== null && typeof d === "object" && !Array.isArray(d)) {
      const inner = d as Record<string, unknown>;
      if (Array.isArray(inner.data)) return inner.data;
      if (Array.isArray(inner.items)) return inner.items;
    }
  }
  return [];
}

/** Normalizza risposte NestJS `{ data: T }`, array diretto, o `items`; non lancia. */
export function unwrapList<T>(raw: unknown): T[] {
  try {
    return extractListArray(raw) as T[];
  } catch {
    return [];
  }
}

export function unwrapOne<T>(raw: unknown): T | null {
  if (raw && typeof raw === "object" && "data" in raw) {
    return (raw as { data: T }).data;
  }
  return (raw as T) ?? null;
}
