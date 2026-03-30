"use client";

import { CommessaWorkflowBar } from "../components/commessa-workflow-bar";
import { CommessaFormFields, type CommessaFormState } from "../form";
import { TracciabilitaPdfActions } from "@/app/(app)/tracciabilita/components/tracciabilita-pdf-actions";
import { AuditPanel } from "@/components/audit/audit-panel";
import { ChecklistPanel } from "@/components/checklist/checklist-panel";
import { DocumentiPanel } from "@/components/documenti/documenti-panel";
import { MaterialiPanel } from "@/components/materiali/materiali-panel";
import { NonConformitaPanel } from "@/components/non-conformita/non-conformita-panel";
import { PianiControlloPanel } from "@/components/piani-controllo/piani-controllo-panel";
import { QualifichePanel } from "@/components/qualifiche/qualifiche-panel";
import { TracciabilitaPanel } from "@/components/tracciabilita/tracciabilita-panel";
import { WpsPanel } from "@/components/wps/wps-panel";
import { WpqrPanel } from "@/components/wpqr/wpqr-panel";
import { CommessaModuleHub } from "@/components/en1090/commessa-module-hub";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { commesseApi, reportCommessaApi } from "@/lib/api/endpoints";
import { ApiError, apiPatch } from "@/lib/api/client";
import { extractObject } from "@/lib/api/extract-object";
import { formatDate } from "@/lib/format";
import type { Commessa } from "@/types";
import Link from "next/link";
import {
  type CommessaPhaseTabId,
  useCommessaPhaseStatus,
} from "@/hooks/use-commessa-phase-status";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const TABS: readonly { id: CommessaPhaseTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "materiali", label: "Materiali" },
  { id: "documenti", label: "Documenti" },
  { id: "checklist", label: "Checklist" },
  { id: "tracciabilita", label: "Tracciabilità" },
  { id: "non-conformita", label: "NC" },
  { id: "wps-wpqr", label: "WPS / WPQR" },
  { id: "qualifiche", label: "Qualifiche" },
  { id: "audit", label: "Audit FPC" },
  { id: "piani-controllo", label: "Piani ctrl." },
  { id: "report", label: "Report" },
];

/** Tab che propagano `commessaId` nella query (link coerenti con i moduli globali). */
const TABS_WITH_COMMESSA_QUERY: CommessaPhaseTabId[] = [
  "materiali",
  "documenti",
  "checklist",
  "tracciabilita",
  "non-conformita",
  "wps-wpqr",
  "qualifiche",
  "audit",
  "piani-controllo",
  "report",
];

type TabId = CommessaPhaseTabId;

export function CommessaDetailView({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const normalizedTab =
    rawTab === "wps" || rawTab === "wpqr" ? "wps-wpqr" : rawTab;
  const tabParam = normalizedTab as TabId | null;
  const activeTab: TabId =
    TABS.some((t) => t.id === tabParam) && tabParam ? tabParam : "overview";

  const setTab = (tab: TabId) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    if (TABS_WITH_COMMESSA_QUERY.includes(tab)) {
      p.set("commessaId", id);
    }
    router.replace(`/commesse/${id}?${p.toString()}`, { scroll: false });
  };

  const [data, setData] = useState<Commessa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [reportJson, setReportJson] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState<CommessaFormState>({
    codice: "",
    titolo: "",
    cliente: "",
    descrizione: "",
    responsabile: "",
    luogo: "",
    note: "",
    dataInizio: "",
    dataFine: "",
    stato: "BOZZA",
  });

  const {
    phases,
    counts,
    loading: phasesLoading,
    refresh: refreshPhases,
  } = useCommessaPhaseStatus(id);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const c = await commesseApi.get(id);
      if (!c) {
        setError("Commessa non trovata");
        return;
      }
      setData(c);
      setEditForm({
        codice: String(c.codice ?? ""),
        titolo: String(c.titolo ?? ""),
        cliente: String(c.cliente ?? ""),
        descrizione: String(c.descrizione ?? ""),
        responsabile: String(c.responsabile ?? ""),
        luogo: String(c.luogo ?? ""),
        note: String(c.note ?? ""),
        dataInizio: toInputDate(c.dataInizio as string | undefined),
        dataFine: toInputDate(c.dataFine as string | undefined),
        stato: String(c.stato ?? "BOZZA"),
      });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento commessa"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (activeTab !== "report") return;
    let cancelled = false;
    setReportLoading(true);
    setReportError(null);
    void (async () => {
      try {
        const raw = await reportCommessaApi.byCommessa(id);
        if (cancelled) return;
        setReportJson(JSON.stringify(raw, null, 2));
      } catch (e) {
        if (!cancelled)
          setReportError(
            e instanceof ApiError ? e.message : "Errore report commessa"
          );
      } finally {
        if (!cancelled) setReportLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, id]);

  const title = useMemo(() => {
    if (!data) return "Commessa";
    return String(data.codice ?? data.titolo ?? data.id);
  }, [data]);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        codice: editForm.codice.trim(),
        cliente: editForm.cliente.trim(),
        stato: editForm.stato,
        titolo: editForm.titolo.trim() || undefined,
        descrizione: editForm.descrizione.trim() || undefined,
        responsabile: editForm.responsabile.trim() || undefined,
        luogo: editForm.luogo.trim() || undefined,
        note: editForm.note.trim() || undefined,
        dataInizio: editForm.dataInizio
          ? new Date(editForm.dataInizio).toISOString()
          : undefined,
        dataFine: editForm.dataFine
          ? new Date(editForm.dataFine).toISOString()
          : undefined,
      };

      const raw = await apiPatch<unknown>(`/commesse/${data.id}`, body);
      extractObject<Commessa>(raw);
      setEditOpen(false);
      setSaveError(null);
      await load();
      void refreshPhases();
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeCommessa() {
    if (!data || !window.confirm("Eliminare definitivamente questa commessa?")) return;
    setDeleting(true);
    setError(null);
    try {
      await commesseApi.remove(data.id);
      router.replace("/commesse");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !data) {
    return (
      <p className="text-sm text-zinc-500">Caricamento commessa…</p>
    );
  }

  if (error && !data) {
    return (
      <Card title="Errore">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/commesse"
          className="mt-4 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna alle commesse
        </Link>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/commesse" className="text-sky-700 hover:underline">
              Commesse
            </Link>{" "}
            / {title}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {String(data.titolo ?? data.codice ?? id)}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Cliente: {String(data.cliente ?? "—")}
            {data.responsabile
              ? ` · Resp.: ${String(data.responsabile)}`
              : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSaveError(null);
              setEditOpen(true);
            }}
          >
            Modifica
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-red-700 dark:text-red-400"
            disabled={deleting}
            onClick={() => void removeCommessa()}
          >
            {deleting ? "Eliminazione…" : "Elimina"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <CommessaWorkflowBar
        phases={phases}
        counts={counts}
        loading={phasesLoading}
        activeTab={activeTab}
        onSelectTab={setTab}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              title={
                phasesLoading
                  ? "Stato fase…"
                  : phases[t.id]
                    ? "Fase completata"
                    : "Fase incompleta"
              }
              className={`inline-flex items-center gap-1 rounded-t-md border border-b-0 px-3 py-2 text-sm font-medium transition ${
                activeTab === t.id
                  ? "border-zinc-300 bg-white text-sky-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-sky-100"
                  : "border-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t.label}
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  phasesLoading
                    ? "animate-pulse bg-zinc-300 dark:bg-zinc-600"
                    : phases[t.id]
                      ? "bg-emerald-500"
                      : "bg-zinc-300 dark:bg-zinc-600"
                }`}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="shrink-0 text-xs text-zinc-600"
          onClick={() => void refreshPhases()}
        >
          Aggiorna fasi
        </Button>
      </div>

      {activeTab === "overview" ? (
        <Card title="Anagrafica" description="Dati generali della commessa">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase text-zinc-500">Codice</dt>
              <dd className="text-sm">{String(data.codice ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-zinc-500">Stato</dt>
              <dd className="text-sm">{String(data.stato ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-zinc-500">Titolo</dt>
              <dd className="text-sm">{String(data.titolo ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-zinc-500">Luogo</dt>
              <dd className="text-sm">{String(data.luogo ?? "—")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase text-zinc-500">Periodo</dt>
              <dd className="text-sm">
                {formatDate(data.dataInizio as string | undefined)} —{" "}
                {formatDate(data.dataFine as string | undefined)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-zinc-500">Descrizione</dt>
              <dd className="text-sm">{String(data.descrizione ?? "—")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium uppercase text-zinc-500">Note</dt>
              <dd className="whitespace-pre-wrap text-sm">
                {String(data.note ?? "—")}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-zinc-500">
            Piani di controllo e audit: schede dedicate; totali aggregati nel tab
            Report.
          </p>
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Accesso rapido ai moduli (vista filtrata)
            </p>
            <CommessaModuleHub commessaId={id} />
          </div>
        </Card>
      ) : null}

      {activeTab === "materiali" ? (
        <>
          <ModuloGlobaleLink
            href={`/materiali?commessaId=${id}`}
            label="Materiali (vista filtrata)"
          />
          <MaterialiPanel
            scope="commessa"
            commessaId={id}
            title="Materiali della commessa"
            description="Lotti, norme, fornitori; certificato testuale o PDF collegato da Documenti"
          />
        </>
      ) : null}

      {activeTab === "documenti" ? (
        <>
          <ModuloGlobaleLink
            href={`/documenti?commessaId=${id}`}
            label="Documenti"
          />
          <DocumentiPanel
            scope="commessa"
            commessaId={id}
            title="Documenti"
            description="Upload PDF o immagini (POST /documenti/upload), elenco e link al modulo globale"
          />
        </>
      ) : null}

      {activeTab === "checklist" ? (
        <>
          <ModuloGlobaleLink
            href={`/checklist?commessaId=${id}`}
            label="Checklist"
          />
          <ChecklistPanel
            scope="commessa"
            commessaId={id}
            title="Checklist"
            description="Verifiche per fase: esito, note, punti controllo e allegati (GET /commesse/:id/checklist)"
          />
        </>
      ) : null}

      {activeTab === "tracciabilita" ? (
        <>
          <ModuloGlobaleLink
            href={`/tracciabilita/${id}`}
            label="Tracciabilità (vista dedicata)"
          />
          <TracciabilitaPanel
            scope="commessa"
            commessaId={id}
            title="Tracciabilità"
            description="Materiale (lotto) → componente → posizione in commessa (GET /commesse/:id/tracciabilita)"
          />
        </>
      ) : null}

      {activeTab === "wps-wpqr" ? (
        <div className="space-y-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Moduli globali filtrati:{" "}
            <Link
              className="font-medium text-sky-700 hover:underline dark:text-sky-400"
              href={`/wps?commessaId=${id}`}
            >
              WPS
            </Link>
            {" · "}
            <Link
              className="font-medium text-sky-700 hover:underline dark:text-sky-400"
              href={`/wpqr?commessaId=${id}`}
            >
              WPQR
            </Link>
          </p>
          <WpsPanel
            scope="commessa"
            commessaId={id}
            title="WPS"
            description="Procedure di saldatura collegate alla commessa (GET /commesse/:id/wps)"
          />
          <WpqrPanel
            scope="commessa"
            commessaId={id}
            title="WPQR"
            description="Qualifiche saldatori sulle WPS della commessa (GET /commesse/:id/wpqr)"
          />
        </div>
      ) : null}

      {activeTab === "qualifiche" ? (
        <>
          <ModuloGlobaleLink href="/saldatori" label="Saldatori / qualifiche" />
          <QualifichePanel
            scope="commessa"
            commessaId={id}
            title="Qualifiche saldatori"
            description="Anagrafica personale qualificato; le abilitazioni sui giunti sono nelle WPQR"
          />
        </>
      ) : null}

      {activeTab === "non-conformita" ? (
        <>
          <ModuloGlobaleLink
            href={`/nc?commessaId=${id}`}
            label="Non conformità"
          />
          <NonConformitaPanel
            scope="commessa"
            commessaId={id}
            title="Non conformità"
            description="Segnalazione, gravità, azioni correttive e chiusura"
          />
        </>
      ) : null}

      {activeTab === "audit" ? (
        <>
          <ModuloGlobaleLink
            href={`/audit?commessaId=${id}`}
            label="Audit FPC"
          />
          <AuditPanel
            scope="commessa"
            commessaId={id}
            title="Audit FPC"
            description="Verifiche sistema di controllo della produzione"
          />
        </>
      ) : null}

      {activeTab === "piani-controllo" ? (
        <>
          <ModuloGlobaleLink
            href={`/piani-controllo?commessaId=${id}`}
            label="Piani di controllo"
          />
          <PianiControlloPanel
            scope="commessa"
            commessaId={id}
            title="Piani di controllo"
            description="Controlli per fase e esiti (collegabili operativamente alle checklist)"
          />
        </>
      ) : null}

      {activeTab === "report" ? (
        <div className="space-y-6">
          <Card
            title="PDF (materiali, tracciabilità, fascicolo, report commessa)"
            description="GET /report/:tipo?commessaId= — stessi documenti della pagina Report"
          >
            <TracciabilitaPdfActions commessaId={id} />
          </Card>
          <Card
            title="Report commessa (JSON)"
            description="Sintesi aggregata (GET /report/commessa/:id)"
            actions={
              <Link
                href={`/report/${id}`}
                className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
              >
                Vista report dedicata
              </Link>
            }
          >
            {reportLoading ? (
              <p className="text-sm text-zinc-500">Caricamento report…</p>
            ) : reportError ? (
              <p className="text-sm text-red-600">{reportError}</p>
            ) : reportJson ? (
              <pre className="max-h-[min(70vh,480px)] overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
                {reportJson}
              </pre>
            ) : (
              <p className="text-sm text-zinc-500">Nessun dato.</p>
            )}
          </Card>
        </div>
      ) : null}

      <Modal
        open={editOpen}
        title="Modifica commessa"
        onClose={() => {
          setEditOpen(false);
          setSaveError(null);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditOpen(false);
                setSaveError(null);
              }}
            >
              Annulla
            </Button>
            <Button type="submit" form="edit-commessa" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form id="edit-commessa" className="space-y-3" onSubmit={saveEdit}>
          {saveError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          ) : null}
          <CommessaFormFields form={editForm} setForm={setEditForm} showStato />
        </form>
      </Modal>
    </div>
  );
}

function toInputDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function ModuloGlobaleLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
      Modulo globale:{" "}
      <Link
        className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        href={href}
      >
        {label}
      </Link>
    </p>
  );
}
