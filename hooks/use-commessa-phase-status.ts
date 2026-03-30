"use client";

import {
  auditApi,
  checklistApi,
  commesseApi,
  documentiApi,
  materialiApi,
  nonConformitaApi,
  pianiControlloApi,
  qualificheApi,
  reportCommessaApi,
  tracciabilitaApi,
  wpqrApi,
  wpsApi,
} from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { useCallback, useEffect, useState } from "react";

/** Tab nella scheda commessa (WPS e WPQR unificati) */
export type CommessaPhaseTabId =
  | "overview"
  | "materiali"
  | "documenti"
  | "checklist"
  | "tracciabilita"
  | "non-conformita"
  | "wps-wpqr"
  | "qualifiche"
  | "audit"
  | "piani-controllo"
  | "report";

export type CommessaPhaseMap = Record<CommessaPhaseTabId, boolean>;

export type CommessaPhaseCountMap = Record<CommessaPhaseTabId, number>;

const INITIAL_PHASES: CommessaPhaseMap = {
  overview: false,
  materiali: false,
  documenti: false,
  checklist: false,
  tracciabilita: false,
  "non-conformita": false,
  "wps-wpqr": false,
  qualifiche: false,
  audit: false,
  "piani-controllo": false,
  report: false,
};

const INITIAL_COUNTS: CommessaPhaseCountMap = {
  overview: 0,
  materiali: 0,
  documenti: 0,
  checklist: 0,
  tracciabilita: 0,
  "non-conformita": 0,
  "wps-wpqr": 0,
  qualifiche: 0,
  audit: 0,
  "piani-controllo": 0,
  report: 0,
};

function ncChiusa(stato: unknown): boolean {
  const s = String(stato ?? "").toUpperCase();
  return s === "CHIUSA" || s === "CHIUSO";
}

function ncAperta(stato: unknown): boolean {
  return !ncChiusa(stato);
}

/**
 * Stato avanzamento EN 1090 per commessa: fasi complete + conteggi elementi.
 * qualifiche: conteggio da anagrafica globale (GET /qualifiche); WPQR commessa nel tab unificato.
 */
export function useCommessaPhaseStatus(commessaId: string | undefined) {
  const [phases, setPhases] = useState<CommessaPhaseMap>(INITIAL_PHASES);
  const [counts, setCounts] = useState<CommessaPhaseCountMap>(INITIAL_COUNTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!commessaId) {
      setPhases(INITIAL_PHASES);
      setCounts(INITIAL_COUNTS);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [
        commessa,
        materiali,
        documenti,
        checklist,
        tracciabilita,
        wps,
        wpqr,
        nc,
        audit,
        piani,
        reportRaw,
        qualificheGlobal,
      ] = await Promise.all([
        commesseApi.get(commessaId),
        materialiApi.byCommessa(commessaId).catch(() => []),
        documentiApi.byCommessa(commessaId).catch(() => []),
        checklistApi.byCommessa(commessaId).catch(() => []),
        tracciabilitaApi.byCommessa(commessaId).catch(() => []),
        wpsApi.byCommessa(commessaId).catch(() => []),
        wpqrApi.byCommessa(commessaId).catch(() => []),
        nonConformitaApi.byCommessa(commessaId).catch(() => []),
        auditApi.byCommessa(commessaId).catch(() => []),
        pianiControlloApi.byCommessa(commessaId).catch(() => []),
        reportCommessaApi.byCommessa(commessaId).catch(() => null),
        qualificheApi.list().catch(() => []),
      ]);

      const c = commessa;
      const overview = Boolean(
        c &&
          String(c.codice ?? "").trim() &&
          String(c.cliente ?? "").trim()
      );

      const ncOpen = nc.filter((n) => ncAperta(n.stato));
      const ncOk = ncOpen.length === 0;

      const reportOk =
        reportRaw != null &&
        typeof reportRaw === "object" &&
        Object.keys(reportRaw as object).length > 0;

      const wpsWpqrComplete = wps.length > 0 && wpqr.length > 0;

      setPhases({
        overview,
        materiali: materiali.length > 0,
        documenti: documenti.length > 0,
        checklist: checklist.length > 0,
        tracciabilita: tracciabilita.length > 0,
        "non-conformita": ncOk,
        "wps-wpqr": wpsWpqrComplete,
        qualifiche: wpqr.length > 0,
        audit: audit.length > 0,
        "piani-controllo": piani.length > 0,
        report: reportOk,
      });

      setCounts({
        overview: overview ? 1 : 0,
        materiali: materiali.length,
        documenti: documenti.length,
        checklist: checklist.length,
        tracciabilita: tracciabilita.length,
        "non-conformita": ncOpen.length,
        "wps-wpqr": wps.length + wpqr.length,
        qualifiche: qualificheGlobal.length,
        audit: audit.length,
        "piani-controllo": piani.length,
        report: reportOk ? 1 : 0,
      });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore stato fasi commessa"
      );
      setPhases(INITIAL_PHASES);
      setCounts(INITIAL_COUNTS);
    } finally {
      setLoading(false);
    }
  }, [commessaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { phases, counts, loading, error, refresh };
}
