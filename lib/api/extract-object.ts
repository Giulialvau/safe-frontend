function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Normalizza risposte POST/PATCH Nest (`{ data: T }`, doppio wrapper, oggetto diretto, array[0]).
 */
export function extractObject<T extends Record<string, unknown>>(
  raw: unknown
): T | null {
  let cur: unknown = raw;
  for (let i = 0; i < 4; i++) {
    if (cur == null) return null;
    if (Array.isArray(cur)) {
      const first = cur[0];
      return isRecord(first) ? (first as T) : null;
    }
    if (!isRecord(cur)) return null;
    if ("data" in cur && cur.data !== undefined) {
      cur = cur.data;
      continue;
    }
    return cur as T;
  }
  return isRecord(cur) ? (cur as T) : null;
}
