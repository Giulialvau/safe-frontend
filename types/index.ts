/**
 * Tipi condivisi per il frontend EN 1090.
 * Il backend NestJS può usare camelCase o snake_case: normalizziamo in lettura.
 */

export type Id = string;

/** Estrae un valore da oggetti API con chiavi alternative */
export function pick<T>(
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback?: T
): T | undefined {
  if (!obj) return fallback;
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return fallback;
}

export interface User {
  id?: Id;
  email?: string;
  nome?: string;
  cognome?: string;
  ruolo?: string;
}

export interface LoginResponse {
  access_token?: string;
  token?: string;
  user?: User;
}

export interface Commessa {
  id: Id;
  codice?: string;
  nome?: string;
  titolo?: string;
  cliente?: string;
  stato?: string;
  dataInizio?: string;
  dataFine?: string;
  descrizione?: string;
  responsabile?: string;
  luogo?: string;
  note?: string;
  materiali?: unknown[];
  documenti?: unknown[];
  checklists?: unknown[];
  nonConformita?: unknown[];
  pianiControllo?: unknown[];
  tracciabilita?: unknown[];
  audits?: unknown[];
  wps?: unknown[];
  wpqr?: unknown[];
  [key: string]: unknown;
}

export type DocumentoTipo =
  | "manuale_qualita"
  | "procedura"
  | "istruzione_operativa"
  | "modulo"
  | "registrazione"
  | string;

export interface Documento {
  id: Id;
  titolo?: string;
  nome?: string;
  tipo?: DocumentoTipo;
  categoria?: string;
  versione?: string;
  statoApprovazione?: string;
  stato_approvazione?: string;
  dataScadenza?: string;
  data_scadenza?: string;
  fileUrl?: string;
  file_url?: string;
  commessaId?: Id;
  commessa_id?: Id;
  [key: string]: unknown;
}

/** Allineato a Prisma ChecklistStato */
export type ChecklistStato =
  | "APERTA"
  | "IN_CORSO"
  | "COMPLETATA"
  | "ARCHIVIATA";

/** Allineato a Prisma ChecklistEsito */
export type ChecklistEsito =
  | "CONFORME"
  | "NON_CONFORME"
  | "PARZIALE"
  | "NON_APPLICABILE";

export interface ChecklistElemento {
  id: string;
  descrizione: string;
  completato?: boolean;
  risposta?: string;
  note?: string;
}

/** Allegato in JSON: riferimento a documento commessa */
export interface ChecklistAllegatoRef {
  documentoId?: string;
  nome?: string;
  note?: string;
}

export interface Checklist {
  id: Id;
  titolo?: string;
  nome?: string;
  /** Tipologia legacy / categoria (es. fabbricazione) */
  categoria?: string;
  tipo?: string;
  fase?: string | null;
  dataCompilazione?: string | null;
  esito?: ChecklistEsito | null;
  note?: string | null;
  operatore?: string | null;
  allegati?: ChecklistAllegatoRef[] | unknown;
  stato?: ChecklistStato | string;
  statoCompletamento?: string;
  stato_completamento?: string;
  elementi?: ChecklistElemento[] | unknown;
  commessaId?: Id | null;
  commessa_id?: Id | null;
  commessa?: { id?: Id; codice?: string; cliente?: string };
  [key: string]: unknown;
}

export interface Materiale {
  id: Id;
  codice?: string;
  descrizione?: string;
  tipo?: string;
  norma?: string;
  lotto?: string;
  certificato31?: string;
  certificato_3_1?: string;
  certificatoDocumentoId?: Id;
  certificatoDocumento?: {
    id?: Id;
    nome?: string;
    tipo?: string;
    versione?: string;
  };
  commessaId?: Id;
  commessa_id?: Id;
  commessa?: { id?: Id; codice?: string; cliente?: string };
  fornitore?: string;
  dataCarico?: string;
  data_carico?: string;
  tracciabilita?: string;
  stato?: string;
  dataArrivo?: string;
  data_arrivo?: string;
  [key: string]: unknown;
}

export interface Wps {
  id: Id;
  codice?: string;
  descrizione?: string;
  processo?: string;
  spessore?: string;
  materialeBase?: string;
  scadenza?: string;
  note?: string | null;
  materialeId?: Id | null;
  commessaId?: Id | null;
  commessa_id?: Id | null;
  dataScadenza?: string;
  data_scadenza?: string;
  commessa?: { id?: Id; codice?: string; cliente?: string };
  materiale?: {
    id?: Id;
    codice?: string;
    descrizione?: string;
    lotto?: string;
    norma?: string;
  };
  wpqr?: unknown[];
  saldatoreIds?: Id[];
  [key: string]: unknown;
}

export interface Wpqr {
  id: Id;
  codice?: string;
  saldatore?: string;
  wpsId?: Id;
  dataQualifica?: string;
  data_qualifica?: string;
  scadenza?: string;
  note?: string | null;
  qualificaId?: Id | null;
  commessaId?: Id | null;
  commessa_id?: Id | null;
  descrizione?: string;
  dataScadenza?: string;
  data_scadenza?: string;
  wps?: {
    id?: Id;
    codice?: string;
    processo?: string;
    descrizione?: string;
  };
  commessa?: { id?: Id; codice?: string; cliente?: string };
  qualifica?: {
    id?: Id;
    nome?: string;
    ruolo?: string;
    scadenza?: string;
  };
  [key: string]: unknown;
}

export interface Qualifica {
  id: Id;
  nome?: string;
  cognome?: string;
  ruolo?: string;
  tipo?: string;
  dataScadenza?: string;
  data_scadenza?: string;
  documentoUrl?: string;
  documento_url?: string;
  [key: string]: unknown;
}

export interface Attrezzatura {
  id: Id;
  nome?: string;
  tipo?: string;
  codice?: string;
  prossimaManutenzione?: string;
  prossima_manutenzione?: string;
  prossimaTaratura?: string;
  prossima_taratura?: string;
  stato?: string;
  [key: string]: unknown;
}

export interface Audit {
  id: Id;
  titolo?: string;
  dataProgrammata?: string;
  data_programmata?: string;
  stato?: string;
  esito?: string;
  commessaId?: Id;
  [key: string]: unknown;
}

export interface NonConformita {
  id: Id;
  codice?: string;
  titolo?: string;
  descrizione?: string;
  classificazione?: string;
  stato?: string;
  dataApertura?: string;
  data_apertura?: string;
  commessaId?: Id;
  commessa_id?: Id;
  azioniCorrettive?: string;
  [key: string]: unknown;
}

export interface PianoControllo {
  id: Id;
  titolo?: string;
  fase?: string;
  commessaId?: Id;
  commessa_id?: Id;
  fasi?: string;
  controlli?: string;
  controlliRichiesti?: unknown;
  esito?: string;
  stato?: string;
  commessa?: { id?: Id; codice?: string; cliente?: string };
  [key: string]: unknown;
}

export interface TracciabilitaRecord {
  id: Id;
  materialeId?: Id;
  materiale_id?: Id;
  commessaId?: Id;
  commessa_id?: Id;
  posizione?: string;
  quantita?: number | string;
  descrizioneComponente?: string | null;
  descrizione_componente?: string | null;
  riferimentoDisegno?: string | null;
  riferimento_disegno?: string | null;
  note?: string | null;
  pezzo?: string;
  lotto?: string;
  materiale?: {
    id?: Id;
    codice?: string;
    descrizione?: string;
    lotto?: string;
    certificato31?: string;
  };
  commessa?: { id?: Id; codice?: string; cliente?: string };
  [key: string]: unknown;
}

export interface ReportSummary {
  commesse?: number;
  materiali?: number;
  nonConformita?: number;
  audit?: number;
  [key: string]: unknown;
}

export interface DashboardStats {
  certificazioneStato?: string;
  scadenze?: Array<{ titolo: string; data: string; tipo: string }>;
  nonConformitaAperte?: number;
  auditProgrammati?: number;
  documentiInScadenza?: number;
  materialiInArrivo?: number;
  wpsInScadenza?: number;
  wpqrInScadenza?: number;
  qualificheSaldatoriInScadenza?: number;
  [key: string]: unknown;
}
