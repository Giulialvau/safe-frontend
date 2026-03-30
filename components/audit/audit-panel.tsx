"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { AUDIT_ESITO } from "@/lib/en1090-enums";
import { auditApi, commesseApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Audit, Commessa } from "@/types";
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

const emptyForm = {
  titolo: "",
  data: "",
  auditor: "",
  esito: "CONFORME",
  note: "",
  commessaId: "",
};

export function AuditPanel({
  scope,
  commessaId,
  title = "Audit FPC",
  description = "Verifiche del sistema di controllo (Factory Production Control)",
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

  const [rows, setRows] = useState<Audit[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

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
        setRows(await auditApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlFilter) {
        setRows(await auditApi.byCommessa(urlFilter));
      } else if (scope === "global") {
        setRows(await auditApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore caricamento audit");
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
      ...emptyForm,
      commessaId: scope === "commessa" ? (commessaId ?? "") : "",
      data: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
    setError(null);
  }

  function openEdit(r: Audit) {
    setEditingId(r.id);
    const d =
      (r.data as string | undefined) ??
      (r.dataProgrammata as string | undefined) ??
      "";
    setForm({
      titolo: String(r.titolo ?? ""),
      data: d ? new Date(d).toISOString().slice(0, 10) : "",
      auditor: String(r.auditor ?? ""),
      esito: String(r.esito ?? "CONFORME"),
      note: String(r.note ?? ""),
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
    if (!form.titolo.trim() || !form.auditor.trim() || !form.data) {
      setError("Titolo, auditor e data sono obbligatori.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        commessaId: cid,
        titolo: form.titolo.trim(),
        data: new Date(form.data).toISOString(),
        auditor: form.auditor.trim(),
        esito: form.esito,
        note: form.note.trim() || undefined,
      };
      if (editingId) {
        const { commessaId: _c, ...patch } = body;
        await auditApi.update(editingId, patch);
      } else {
        await auditApi.create(body);
      }
      setModalOpen(false);
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlFilter &&
        cid
      ) {
        router.replace(`/audit?commessaId=${encodeURIComponent(cid)}`);
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

  async function removeRow(r: Audit) {
    if (!window.confirm(`Eliminare l'audit «${r.titolo}»?`)) return;
    setError(null);
    try {
      await auditApi.remove(r.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<Audit>[] = [
    {
      key: "titolo",
      header: "Titolo",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/audit/${r.id}`}
        >
          {String(r.titolo ?? "—")}
        </Link>
      ),
    },
    {
      key: "data",
      header: "Data",
      render: (r) =>
        formatDate(
          (r.data as string | undefined) ??
            (r.dataProgrammata as string | undefined)
        ),
    },
    { key: "auditor", header: "Auditor" },
    { key: "esito", header: "Esito" },
  ];

  const globalCols: Column<Audit>[] = [
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
    <Card title={title} description={description} actions={<Button type="button" onClick={openCreate}>Nuovo audit</Button>}>
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
                        <Button type="button" variant="ghost" className="text-xs" onClick={() => openEdit(r)}>
                          Modifica
                        </Button>
                        <Button type="button" variant="ghost" className="text-xs text-red-700" onClick={() => void removeRow(r)}>
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
                        <Button type="button" variant="ghost" className="text-xs" onClick={() => openEdit(r)}>
                          Modifica
                        </Button>
                        <Button type="button" variant="ghost" className="text-xs text-red-700" onClick={() => void removeRow(r)}>
                          Elimina
                        </Button>
                      </div>
                    ),
                  },
                ]
          }
          data={rows}
          getRowKey={(r) => r.id}
          emptyMessage="Nessun audit."
        />
      )}

      <Modal open={modalOpen} title={editingId ? "Modifica audit" : "Nuovo audit"} onClose={() => setModalOpen(false)} footer={<>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annulla</Button>
            <Button type="submit" form="form-audit" disabled={saving}>{saving ? "Salvataggio…" : "Salva"}</Button>
          </>}>
        <form id="form-audit" className="space-y-3" onSubmit={save}>
          {scope === "global" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Commessa *</label>
              <select required className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" value={form.commessaId} onChange={(e) => setForm((f) => ({ ...f, commessaId: e.target.value }))} disabled={Boolean(editingId)}>
                <option value="">— Seleziona —</option>
                {commesse.map((c) => (
                  <option key={c.id} value={c.id}>{c.codice ?? c.id}</option>
                ))}
              </select>
            </div>
          ) : null}
          <Input label="Titolo *" value={form.titolo} onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))} required />
          <Input label="Data *" type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} required />
          <Input label="Auditor *" value={form.auditor} onChange={(e) => setForm((f) => ({ ...f, auditor: e.target.value }))} required />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Esito</label>
            <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" value={form.esito} onChange={(e) => setForm((f) => ({ ...f, esito: e.target.value }))}>
              {AUDIT_ESITO.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Note</label>
            <textarea className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950" rows={3} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </div>
        </form>
      </Modal>
    </Card>
  );
}
