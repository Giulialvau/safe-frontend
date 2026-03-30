"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { UploadDocument } from "@/components/ui/upload-document";
import { commesseApi, documentiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, Documento } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Scope = "commessa" | "global";

type DocumentiPanelProps = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  applyUrlCommessaFilter?: boolean;
  /** Tipo predefinito per POST /documenti/upload (campo `tipo`) */
  defaultTipo?: string;
};

export function DocumentiPanel({
  scope,
  commessaId,
  title = "Documenti",
  description = "PDF e immagini (POST /documenti/upload) collegati alla commessa",
  applyUrlCommessaFilter = false,
  defaultTipo,
}: DocumentiPanelProps) {
  const searchParams = useSearchParams();
  const urlFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;

  const [rows, setRows] = useState<Documento[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileOpening, setFileOpening] = useState<string | null>(null);
  const [formCommessaId, setFormCommessaId] = useState("");

  const loadRows = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (scope === "commessa" && commessaId) {
        setRows(await documentiApi.byCommessa(commessaId));
      } else {
        setRows(await documentiApi.list());
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento documenti"
      );
    } finally {
      setLoading(false);
    }
  }, [scope, commessaId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (scope !== "global" || !uploadOpen) return;
    let c = false;
    void (async () => {
      try {
        const list = await commesseApi.list();
        if (!c) setCommesse(list);
      } catch {
        /* */
      }
    })();
    return () => {
      c = true;
    };
  }, [scope, uploadOpen]);

  useEffect(() => {
    if (!uploadOpen) return;
    if (scope === "commessa" && commessaId) {
      setFormCommessaId(commessaId);
      return;
    }
    setFormCommessaId((prev) => {
      if (prev) return prev;
      const first = commesse[0];
      return first?.id ? String(first.id) : "";
    });
  }, [uploadOpen, scope, commessaId, commesse]);

  const visibleRows = useMemo(() => {
    if (!urlFilter) return rows;
    return rows.filter(
      (r) => String(r.commessaId ?? r.commessa_id) === urlFilter
    );
  }, [rows, urlFilter]);

  async function openFile(id: string) {
    setFileOpening(id);
    try {
      const blob = await documentiApi.downloadFile(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Impossibile aprire il file.");
    } finally {
      setFileOpening(null);
    }
  }

  async function removeDoc(d: Documento) {
    if (!window.confirm(`Eliminare il documento «${d.nome ?? d.id}»?`))
      return;
    setError(null);
    try {
      await documentiApi.remove(d.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<Documento>[] = [
    {
      key: "nome",
      header: "Nome",
      render: (r) => (
        <Link
          className="text-sky-700 hover:underline dark:text-sky-400"
          href={`/documenti/${r.id}`}
        >
          {String(r.nome ?? r.titolo ?? "—")}
        </Link>
      ),
    },
    { key: "tipo", header: "Tipo" },
    { key: "versione", header: "Versione" },
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
          className="text-sky-700 hover:underline dark:text-sky-400"
          disabled={fileOpening === r.id}
          onClick={() => void openFile(r.id)}
        >
          {fileOpening === r.id ? "Apertura…" : "Apri"}
        </button>
      ),
    },
  ];

  const globalCols: Column<Documento>[] = [
    {
      key: "commessa",
      header: "Commessa",
      render: (r) => {
        const c = r.commessa as { codice?: string } | undefined;
        const cid = r.commessaId ?? r.commessa_id;
        if (!cid) return "—";
        return (
          <Link
            className="text-sky-700 hover:underline dark:text-sky-400"
            href={`/commesse/${cid}`}
          >
            {String(c?.codice ?? cid)}
          </Link>
        );
      },
    },
    ...columns,
  ];

  const effectiveCommessaId =
    scope === "commessa" ? commessaId ?? "" : formCommessaId;

  if (scope === "commessa" && !commessaId) {
    return <p className="text-sm text-amber-700">Commessa non valida.</p>;
  }

  return (
    <Card
      title={title}
      description={description}
      actions={
        <Button type="button" onClick={() => setUploadOpen(true)}>
          Carica documento
        </Button>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {applyUrlCommessaFilter ? (
        <CommessaFilterBanner commessaId={urlFilter} />
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento…</p>
      ) : (
        <Table
          columns={
            scope === "global"
              ? [
                  ...globalCols,
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-red-700"
                        onClick={() => void removeDoc(r)}
                      >
                        Elimina
                      </Button>
                    ),
                  },
                ]
              : [
                  ...columns,
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-xs text-red-700"
                        onClick={() => void removeDoc(r)}
                      >
                        Elimina
                      </Button>
                    ),
                  },
                ]
          }
          data={visibleRows}
          getRowKey={(r) => r.id}
          emptyMessage="Nessun documento. Carica un file dalla modale."
        />
      )}

      <Modal
        open={uploadOpen}
        title="Carica documento"
        onClose={() => setUploadOpen(false)}
        footer={
          <Button type="button" variant="secondary" onClick={() => setUploadOpen(false)}>
            Chiudi
          </Button>
        }
      >
        <div className="space-y-4">
          {scope === "global" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Commessa *
              </label>
              <select
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={formCommessaId}
                onChange={(e) => setFormCommessaId(e.target.value)}
              >
                <option value="">— Seleziona —</option>
                {commesse.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice ?? c.id} — {c.cliente ?? ""}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <UploadDocument
            key={uploadOpen ? "doc-panel-open" : "closed"}
            commessaId={effectiveCommessaId}
            tipo={defaultTipo}
            onSuccess={() => {
              setUploadOpen(false);
              void loadRows();
            }}
            onError={(msg) => setError(msg)}
          />
        </div>
      </Modal>
    </Card>
  );
}
