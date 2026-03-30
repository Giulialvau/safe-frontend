import type { Materiale, TracciabilitaRecord } from "@/types";

export type MaterialeRef = {
  id: string;
  codice: string;
  descrizione: string;
  lotto: string;
};

export function materialeKeyFromRecord(r: TracciabilitaRecord): string {
  const mid = String(r.materialeId ?? r.materiale_id ?? "");
  if (mid) return mid;
  const m = r.materiale;
  return `${m?.codice ?? ""}|${m?.lotto ?? ""}` || "—";
}

export function lottoLabel(
  r: TracciabilitaRecord,
  mat?: { lotto?: string | null }
): string {
  const l = r.lotto ?? r.materiale?.lotto ?? mat?.lotto;
  return l != null && String(l).trim() !== "" ? String(l) : "—";
}

/** Raggruppa record per materiale (ID o fallback codice+lotto). */
export function groupTracciabilitaByMateriale(
  rows: TracciabilitaRecord[]
): Map<string, TracciabilitaRecord[]> {
  const map = new Map<string, TracciabilitaRecord[]>();
  for (const r of rows) {
    const k = materialeKeyFromRecord(r);
    const list = map.get(k) ?? [];
    list.push(r);
    map.set(k, list);
  }
  return map;
}

export function uniqueLottiFromMateriali(materiali: Materiale[]): string[] {
  const s = new Set<string>();
  for (const m of materiali) {
    const l = m.lotto;
    if (l != null && String(l).trim() !== "") s.add(String(l).trim());
  }
  return [...s].sort();
}

export function materialeRef(
  m: Materiale
): MaterialeRef & { id: string } {
  return {
    id: String(m.id),
    codice: String(m.codice ?? ""),
    descrizione: String(m.descrizione ?? ""),
    lotto: m.lotto != null ? String(m.lotto) : "",
  };
}
