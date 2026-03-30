import { dashboardApi, documentiApi } from "@/lib/api/endpoints";
import { isPast, isWithinDays } from "@/lib/format";
import type {
  Audit,
  Checklist,
  Commessa,
  Documento,
  Materiale,
  NonConformita,
  PianoControllo,
  Qualifica,
  Wpqr,
  Wps,
} from "@/types";
import { pick } from "@/types";

export interface DashboardDeadline {
  titolo: string;
  data: string;
  tipo: string;
  href?: string;
}

/** Struttura tipica di GET /report/dashboard (NestJS ReportService) */
export interface ReportDashboardRiepilogo {
  commesseTotal?: number;
  commesseAttive?: number;
  materialiTotal?: number;
  documentiTotal?: number;
  nonConformitaAperte?: number;
  nonConformitaChiuse?: number;
  auditTotal?: number;
  auditNonConformi?: number;
  wpsTotal?: number;
  wpqrInScadenza90gg?: number;
}

export interface ReportDashboardPayload {
  generatedAt?: string;
  riepilogo?: ReportDashboardRiepilogo;
  ultimeNonConformita?: NonConformita[];
  ultimiAudit?: Audit[];
  [key: string]: unknown;
}

export interface DashboardPayload {
  certificazioneStato: string;
  reportDashboard: ReportDashboardPayload | null;
  commesseAttive: number;
  commesseCompletate: number;
  commesseTotal: number;
  nonConformitaAperte: NonConformita[];
  materialiSenzaCertificato: Materiale[];
  checklistIncomplete: Checklist[];
  auditProgrammati: Audit[];
  qualificheInScadenza: Qualifica[];
  wpsInScadenza: Wps[];
  wpqrInScadenza: Wpqr[];
  pianiControlloAttivi: PianoControllo[];
  documentiInScadenza: Documento[];
  scadenzeUnificate: DashboardDeadline[];
}

function dataScadenzaDoc(d: Documento): string | undefined {
  return pick(d, ["dataScadenza", "data_scadenza"], undefined) as
    | string
    | undefined;
}

function dataScadenzaWps(w: Wps): string | undefined {
  return pick(w, ["dataScadenza", "data_scadenza", "scadenza"], undefined) as
    | string
    | undefined;
}

function dataScadenzaWpqr(w: Wpqr): string | undefined {
  return pick(w, ["dataScadenza", "data_scadenza", "scadenza"], undefined) as
    | string
    | undefined;
}

function dataScadenzaQual(q: Qualifica): string | undefined {
  return pick(
    q,
    ["dataScadenza", "data_scadenza", "scadenza"],
    undefined
  ) as string | undefined;
}

function dataAudit(a: Audit): string | undefined {
  return pick(a, ["dataProgrammata", "data_programmata", "data"], undefined) as
    | string
    | undefined;
}

function ncIsOpen(x: NonConformita): boolean {
  const s = String(x.stato ?? "").toUpperCase();
  return s !== "CHIUSA" && s !== "CHIUSO";
}

function materialeSenzaCertificato(m: Materiale): boolean {
  const hasDoc = Boolean(
    m.certificatoDocumentoId ||
      (m.certificatoDocumento as { id?: string } | undefined)?.id
  );
  const hasText = Boolean(
    String(m.certificato31 ?? m.certificato_3_1 ?? "").trim()
  );
  return !hasDoc && !hasText;
}

function checklistIsIncomplete(c: Checklist): boolean {
  const s = String(
    c.stato ?? c.statoCompletamento ?? c.stato_completamento ?? ""
  ).toUpperCase();
  return s !== "COMPLETATA" && s !== "ARCHIVIATA";
}

function auditIsPending(a: Audit): boolean {
  const st = String(a.stato ?? "").toLowerCase();
  if (st.includes("complet") || st.includes("chius") || st.includes("done"))
    return false;
  const data = dataAudit(a);
  if (data && isPast(data)) return false;
  return true;
}

function expiresSoonWps(w: Wps): boolean {
  const ds = dataScadenzaWps(w);
  return Boolean(ds && (isWithinDays(ds, 90) || isPast(ds)));
}

function expiresSoonWpqr(w: Wpqr): boolean {
  const ds = dataScadenzaWpqr(w);
  return Boolean(ds && (isWithinDays(ds, 90) || isPast(ds)));
}

function expiresSoonQual(q: Qualifica): boolean {
  const ds = dataScadenzaQual(q);
  return Boolean(ds && (isWithinDays(ds, 90) || isPast(ds)));
}

function pianoAttivo(p: PianoControllo): boolean {
  const s = String(p.stato ?? "").toUpperCase();
  if (s === "CHIUSO" || s === "CHIUSA" || s === "COMPLETATO") return false;
  return true;
}

function countCommesse(commesse: Commessa[]): {
  attive: number;
  completate: number;
  total: number;
} {
  let attive = 0;
  let completate = 0;
  for (const c of commesse) {
    const st = String(c.stato ?? "").toUpperCase();
    if (st === "CHIUSA") completate += 1;
    else attive += 1;
  }
  return { attive, completate, total: commesse.length };
}

export async function loadDashboardData(): Promise<DashboardPayload> {
  const [
    reportRaw,
    commesse,
    ncRaw,
    matRaw,
    clRaw,
    audRaw,
    qualRaw,
    wpsRaw,
    wpqrRaw,
    pianiRaw,
    docs,
  ] = await Promise.all([
    dashboardApi.reportDashboard().catch(() => null),
    dashboardApi.commesseAll().catch(() => []),
    dashboardApi.nonConformitaOpen().catch(() => []),
    dashboardApi.materialiMissingCert().catch(() => []),
    dashboardApi.checklistIncomplete().catch(() => []),
    dashboardApi.auditPending().catch(() => []),
    dashboardApi.qualificheExpiresSoon().catch(() => []),
    dashboardApi.wpsExpiresSoon().catch(() => []),
    dashboardApi.wpqrExpiresSoon().catch(() => []),
    dashboardApi.pianiControlloOpen().catch(() => []),
    documentiApi.list().catch(() => []),
  ]);

  const reportDashboard = reportRaw as ReportDashboardPayload | null;

  const ncAperte = ncRaw.filter(ncIsOpen);
  const matNoCert = matRaw.filter(materialeSenzaCertificato);
  const clInc = clRaw.filter(checklistIsIncomplete);
  const audPend = audRaw.filter(auditIsPending);
  const qualScad = qualRaw.filter(expiresSoonQual);
  const wpsScad = wpsRaw.filter(expiresSoonWps);
  const wpqrScad = wpqrRaw.filter(expiresSoonWpqr);
  const pianiOk = pianiRaw.filter(pianoAttivo);

  const { attive, completate, total } = countCommesse(commesse);

  const docScad = docs.filter((d) => {
    const ds = dataScadenzaDoc(d);
    return ds && (isWithinDays(ds, 60) || isPast(ds));
  });

  const scadenze: DashboardDeadline[] = [];

  for (const d of docScad.slice(0, 5)) {
    const ds = dataScadenzaDoc(d);
    if (ds)
      scadenze.push({
        titolo: String(d.titolo ?? d.nome ?? "Documento"),
        data: ds,
        tipo: "Documento",
        href: `/documenti/${d.id}`,
      });
  }
  for (const w of wpsScad.slice(0, 5)) {
    const ds = dataScadenzaWps(w);
    if (ds)
      scadenze.push({
        titolo: String(w.codice ?? "WPS"),
        data: ds,
        tipo: "WPS",
        href: `/wps/${w.id}`,
      });
  }
  for (const w of wpqrScad.slice(0, 5)) {
    const ds = dataScadenzaWpqr(w);
    if (ds)
      scadenze.push({
        titolo: String(w.codice ?? "WPQR"),
        data: ds,
        tipo: "WPQR",
        href: `/wpqr/${w.id}`,
      });
  }
  for (const q of qualScad.slice(0, 5)) {
    const ds = dataScadenzaQual(q);
    if (ds)
      scadenze.push({
        titolo:
          `${String(q.nome ?? "")} ${String(q.cognome ?? "")}`.trim() ||
          "Qualifica",
        data: ds,
        tipo: "Qualifica",
        href: `/saldatori/${q.id}`,
      });
  }

  scadenze.sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  const riep = reportDashboard?.riepilogo;
  const certificazioneStato =
    (riep?.nonConformitaAperte ?? ncAperte.length) > 5 ||
    qualScad.some((q) => {
      const ds = dataScadenzaQual(q);
      return ds && isPast(ds);
    })
      ? "Attenzione: verifiche richieste"
      : "Sistema conforme (indicativo)";

  return {
    certificazioneStato,
    reportDashboard,
    commesseAttive: riep?.commesseAttive ?? attive,
    commesseCompletate: completate,
    commesseTotal: riep?.commesseTotal ?? total,
    nonConformitaAperte: ncAperte,
    materialiSenzaCertificato: matNoCert,
    checklistIncomplete: clInc,
    auditProgrammati: audPend,
    qualificheInScadenza: qualScad,
    wpsInScadenza: wpsScad,
    wpqrInScadenza: wpqrScad,
    pianiControlloAttivi: pianiOk,
    documentiInScadenza: docScad,
    scadenzeUnificate: scadenze.slice(0, 16),
  };
}
