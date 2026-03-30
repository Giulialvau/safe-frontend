"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import {
  emptyNcForm,
  NcFormFields,
  type NcFormState,
} from "@/components/non-conformita/nc-form-fields";
import { commesseApi, nonConformitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, NonConformita } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Scope = "commessa" | "global";

type Props = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  applyUrlCommessaFilter?: boolean;
};

export function NonConformitaPanel({
  scope,
  commessaId,
  title = "Non conformità",
  description = "Segnalazioni, gravità, azioni correttive e chiusura",
  applyUrlCommessaFilter = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;
  const skipGlobalFetch =
    scope === "global" && applyUrlCommessaFilter && !urlFilter;

  const [rows, setRows] = useState<NonConformita[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NcFormState>(emptyNcForm());

  const loadRows = useCallback(async () => {
    setError(null);
    if (skipGlobalFetch) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (scope === "commessa" && commessaId) {
        setRows(await nonConformitaApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlFilter) {
        setRows(await nonConformitaApi.byCommessa(urlFilter));
      } else if (scope === "global") {
        setRows(await nonConformitaApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento non conformità"
      );
    } finally {
      setLoading(false);
    }
  }, [scope, commessaId, applyUrlCommessaFilter, urlFilter, skipGlobalFetch]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (scope !== "global") return;
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
  }, [scope]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyNcForm(),
      commessaId: scope === "commessa" ? (commessaId ?? "") : "",
      dataApertura: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
    setError(null);
  }

  function openEdit(r: NonConformita) {
    setEditingId(r.id);
    setForm({
      titolo: String(r.titolo ?? ""),
      descrizione: String(r.descrizione ?? ""),
      tipo: String(r.tipo ?? "INTERNA"),
      gravita: String(r.gravita ?? "MEDIA"),
      stato: String(r.stato ?? "APERTA"),
      azioniCorrettive: String(r.azioniCorrettive ?? ""),
      dataApertura: formatDateIn(
        (r.dataApertura as string | undefined) ??
          (r.data_apertura as string | undefined)
      ),
      dataChiusura: formatDateIn(
        (r.dataChiusura as string | undefined) ??
          (r.data_chiusura as string | undefined)
      ),
      commessaId: String(r.commessaId ?? r.commessa_id ?? ""),
    });
    setModalOpen(true);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      scope === "commessa" ? (commessaId ?? "").trim() : form.commessaId.trim();
    if (!cid) {
      setError("Seleziona una commessa.");
      return;
    }
    if (!form.titolo.trim() || !form.descrizione.trim()) {
      setError("Titolo e descrizione sono obbligatori.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        commessaId: cid,
        titolo: form.titolo.trim(),
        descrizione: form.descrizione.trim(),
        tipo: form.tipo,
        gravita: form.gravita,
        stato: form.stato,
        azioniCorrettive: form.azioniCorrettive.trim() || undefined,
        dataApertura: form.dataApertura
          ? new Date(form.dataApertura).toISOString()
          : undefined,
        dataChiusura: form.dataChiusura
          ? new Date(form.dataChiusura).toISOString()
          : undefined,
      };
      if (editingId) {
        const { commessaId: _x, ...patch } = body;
        await nonConformitaApi.update(editingId, patch);
      } else {
        await nonConformitaApi.create(body);
      }
      setModalOpen(false);
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlFilter &&
        cid
      ) {
        router.replace(`/nc?commessaId=${encodeURIComponent(cid)}`);
      } else {
        await loadRows();
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(r: NonConformita) {
    if (!window.confirm(`Eliminare la NC ${r.titolo ?? r.id}?`)) return;
    setError(null);
    try {
      await nonConformitaApi.remove(r.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<NonConformita>[] = [
    {
      key: "titolo",
      header: "Titolo",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/nc/${r.id}`}
        >
          {String(r.titolo ?? "—")}
        </Link>
      ),
    },
    { key: "tipo", header: "Tipo" },
    { key: "gravita", header: "Gravità" },
    { key: "stato", header: "Stato" },
    {
      key: "apertura",
      header: "Apertura",
      render: (r) =>
        formatDate(
          (r.dataApertura as string | undefined) ??
            (r.data_apertura as string | undefined)
        ),
    },
  ];

  const globalCols: Column<NonConformita>[] = [
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

  if (scope === "commessa" && !commessaId) {
    return <p className="text-sm text-amber-700">Commessa non valida.</p>;
  }

  return (
    <Card
      title={title}
      description={description}
      actions={
        <Button type="button" onClick={openCreate}>
          Nuova NC
        </Button>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {applyUrlCommessaFilter ? (
        <CommessaFilterBanner commessaId={urlFilter} />
      ) : null}
      {skipGlobalFetch ? null : loading ? (
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
              : [
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
          }
          data={rows}
          getRowKey={(r) => r.id}
          emptyMessage="Nessuna non conformità."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica NC" : "Nuova non conformità"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" form="form-nc" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form id="form-nc" className="space-y-3" onSubmit={save}>
          <NcFormFields
            form={form}
            setForm={setForm}
            commesse={commesse}
            showCommessaSelect={scope === "global"}
            lockCommessa={Boolean(editingId)}
          />
        </form>
      </Modal>
    </Card>
  );
}

function formatDateIn(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
