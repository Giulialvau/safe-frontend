"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { UploadDocument } from "@/components/ui/upload-document";
import { useCommessaIdFilter } from "@/hooks/useCommessaIdFilter";
import { commesseApi, documentiApi, materialiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, Documento, Materiale } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

const TIPI_LABEL: Record<string, string> = {
  manuale_qualita: "Manuale qualità",
  procedura: "Procedura",
  istruzione_operativa: "Istruzione operativa",
  modulo: "Modulo",
  registrazione: "Registrazione",
  certificato_en10204: "Certificato EN 10204",
  checklist_allegato: "Checklist — allegato",
  checklist_foto: "Checklist — foto",
  nc_allegato: "NC — allegato",
  wps_pdf: "WPS — PDF",
  wpqr_pdf: "WPQR — PDF",
  report_fascicolo: "Report — fascicolo tecnico",
};

function DocumentiPageInner() {
  const searchParams = useSearchParams();
  const commessaFromUrl = searchParams.get("commessaId")?.trim() ?? null;

  const [rows, setRows] = useState<Documento[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState("tutti");
  const [filterCommessa, setFilterCommessa] = useState("");
  const [filterMateriale, setFilterMateriale] = useState("");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [commessaId, setCommessaId] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileOpeningId, setFileOpeningId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await commesseApi.list().catch(() => [] as Commessa[]);
        if (!cancelled) setCommesse(c);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (commessaFromUrl) setFilterCommessa(commessaFromUrl);
  }, [commessaFromUrl]);

  const load = useCallback(async () => {
    setError(null);
    if (!commessaFromUrl) {
      setRows([]);
      setMateriali([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, m] = await Promise.all([
        documentiApi.byCommessa(commessaFromUrl),
        materialiApi.byCommessa(commessaFromUrl),
      ]);
      setRows(list);
      setMateriali(m);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento documenti"
      );
    } finally {
      setLoading(false);
    }
  }, [commessaFromUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!uploadOpen) return;
    setUploadError(null);
    setCommessaId((prev) => {
      if (prev) return prev;
      const first = commesse[0];
      return first?.id ? String(first.id) : "";
    });
  }, [uploadOpen, commesse]);

  const resetUpload = useCallback(() => {
    setUploadError(null);
    setCommessaId("");
  }, []);

  const handleCloseUpload = useCallback(() => {
    setUploadOpen(false);
    resetUpload();
  }, [resetUpload]);

  const extraTipos = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const t = String(r.tipo ?? "").trim();
      if (t && !TIPI_LABEL[t]) set.add(t);
    }
    return [...set].sort();
  }, [rows]);

  const filteredByControls = useMemo(() => {
    let r = rows;
    if (filterTipo !== "tutti") {
      r = r.filter(
        (x) => String(x.tipo ?? "").toLowerCase() === filterTipo.toLowerCase()
      );
    }
    if (filterCommessa) {
      r = r.filter(
        (x) => String(x.commessaId ?? x.commessa_id) === filterCommessa
      );
    }
    if (filterMateriale) {
      const mat = materiali.find((m) => m.id === filterMateriale);
      const did = mat?.certificatoDocumentoId;
      if (did) {
        r = r.filter((x) => x.id === did);
      } else {
        r = [];
      }
    }
    const q = search.trim().toLowerCase();
    if (q) {
      r = r.filter((d) => {
        const nome = String(d.nome ?? d.titolo ?? "").toLowerCase();
        const comm = (
          d.commessa as { codice?: string; cliente?: string } | undefined
        );
        const cod = String(comm?.codice ?? "").toLowerCase();
        const cl = String(comm?.cliente ?? "").toLowerCase();
        return nome.includes(q) || cod.includes(q) || cl.includes(q);
      });
    }
    return r;
  }, [
    rows,
    filterTipo,
    filterCommessa,
    filterMateriale,
    materiali,
    search,
  ]);

  const { queryCommessaId, filteredRows } =
    useCommessaIdFilter(filteredByControls);

  async function openFile(id: string) {
    setFileOpeningId(id);
    try {
      const blob = await documentiApi.downloadFile(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Impossibile aprire il file."
      );
    } finally {
      setFileOpeningId(null);
    }
  }

  const columns: Column<Documento>[] = [
    {
      key: "titolo",
      header: "Titolo",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/documenti/${r.id}`}
        >
          {String(r.titolo ?? r.nome ?? "—")}
        </Link>
      ),
    },
    {
      key: "tipo",
      header: "Tipo / categoria",
      render: (r) =>
        TIPI_LABEL[String(r.tipo)] ??
        String(r.tipo ?? r.categoria ?? "—"),
    },
    {
      key: "versione",
      header: "Versione",
      render: (r) => String(r.versione ?? "—"),
    },
    {
      key: "stato",
      header: "Approvazione",
      render: (r) =>
        String(
          r.statoApprovazione ?? r.stato_approvazione ?? r.stato ?? "—"
        ),
    },
    {
      key: "scadenza",
      header: "Scadenza",
      render: (r) =>
        formatDate(
          (r.dataScadenza as string | undefined) ??
            (r.data_scadenza as string | undefined)
        ),
    },
    {
      key: "file",
      header: "File",
      render: (r) => (
        <button
          type="button"
          className="text-sky-700 hover:underline dark:text-sky-400 disabled:opacity-50"
          disabled={fileOpeningId === r.id}
          onClick={() => void openFile(r.id)}
        >
          {fileOpeningId === r.id ? "Apertura…" : "Apri"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {!commessaFromUrl ? (
        <CommessaRequiredEmptyState resourceLabel="i documenti della commessa" />
      ) : null}
      <Card
        title="Documenti EN 1090"
        description={
          commessaFromUrl
            ? "Manuale qualità, procedure, certificati materiali, evidenze checklist, allegati NC/WPS/WPQR e fascicolo report (filtrati per la commessa selezionata)."
            : "Carica un documento indicando la commessa. Per l’elenco completo per commessa, aggiungi ?commessaId= all’URL o apri dalla scheda commessa."
        }
        actions={
          <Button type="button" onClick={() => setUploadOpen(true)}>
            Carica documento
          </Button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Tipo</label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="tutti">Tutti i tipi</option>
              {Object.entries(TIPI_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
              {extraTipos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">Commessa</label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={filterCommessa}
              onChange={(e) => setFilterCommessa(e.target.value)}
            >
              <option value="">Tutte</option>
              {commesse.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.codice ?? c.id} — {c.cliente ?? ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">
              Materiale (certificato collegato)
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={filterMateriale}
              onChange={(e) => setFilterMateriale(e.target.value)}
            >
              <option value="">— Nessun filtro —</option>
              {materiali.map((m) => (
                <option key={m.id} value={String(m.id)}>
                  {m.codice ?? m.id} — {m.descrizione ?? ""}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <Input
              label="Ricerca"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Titolo, codice o cliente commessa"
              autoComplete="off"
            />
          </div>
        </div>
        {error ? (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        ) : null}
        <CommessaFilterBanner commessaId={queryCommessaId} />
        {!commessaFromUrl ? (
          <p className="text-sm text-zinc-500">
            Seleziona una commessa (URL o menu) per caricare l&apos;elenco
            documenti.
          </p>
        ) : loading ? (
          <p className="text-sm text-zinc-500">Caricamento…</p>
        ) : (
          <Table
            columns={columns}
            data={filteredRows}
            getRowKey={(r) => r.id}
            emptyMessage="Nessun documento con i filtri selezionati."
          />
        )}
      </Card>

      <Modal
        open={uploadOpen}
        title="Carica documento"
        onClose={handleCloseUpload}
        footer={
          <Button type="button" variant="secondary" onClick={handleCloseUpload}>
            Chiudi
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            PDF o immagine (JPEG, PNG, GIF, WebP). Tipologia predefinita sul
            backend: <strong>modulo</strong>, versione <strong>1.0</strong> se
            non specificati.
          </p>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="upload-commessa"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Commessa
            </label>
            <select
              id="upload-commessa"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={commessaId}
              onChange={(e) => setCommessaId(e.target.value)}
              required
              disabled={!commesse.length}
            >
              {!commesse.length ? (
                <option value="">Nessuna commessa disponibile</option>
              ) : (
                commesse.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.codice ?? c.id} — {c.cliente ?? "—"}
                  </option>
                ))
              )}
            </select>
          </div>
          <UploadDocument
            key={uploadOpen ? "up-open" : "up-closed"}
            commessaId={commessaId}
            onSuccess={() => {
              void load();
              handleCloseUpload();
            }}
            onError={(msg) => setUploadError(msg)}
          />
          {uploadError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}

export default function DocumentiPage() {
  return (
    <Suspense
      fallback={
        <Card title="Documenti EN 1090">
          <p className="text-sm text-zinc-500">Caricamento…</p>
        </Card>
      }
    >
      <DocumentiPageInner />
    </Suspense>
  );
}
