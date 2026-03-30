"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import {
  emptyQualificaForm,
  QualificaFormFields,
  type QualificaFormState,
} from "@/components/qualifiche/qualifica-form-fields";
import { qualificheApi } from "@/lib/api/endpoints";
import { ApiError, apiPatch, apiPost } from "@/lib/api/client";
import { extractObject } from "@/lib/api/extract-object";
import { formatDate } from "@/lib/format";
import type { Qualifica } from "@/types";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Scope = "commessa" | "global";

type Props = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
};

/**
 * Anagrafica qualifiche (EN ISO 9606 / personale). In ambito commessa si mostra
 * l’elenco globale con link alle WPQR che legano saldatori alla commessa.
 */
export function QualifichePanel({
  scope,
  commessaId,
  title = "Qualifiche saldatori",
  description = "Personale qualificato e scadenze — collegare le WPQR dalla tab WPQR per abilitazioni sui giunti",
}: Props) {
  const [rows, setRows] = useState<Qualifica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QualificaFormState>(emptyQualificaForm());

  const loadRows = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      setRows(await qualificheApi.list());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento qualifiche"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyQualificaForm());
    setModalOpen(true);
    setError(null);
    setSaveError(null);
  }

  function openEdit(q: Qualifica) {
    setEditingId(q.id);
    setForm({
      nome: String(q.nome ?? ""),
      ruolo: String(q.ruolo ?? ""),
      scadenza: toIn(
        (q.scadenza as string | undefined) ??
          (q.dataScadenza as string | undefined) ??
          (q.data_scadenza as string | undefined)
      ),
      documento: String(q.documento ?? q.documentoUrl ?? ""),
    });
    setModalOpen(true);
    setError(null);
    setSaveError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.ruolo.trim()) {
      setSaveError("Nome e ruolo sono obbligatori.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        nome: form.nome.trim(),
        ruolo: form.ruolo.trim(),
        scadenza: form.scadenza
          ? new Date(form.scadenza).toISOString()
          : undefined,
        documento: form.documento.trim() || undefined,
      };
      const raw = editingId
        ? await apiPatch<unknown>(`/qualifiche/${editingId}`, body)
        : await apiPost<unknown>("/qualifiche", body);
      extractObject<Qualifica>(raw);
      setModalOpen(false);
      await loadRows();
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(q: Qualifica) {
    if (!window.confirm(`Eliminare la qualifica ${q.nome}?`)) return;
    setError(null);
    try {
      await qualificheApi.remove(q.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<Qualifica>[] = [
    {
      key: "nome",
      header: "Nome",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/saldatori/${r.id}`}
        >
          {String(
            `${r.nome ?? ""} ${r.cognome ?? ""}`.trim() || r.nome || "—"
          )}
        </Link>
      ),
    },
    { key: "ruolo", header: "Ruolo / qualifica" },
    {
      key: "scad",
      header: "Scadenza",
      render: (r) =>
        formatDate(
          (r.scadenza as string | undefined) ??
            (r.dataScadenza as string | undefined) ??
            (r.data_scadenza as string | undefined)
        ) || "—",
    },
  ];

  if (scope === "commessa" && !commessaId) {
    return <p className="text-sm text-amber-700">Commessa non valida.</p>;
  }

  return (
    <Card
      title={title}
      description={description}
      actions={
        scope === "global" ? (
          <Button type="button" onClick={openCreate}>
            Nuova qualifica
          </Button>
        ) : (
          <Link
            href={`/commesse/${commessaId}?tab=wps-wpqr`}
            className="inline-flex rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800"
          >
            Vai alle WPQR
          </Link>
        )
      }
    >
      {scope === "commessa" ? (
        <p className="mb-3 text-xs text-zinc-500">
          Le abilitazioni sui giunti della commessa si registrano nelle{" "}
          <strong>WPQR</strong> (tab dedicata). Qui l’anagrafica personale
          qualificato a livello aziendale.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-500">Caricamento…</p>
      ) : (
        <Table
          columns={
            scope === "global"
              ? [
                  ...columns,
                  {
                    key: "actions",
                    header: "",
                    render: (r) => (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs"
                          onClick={() => openEdit(r)}
                        >
                          Modifica
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-xs text-red-700"
                          onClick={() => void removeRow(r)}
                        >
                          Elimina
                        </Button>
                      </div>
                    ),
                  },
                ]
              : columns
          }
          data={rows}
          getRowKey={(r) => r.id}
          emptyMessage="Nessuna qualifica in anagrafica."
        />
      )}

      {scope === "global" ? (
        <Modal
          open={modalOpen}
          title={editingId ? "Modifica qualifica" : "Nuova qualifica"}
          onClose={() => {
            setModalOpen(false);
            setSaveError(null);
          }}
          footer={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setModalOpen(false);
                  setSaveError(null);
                }}
              >
                Annulla
              </Button>
              <Button type="submit" form="form-qual" disabled={saving}>
                {saving ? "Salvataggio…" : "Salva"}
              </Button>
            </>
          }
        >
          <form id="form-qual" className="space-y-3" onSubmit={save}>
            {saveError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {saveError}
              </p>
            ) : null}
            <QualificaFormFields form={form} setForm={setForm} />
          </form>
        </Modal>
      ) : null}
    </Card>
  );
}

function toIn(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
