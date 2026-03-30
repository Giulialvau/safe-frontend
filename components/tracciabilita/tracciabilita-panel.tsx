"use client";

import { TracciabilitaForm } from "@/app/(app)/tracciabilita/components/tracciabilita-form";
import { TracciabilitaTable } from "@/app/(app)/tracciabilita/components/tracciabilita-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { materialiApi, tracciabilitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Materiale, TracciabilitaRecord } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type TracciabilitaPanelProps = {
  scope: "commessa";
  commessaId?: string;
  title?: string;
  description?: string;
};

export function TracciabilitaPanel({
  scope,
  commessaId,
  title = "Tracciabilità",
  description = "Collegamento materiale (lotto) → componente → posizione in commessa",
}: TracciabilitaPanelProps) {
  const [rows, setRows] = useState<TracciabilitaRecord[]>([]);
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<TracciabilitaRecord | null>(
    null
  );

  const loadRows = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (commessaId) {
        setRows(await tracciabilitaApi.byCommessa(commessaId));
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento tracciabilità"
      );
    } finally {
      setLoading(false);
    }
  }, [commessaId]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!commessaId) return;
    let cancelled = false;
    void (async () => {
      try {
        const m = await materialiApi.byCommessa(commessaId);
        if (!cancelled) setMateriali(m);
      } catch {
        if (!cancelled) setMateriali([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commessaId]);

  function openCreate() {
    setEditingRow(null);
    setModalOpen(true);
    setError(null);
  }

  function openEdit(r: TracciabilitaRecord) {
    setEditingRow(r);
    setModalOpen(true);
    setError(null);
  }

  async function removeRow(r: TracciabilitaRecord) {
    if (
      !window.confirm(
        `Rimuovere la riga di tracciabilità (pos. ${r.posizione ?? r.id})?`
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

  if (scope === "commessa" && !commessaId) {
    return <p className="text-sm text-amber-700">Commessa non valida.</p>;
  }

  const matLink = commessaId ? (
    <Link
      href={`/commesse/${commessaId}?tab=materiali`}
      className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
    >
      Materiali — anagrafica lotti
    </Link>
  ) : null;

  const vistaCommessa = commessaId ? (
    <Link
      href={`/tracciabilita/${commessaId}`}
      className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
    >
      Vista tracciabilità commessa
    </Link>
  ) : null;

  return (
    <Card
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {matLink}
          {vistaCommessa}
          <Button type="button" onClick={openCreate}>
            Aggiungi collegamento
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <p className="mb-3 text-xs text-zinc-500">
        Dati da GET /commesse/:id/tracciabilita. Il materiale deve appartenere a
        questa commessa. Modulo completo:{" "}
        <Link className="text-sky-700 hover:underline" href="/tracciabilita">
          /tracciabilita
        </Link>
        .
      </p>
      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento…</p>
      ) : (
        <TracciabilitaTable
          mode="flat"
          rows={rows}
          onEdit={openEdit}
          onDelete={(r) => void removeRow(r)}
        />
      )}

      <Modal
        open={modalOpen}
        title={editingRow ? "Modifica collegamento" : "Nuovo collegamento"}
        onClose={() => setModalOpen(false)}
      >
        {commessaId ? (
          <TracciabilitaForm
            variant="commessa"
            commessaIdFixed={commessaId}
            materiali={materiali}
            editing={editingRow}
            onSuccess={async () => {
              setModalOpen(false);
              await loadRows();
            }}
            onCancel={() => setModalOpen(false)}
          />
        ) : null}
      </Modal>
    </Card>
  );
}
