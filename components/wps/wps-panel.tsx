"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { commesseApi, materialiApi, wpsApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, Materiale, Wps } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Scope = "commessa" | "global";

type WpsPanelProps = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  applyUrlCommessaFilter?: boolean;
};

const emptyForm = {
  codice: "",
  descrizione: "",
  processo: "111",
  spessore: "",
  materialeBase: "",
  scadenza: "",
  note: "",
  commessaId: "",
  materialeId: "",
};

function toInputDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function WpsPanel({
  scope,
  commessaId,
  title = "WPS",
  description = "Procedure di saldatura (Welding Procedure Specification)",
  applyUrlCommessaFilter = false,
}: WpsPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCommessaFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;
  const skipGlobalFetch =
    scope === "global" && applyUrlCommessaFilter && !urlCommessaFilter;

  const [rows, setRows] = useState<Wps[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [materiali, setMateriali] = useState<Materiale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const effectiveCommessaId =
    scope === "commessa" ? commessaId ?? "" : form.commessaId;

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
        setRows(await wpsApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlCommessaFilter) {
        setRows(await wpsApi.byCommessa(urlCommessaFilter));
      } else if (scope === "global") {
        setRows(await wpsApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore caricamento WPS");
    } finally {
      setLoading(false);
    }
  }, [scope, commessaId, applyUrlCommessaFilter, urlCommessaFilter, skipGlobalFetch]);

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

  useEffect(() => {
    const cid = effectiveCommessaId;
    if (!cid) {
      setMateriali([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const m = await materialiApi.byCommessa(cid);
        if (!cancelled) setMateriali(m);
      } catch {
        if (!cancelled) setMateriali([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveCommessaId]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      commessaId: scope === "commessa" ? (commessaId ?? "") : "",
    });
    setModalOpen(true);
    setError(null);
  }

  function openEdit(w: Wps) {
    setEditingId(w.id);
    setForm({
      codice: String(w.codice ?? ""),
      descrizione: String(w.descrizione ?? ""),
      processo: String(w.processo ?? "111"),
      spessore: String(w.spessore ?? ""),
      materialeBase: String(w.materialeBase ?? ""),
      scadenza: toInputDate(w.scadenza as string | undefined),
      note: String(w.note ?? ""),
      commessaId: String(w.commessaId ?? w.commessa_id ?? ""),
      materialeId: String(w.materialeId ?? ""),
    });
    setModalOpen(true);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      scope === "commessa" ? (commessaId ?? "").trim() : form.commessaId.trim();
    if (scope === "global" && !cid) {
      setError("Seleziona una commessa.");
      return;
    }
    if (!form.codice.trim() || !form.processo.trim()) {
      setError("Codice e processo sono obbligatori.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        codice: form.codice.trim(),
        descrizione: form.descrizione.trim() || undefined,
        processo: form.processo.trim(),
        spessore: form.spessore.trim() || undefined,
        materialeBase: form.materialeBase.trim() || undefined,
        scadenza: form.scadenza
          ? new Date(form.scadenza).toISOString()
          : undefined,
        note: form.note.trim() || undefined,
        commessaId: cid || undefined,
        materialeId: form.materialeId.trim() || undefined,
      };
      if (editingId) {
        await wpsApi.update(editingId, body);
      } else {
        await wpsApi.create(body);
      }
      setModalOpen(false);
      const commessaIdForUrl = String(cid).trim();
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlCommessaFilter &&
        commessaIdForUrl
      ) {
        router.replace(
          `/wps?commessaId=${encodeURIComponent(commessaIdForUrl)}`
        );
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

  async function removeRow(w: Wps) {
    if (!window.confirm(`Eliminare la WPS ${w.codice ?? w.id}?`)) return;
    setError(null);
    try {
      await wpsApi.remove(w.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<Wps>[] = [
    {
      key: "codice",
      header: "Codice",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/wps/${r.id}`}
        >
          {String(r.codice ?? r.id)}
        </Link>
      ),
    },
    { key: "processo", header: "Processo" },
    {
      key: "mat",
      header: "Materiale",
      render: (r) => {
        const m = r.materiale as { codice?: string } | undefined;
        if (m?.codice) return String(m.codice);
        return String(r.materialeBase ?? "—");
      },
    },
    {
      key: "scadenza",
      header: "Scadenza",
      render: (r) => formatDate(r.scadenza as string | undefined) || "—",
    },
  ];

  const globalCols: Column<Wps>[] = [
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
          Nuova WPS
        </Button>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {applyUrlCommessaFilter ? (
        <CommessaFilterBanner commessaId={urlCommessaFilter} />
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
                    key: "wpqr",
                    header: "WPQR",
                    render: (r) =>
                      Array.isArray(r.wpqr) ? String(r.wpqr.length) : "—",
                  },
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
          emptyMessage="Nessuna WPS."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica WPS" : "Nuova WPS"}
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
            <Button type="submit" form="form-wps" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form id="form-wps" className="space-y-3" onSubmit={save}>
          {scope === "global" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Commessa *
              </label>
              <select
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={form.commessaId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    commessaId: e.target.value,
                    materialeId: "",
                  }))
                }
                disabled={Boolean(editingId)}
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
          <Input
            label="Codice WPS *"
            value={form.codice}
            onChange={(e) => setForm((f) => ({ ...f, codice: e.target.value }))}
            required
            disabled={Boolean(editingId)}
          />
          <Input
            label="Descrizione"
            value={form.descrizione}
            onChange={(e) =>
              setForm((f) => ({ ...f, descrizione: e.target.value }))
            }
          />
          <Input
            label="Processo (es. 111, 135) *"
            value={form.processo}
            onChange={(e) =>
              setForm((f) => ({ ...f, processo: e.target.value }))
            }
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Spessore / passate"
              value={form.spessore}
              onChange={(e) =>
                setForm((f) => ({ ...f, spessore: e.target.value }))
              }
            />
            <Input
              label="Materiale (testo libero)"
              value={form.materialeBase}
              onChange={(e) =>
                setForm((f) => ({ ...f, materialeBase: e.target.value }))
              }
            />
            <Input
              label="Scadenza revisione"
              type="date"
              value={form.scadenza}
              onChange={(e) =>
                setForm((f) => ({ ...f, scadenza: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Materiale anagrafico (stessa commessa)
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.materialeId}
              onChange={(e) =>
                setForm((f) => ({ ...f, materialeId: e.target.value }))
              }
            >
              <option value="">— Nessuno —</option>
              {materiali.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codice} — {m.descrizione}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Note
            </label>
            <textarea
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              rows={3}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </form>
      </Modal>
    </Card>
  );
}
