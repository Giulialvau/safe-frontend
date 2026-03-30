import {
  apiDelete,
  apiFetchBlob,
  apiGet,
  apiPatch,
  apiPost,
  apiRequest,
  unwrapList,
  unwrapOne,
} from "@/lib/api/client";

import type {
  Attrezzatura,
  Audit,
  Checklist,
  Commessa,
  Documento,
  LoginResponse,
  Materiale,
  NonConformita,
  PianoControllo,
  Qualifica,
  ReportSummary,
  TracciabilitaRecord,
  Wpqr,
  Wps,
} from "@/types";

/**
 * AUTH API — CORRETTA PER IL TUO BACKEND
 * Il tuo NestJS accetta SOLO:
 * { email: string, password: string }
 */
export const authApi = {
  /** Srotola `{ data: LoginResponse }` prodotto dal ResponseInterceptor Nest */
  login: async (email: string, password: string) => {
    const raw = await apiPost<unknown>(
      "/auth/login",
      { email, password },
      { skipAuth: true }
    );
    const inner = unwrapOne<LoginResponse>(raw);
    if (inner && typeof inner === "object") return inner;
    return raw as LoginResponse;
  },
};

export type CommesseListParams = {
  stato?: string;
  cliente?: string;
  dataInizioDa?: string;
  dataInizioA?: string;
};

function commesseQueryString(params?: CommesseListParams): string {
  if (!params) return "";
  const sp = new URLSearchParams();
  if (params.stato) sp.set("stato", params.stato);
  if (params.cliente?.trim()) sp.set("cliente", params.cliente.trim());
  if (params.dataInizioDa) sp.set("dataInizioDa", params.dataInizioDa);
  if (params.dataInizioA) sp.set("dataInizioA", params.dataInizioA);
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export const commesseApi = {
  list: (params?: CommesseListParams) =>
    apiGet<unknown>(`/commesse${commesseQueryString(params)}`).then(
      unwrapList<Commessa>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/commesse/${id}`).then(unwrapOne<Commessa>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/commesse", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/commesse/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/commesse/${id}`),
};

/** Report sintetico per singola commessa (GET /report/commessa/:id) */
export const reportCommessaApi = {
  byCommessa: (id: string) =>
    apiGet<unknown>(`/report/commessa/${id}`).then(unwrapOne<unknown>),
};

export const documentiApi = {
  list: () => apiGet<unknown>("/documenti").then(unwrapList<Documento>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/documenti`).then(
      unwrapList<Documento>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/documenti/${id}`).then(unwrapOne<Documento>),
  upload: async (params: {
    file: File;
    title: string;
    commessaId: string;
    tipo?: string;
    versione?: string;
  }) => {
    const form = new FormData();
    form.append("file", params.file);
    form.append("title", params.title.trim());
    form.append("commessaId", params.commessaId);
    if (params.tipo?.trim()) form.append("tipo", params.tipo.trim());
    if (params.versione?.trim()) form.append("versione", params.versione.trim());
    const raw = await apiRequest<unknown>("/documenti/upload", {
      method: "POST",
      body: form,
    });
    return unwrapOne<Documento>(raw) ?? (raw as Documento);
  },
  /** Download binario (PDF o immagine) con Authorization */
  downloadFile: (id: string) => apiFetchBlob(`/documenti/${id}/download`),
  downloadPdf: (id: string) => apiFetchBlob(`/documenti/${id}/download`),
  remove: (id: string) => apiDelete<unknown>(`/documenti/${id}`),
};

export const checklistApi = {
  list: () => apiGet<unknown>("/checklist").then(unwrapList<Checklist>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/checklist`).then(
      unwrapList<Checklist>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/checklist/${id}`).then(unwrapOne<Checklist>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/checklist", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/checklist/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/checklist/${id}`),
};

export const materialiApi = {
  list: () => apiGet<unknown>("/materiali").then(unwrapList<Materiale>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/materiali`).then(
      unwrapList<Materiale>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/materiali/${id}`).then(unwrapOne<Materiale>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/materiali", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/materiali/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/materiali/${id}`),
};

export const wpsApi = {
  list: () => apiGet<unknown>("/wps").then(unwrapList<Wps>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/wps`).then(unwrapList<Wps>),
  get: (id: string) => apiGet<unknown>(`/wps/${id}`).then(unwrapOne<Wps>),
  create: (body: Record<string, unknown>) => apiPost<unknown>("/wps", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/wps/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/wps/${id}`),
};

export const wpqrApi = {
  list: () => apiGet<unknown>("/wpqr").then(unwrapList<Wpqr>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/wpqr`).then(unwrapList<Wpqr>),
  get: (id: string) => apiGet<unknown>(`/wpqr/${id}`).then(unwrapOne<Wpqr>),
  create: (body: Record<string, unknown>) => apiPost<unknown>("/wpqr", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/wpqr/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/wpqr/${id}`),
};

export const qualificheApi = {
  list: () => apiGet<unknown>("/qualifiche").then(unwrapList<Qualifica>),
  get: (id: string) =>
    apiGet<unknown>(`/qualifiche/${id}`).then(unwrapOne<Qualifica>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/qualifiche", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/qualifiche/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/qualifiche/${id}`),
};

export const attrezzatureApi = {
  list: () => apiGet<unknown>("/attrezzature").then(unwrapList<Attrezzatura>),
};

export const auditApi = {
  list: () => apiGet<unknown>("/audit").then(unwrapList<Audit>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/audit`).then(unwrapList<Audit>),
  get: (id: string) =>
    apiGet<unknown>(`/audit/${id}`).then(unwrapOne<Audit>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/audit", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/audit/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/audit/${id}`),
};

export const nonConformitaApi = {
  list: () =>
    apiGet<unknown>("/non-conformita").then(unwrapList<NonConformita>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/non-conformita`).then(
      unwrapList<NonConformita>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/non-conformita/${id}`).then(unwrapOne<NonConformita>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/non-conformita", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/non-conformita/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/non-conformita/${id}`),
};

export const pianiControlloApi = {
  list: () =>
    apiGet<unknown>("/piani-controllo").then(unwrapList<PianoControllo>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/piani-controllo`).then(
      unwrapList<PianoControllo>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/piani-controllo/${id}`).then(unwrapOne<PianoControllo>),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/piani-controllo", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/piani-controllo/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/piani-controllo/${id}`),
};

export const tracciabilitaApi = {
  list: () =>
    apiGet<unknown>("/tracciabilita").then(unwrapList<TracciabilitaRecord>),
  byCommessa: (commessaId: string) =>
    apiGet<unknown>(`/commesse/${commessaId}/tracciabilita`).then(
      unwrapList<TracciabilitaRecord>
    ),
  get: (id: string) =>
    apiGet<unknown>(`/tracciabilita/${id}`).then(
      unwrapOne<TracciabilitaRecord>
    ),
  create: (body: Record<string, unknown>) =>
    apiPost<unknown>("/tracciabilita", body),
  update: (id: string, body: Record<string, unknown>) =>
    apiPatch<unknown>(`/tracciabilita/${id}`, body),
  remove: (id: string) => apiDelete<unknown>(`/tracciabilita/${id}`),
};

export const reportApi = {
  /** Sintesi dashboard (backend: GET /report/dashboard) */
  summary: () =>
    apiGet<unknown>("/report/dashboard").then(unwrapOne<ReportSummary>),
  dashboard: () =>
    apiGet<unknown>("/report/dashboard").then(unwrapOne<unknown>),
  materialiFornitori: () =>
    apiGet<unknown>("/report/materiali/fornitori").then(unwrapOne<unknown>),
};

/** GET /report/:tipo?commessaId= — risposta application/pdf */
export type ReportPdfTipo =
  | "dop"
  | "ce"
  | "fascicolo-tecnico"
  | "materiali"
  | "tracciabilita"
  | "commessa";

export const reportPdfApi = {
  download: (tipo: ReportPdfTipo, commessaId: string) =>
    apiFetchBlob(
      `/report/${tipo}?commessaId=${encodeURIComponent(commessaId)}`
    ),
};

/**
 * Dashboard: GET con query string come da convenzione API.
 * Se il backend non applica i filtri, `lib/dashboard-data.ts` affina i risultati lato client.
 */
export const dashboardApi = {
  reportDashboard: () => reportApi.dashboard(),
  commesseAll: () => commesseApi.list(),
  nonConformitaOpen: () =>
    apiGet<unknown>("/non-conformita?status=open").then(
      unwrapList<NonConformita>
    ),
  materialiMissingCert: () =>
    apiGet<unknown>("/materiali?missingCert=true").then(
      unwrapList<Materiale>
    ),
  checklistIncomplete: () =>
    apiGet<unknown>("/checklist?status=incomplete").then(
      unwrapList<Checklist>
    ),
  auditPending: () =>
    apiGet<unknown>("/audit?status=pending").then(unwrapList<Audit>),
  qualificheExpiresSoon: () =>
    apiGet<unknown>("/qualifiche?expiresSoon=true").then(
      unwrapList<Qualifica>
    ),
  wpsExpiresSoon: () =>
    apiGet<unknown>("/wps?expiresSoon=true").then(unwrapList<Wps>),
  wpqrExpiresSoon: () =>
    apiGet<unknown>("/wpqr?expiresSoon=true").then(unwrapList<Wpqr>),
  pianiControlloOpen: () =>
    apiGet<unknown>("/piani-controllo?status=open").then(
      unwrapList<PianoControllo>
    ),
};
