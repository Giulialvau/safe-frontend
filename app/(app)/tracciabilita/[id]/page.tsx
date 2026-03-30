"use client";

import { TracciabilitaFlowChart } from "@/app/(app)/tracciabilita/components/tracciabilita-flow-chart";
import { TracciabilitaForm } from "@/app/(app)/tracciabilita/components/tracciabilita-form";
import { TracciabilitaPdfActions } from "@/app/(app)/tracciabilita/components/tracciabilita-pdf-actions";
import { TracciabilitaSummaryCards } from "@/app/(app)/tracciabilita/components/tracciabilita-summary-cards";
import { TracciabilitaTable } from "@/app/(app)/tracciabilita/components/tracciabilita-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { commesseApi, materialiApi, tracciabilitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Commessa, Materiale, TracciabilitaRecord } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * `[id]` = ID commessa — vista dedicata EN 1090: materiali, lotti, componenti, catena.
 */
export default function TracciabilitaCommessaPage() {
  const params = useParams();
  const commessaId = String(params.id ?? "");

  const [commessa, setCommessa] = useState<Commessa | null>(null);
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  const [rows, setRows] = useState<TracciabilitaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TracciabilitaRecord | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [c, m, t] = await Promise.all([
        commesseApi.get(commessaId),
        materialiApi.byCommessa(commessaId),
        tracciabilitaApi.byCommessa(commessaId),
      ]);
      if (!c) {
        setError("Commessa non trovata");
        setCommessa(null);
        return;
      }
      setCommessa(c);
      setMateriali(m);
      setRows(t);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento dati"
      );
      setCommessa(null);
    } finally {
      setLoading(false);
    }
  }, [commessaId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  if (loading && !commessa) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (error && !commessa) {
    return (
      <Card title="Tracciabilità commessa">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/tracciabilita"
          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna alla tracciabilità
        </Link>
      </Card>
    );
  }

  if (!commessa) return null;

  const codice = String(commessa.codice ?? commessaId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/tracciabilita" className="text-sky-700 hover:underline">
              Tracciabilità
            </Link>{" "}
            /{" "}
            <Link
              href={`/commesse/${commessaId}`}
              className="text-sky-700 hover:underline"
            >
              {codice}
            </Link>
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Tracciabilità EN 1090
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {String(commessa.cliente ?? "")} — Collegamenti materiale (lotto) →
            componente → posizione. I dati alimentano i PDF e il report commessa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={openCreate}>
            Aggiungi collegamento
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <TracciabilitaSummaryCards
        commessaCodice={codice}
        materiali={materiali}
        tracciabilita={rows}
      />

      <Card
        title="Documentazione (PDF)"
        description="Stessi endpoint della pagina Report — dati da questa commessa"
      >
        <TracciabilitaPdfActions commessaId={commessaId} />
        <p className="mt-3 text-xs text-zinc-500">
          Anche da{" "}
          <Link className="text-sky-700 hover:underline" href="/report">
            Report
          </Link>{" "}
          o tab Report sulla{" "}
          <Link
            className="text-sky-700 hover:underline"
            href={`/report/${commessaId}`}
          >
            vista report dedicata
          </Link>
          .
        </p>
      </Card>

      <Card
        title="Catena completa (vista gerarchica)"
        description="Raggruppamento per materiale/lotto; ogni riga è un collegamento lotto → componente"
      >
        <TracciabilitaTable
          mode="hierarchical"
          rows={rows}
          onEdit={openEdit}
          onDelete={(r) => void removeRow(r)}
        />
      </Card>

      <Card
        title="Diagramma di flusso"
        description="Sintesi visiva (opzionale)"
      >
        <TracciabilitaFlowChart rows={rows} />
      </Card>

      <Card
        title="Tabella completa"
        description="Vista piatta con link al dettaglio record"
      >
        <TracciabilitaTable
          mode="flat"
          rows={rows}
          onEdit={openEdit}
          onDelete={(r) => void removeRow(r)}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={
          editing ? "Modifica collegamento" : "Nuovo collegamento"
        }
        onClose={() => setModalOpen(false)}
      >
        <TracciabilitaForm
          variant="commessa"
          commessaIdFixed={commessaId}
          materiali={materiali}
          editing={editing}
          onSuccess={async () => {
            setModalOpen(false);
            await load();
          }}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
