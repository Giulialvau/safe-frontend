"use client";

import { TracciabilitaFlowChart } from "@/app/(app)/tracciabilita/components/tracciabilita-flow-chart";
import { TracciabilitaForm } from "@/app/(app)/tracciabilita/components/tracciabilita-form";
import { TracciabilitaSummaryCards } from "@/app/(app)/tracciabilita/components/tracciabilita-summary-cards";
import { TracciabilitaTable } from "@/app/(app)/tracciabilita/components/tracciabilita-table";
import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { commesseApi, materialiApi, tracciabilitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Commessa, Materiale, TracciabilitaRecord } from "@/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

function TracciabilitaGlobalInner() {
  const searchParams = useSearchParams();
  const urlCommessa = searchParams.get("commessaId")?.trim() || "";

  const [rows, setRows] = useState<TracciabilitaRecord[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterCommessa, setFilterCommessa] = useState("");
  const [filterMateriale, setFilterMateriale] = useState("");
  const [filterLotto, setFilterLotto] = useState("");

  const [materialiCommessa, setMaterialiCommessa] = useState<Materiale[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracciabilitaRecord | null>(null);
  const [modalMateriali, setModalMateriali] = useState<Materiale[]>([]);

  useEffect(() => {
    setFilterCommessa(urlCommessa);
  }, [urlCommessa]);

  const loadRows = useCallback(async () => {
    setError(null);
    const cid = filterCommessa.trim();
    if (!cid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await tracciabilitaApi.byCommessa(cid));
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento tracciabilità"
      );
    } finally {
      setLoading(false);
    }
  }, [filterCommessa]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const c = await commesseApi.list();
        if (!cancelled) setCommesse(c);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCommessaId = filterCommessa.trim();

  useEffect(() => {
    if (!filteredCommessaId) {
      setMaterialiCommessa([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const m = await materialiApi.byCommessa(filteredCommessaId);
        if (!cancelled) setMaterialiCommessa(m);
      } catch {
        if (!cancelled) setMaterialiCommessa([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filteredCommessaId]);

  const visibleRows = useMemo(() => {
    return rows.filter((r) => {
      const cod = filterMateriale.trim().toLowerCase();
      if (cod) {
        const mc = r.materiale as { codice?: string } | undefined;
        const c = String(mc?.codice ?? "").toLowerCase();
        if (!c.includes(cod)) return false;
      }
      const lot = filterLotto.trim().toLowerCase();
      if (lot) {
        const l = String(
          r.materiale?.lotto ?? r.lotto ?? ""
        ).toLowerCase();
        if (!l.includes(lot)) return false;
      }
      return true;
    });
  }, [rows, filterMateriale, filterLotto]);

  useEffect(() => {
    if (!modalOpen) {
      setModalMateriali([]);
      return;
    }
    const cid =
      editing != null
        ? String(editing.commessaId ?? editing.commessa_id ?? "")
        : filterCommessa.trim() || urlCommessa;
    if (!cid) {
      setModalMateriali([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const m = await materialiApi.byCommessa(cid);
        if (!cancelled) setModalMateriali(m);
      } catch {
        if (!cancelled) setModalMateriali([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, editing, filterCommessa, urlCommessa]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(r: TracciabilitaRecord) {
    setEditing(r);
    setModalOpen(true);
  }

  async function removeRow(r: TracciabilitaRecord) {
    if (
      !window.confirm(
        `Rimuovere il collegamento (pos. ${r.posizione ?? r.id})?`
      )
    )
      return;
    setError(null);
    try {
      await tracciabilitaApi.remove(r.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const initialCommessaForModal =
    filterCommessa.trim() || urlCommessa || "";

  const hasCommessa = Boolean(filterCommessa.trim());

  return (
    <div className="space-y-6">
      {!hasCommessa ? (
        <CommessaRequiredEmptyState resourceLabel="la tracciabilità" />
      ) : null}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Tracciabilità EN 1090
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Collegamenti{" "}
          <strong>materiale (lotto) → componente → commessa</strong>. I dati
          registrati alimentano i PDF (materiali, tracciabilità, fascicolo,
          report commessa) e il tab Tracciabilità sulla commessa.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <CommessaFilterBanner commessaId={urlCommessa || null} />

      <Card
        title="Filtri"
        description="Restringi per commessa, codice materiale o lotto"
        actions={
          <Button type="button" variant="secondary" onClick={openCreate}>
            Aggiungi collegamento
          </Button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Commessa
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={filterCommessa}
              onChange={(e) => setFilterCommessa(e.target.value)}
            >
              <option value="">— Seleziona una commessa —</option>
              {commesse.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codice ?? c.id} — {c.cliente ?? ""}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Codice materiale (contiene)"
            value={filterMateriale}
            onChange={(e) => setFilterMateriale(e.target.value)}
            placeholder="es. HEA"
          />
          <Input
            label="Lotto (contiene)"
            value={filterLotto}
            onChange={(e) => setFilterLotto(e.target.value)}
            placeholder="es. L-24"
          />
        </div>
        {filteredCommessaId ? (
          <p className="mt-3 text-sm">
            <Link
              className="font-medium text-sky-700 hover:underline dark:text-sky-400"
              href={`/tracciabilita/${filteredCommessaId}`}
            >
              Apri vista dedicata per questa commessa
            </Link>
          </p>
        ) : null}
      </Card>

      {hasCommessa ? (
        <>
          <TracciabilitaSummaryCards
            materiali={materialiCommessa}
            tracciabilita={visibleRows}
          />

          <Card
            title="Diagramma di flusso (sintesi)"
            description="In base ai record filtrati"
          >
            <TracciabilitaFlowChart rows={visibleRows} />
          </Card>

          <Card
            title="Catena gerarchica"
            description="Raggruppamento per materiale/lotto"
          >
            {loading ? (
              <p className="text-sm text-zinc-500">Caricamento…</p>
            ) : (
              <TracciabilitaTable
                mode="hierarchical"
                rows={visibleRows}
                showCommessaColumn
                onEdit={openEdit}
                onDelete={(r) => void removeRow(r)}
              />
            )}
          </Card>

          <Card title="Elenco completo" description="Vista tabellare">
            {loading ? (
              <p className="text-sm text-zinc-500">Caricamento…</p>
            ) : (
              <TracciabilitaTable
                mode="flat"
                rows={visibleRows}
                showCommessaColumn
                onEdit={openEdit}
                onDelete={(r) => void removeRow(r)}
              />
            )}
          </Card>
        </>
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? "Modifica collegamento" : "Nuovo collegamento"}
        onClose={() => setModalOpen(false)}
      >
        <TracciabilitaForm
          variant="global"
          commesse={commesse}
          materiali={modalMateriali}
          editing={editing}
          initialCommessaId={
            editing
              ? String(editing.commessaId ?? editing.commessa_id ?? "")
              : initialCommessaForModal
          }
          onCommessaChange={(cid) => {
            void (async () => {
              if (!cid.trim()) {
                setModalMateriali([]);
                return;
              }
              try {
                setModalMateriali(await materialiApi.byCommessa(cid.trim()));
              } catch {
                setModalMateriali([]);
              }
            })();
          }}
          onSuccess={async () => {
            setModalOpen(false);
            await loadRows();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default function TracciabilitaPage() {
  return (
    <Suspense
      fallback={
        <Card title="Tracciabilità EN 1090">
          <p className="text-sm text-zinc-500">Caricamento…</p>
        </Card>
      }
    >
      <TracciabilitaGlobalInner />
    </Suspense>
  );
}
