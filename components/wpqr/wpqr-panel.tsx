"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { commesseApi, qualificheApi, wpqrApi, wpsApi } from "@/lib/api/endpoints";
import { ApiError, apiPatch, apiPost } from "@/lib/api/client";
import { extractObject } from "@/lib/api/extract-object";
import { formatDate } from "@/lib/format";
import type { Commessa, Qualifica, Wps, Wpqr } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Scope = "commessa" | "global";

type WpqrPanelProps = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  applyUrlCommessaFilter?: boolean;
};

const emptyForm = {
  codice: "",
  saldatore: "",
  wpsId: "",
  dataQualifica: "",
  scadenza: "",
  note: "",
  commessaId: "",
  qualificaId: "",
};

function toInputDate(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function commessaIdFromWpqr(w: Wpqr | null): string {
  if (!w) return "";
  return String(
    w.commessaId ?? (w as { commessa_id?: string }).commessa_id ?? ""
  ).trim();
}

export function WpqrPanel({
  scope,
  commessaId,
  title = "WPQR",
  description = "Qualifiche di saldatura (Procedure Qualification Record)",
  applyUrlCommessaFilter = false,
}: WpqrPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCommessaFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;
  const skipGlobalFetch =
    scope === "global" && applyUrlCommessaFilter && !urlCommessaFilter;

  const [rows, setRows] = useState<Wpqr[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [wpsList, setWpsList] = useState<Wps[]>([]);
  const [qualifiche, setQualifiche] = useState<Qualifica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
        setRows(await wpqrApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlCommessaFilter) {
        setRows(await wpqrApi.byCommessa(urlCommessaFilter));
      } else if (scope === "global") {
        setRows(await wpqrApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore caricamento WPQR");
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
    let cancelled = false;
    void (async () => {
      try {
        const q = await qualificheApi.list();
        if (!cancelled) setQualifiche(q);
      } catch {
        if (!cancelled) setQualifiche([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cid = effectiveCommessaId;
    if (!cid) {
      setWpsList([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const w = await wpsApi.byCommessa(cid);
        if (!cancelled) setWpsList(w);
      } catch {
        if (!cancelled) setWpsList([]);
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
      dataQualifica: toInputDate(new Date().toISOString()),
    });
    setModalOpen(true);
    setError(null);
    setSaveError(null);
  }

  function openEdit(r: Wpqr) {
    setEditingId(r.id);
    setForm({
      codice: String(r.codice ?? ""),
      saldatore: String(r.saldatore ?? ""),
      wpsId: String(r.wpsId ?? ""),
      dataQualifica: toInputDate(
        (r.dataQualifica as string | undefined) ??
          (r.data_qualifica as string | undefined)
      ),
      scadenza: toInputDate(r.scadenza as string | undefined),
      note: String(r.note ?? ""),
      commessaId: String(r.commessaId ?? r.commessa_id ?? ""),
      qualificaId: String(r.qualificaId ?? ""),
    });
    setModalOpen(true);
    setError(null);
    setSaveError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      scope === "commessa" ? (commessaId ?? "").trim() : form.commessaId.trim();
    if (scope === "global" && !cid) {
      setSaveError("Seleziona una commessa.");
      return;
    }
    if (!form.codice.trim() || !form.saldatore.trim() || !form.wpsId.trim()) {
      setSaveError("Codice, saldatore e WPS sono obbligatori.");
      return;
    }
    if (!form.dataQualifica) {
      setSaveError("Data qualifica obbligatoria.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, unknown> = {
        codice: form.codice.trim(),
        saldatore: form.saldatore.trim(),
        wpsId: form.wpsId.trim(),
        dataQualifica: new Date(form.dataQualifica).toISOString(),
        scadenza: form.scadenza
          ? new Date(form.scadenza).toISOString()
          : undefined,
        note: form.note.trim() || undefined,
        commessaId: cid || undefined,
        qualificaId: form.qualificaId.trim() || undefined,
      };
      const raw = editingId
        ? await apiPatch<unknown>(`/wpqr/${editingId}`, body)
        : await apiPost<unknown>("/wpqr", body);
      const saved = extractObject<Wpqr>(raw);
      const resolvedCommessaId =
        commessaIdFromWpqr(saved) || cid;
      setModalOpen(false);
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlCommessaFilter &&
        resolvedCommessaId
      ) {
        router.replace(
          `/wpqr?commessaId=${encodeURIComponent(resolvedCommessaId)}`
        );
      } else {
        await loadRows();
      }
    } catch (err) {
      setSaveError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(r: Wpqr) {
    if (!window.confirm(`Eliminare il WPQR ${r.codice ?? r.id}?`)) return;
    setError(null);
    try {
      await wpqrApi.remove(r.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<Wpqr>[] = [
    {
      key: "codice",
      header: "Codice",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/wpqr/${r.id}`}
        >
          {String(r.codice ?? r.id)}
        </Link>
      ),
    },
    {
      key: "wps",
      header: "WPS",
      render: (r) => {
        const w = r.wps as { codice?: string } | undefined;
        return String(w?.codice ?? r.wpsId ?? "—");
      },
    },
    { key: "saldatore", header: "Saldatore" },
    {
      key: "qual",
      header: "Qualifica",
      render: (r) => {
        const q = r.qualifica as { nome?: string } | undefined;
        return String(q?.nome ?? "—");
      },
    },
    {
      key: "dq",
      header: "Data qualifica",
      render: (r) =>
        formatDate(
          (r.dataQualifica as string | undefined) ??
            (r.data_qualifica as string | undefined)
        ) || "—",
    },
    {
      key: "scad",
      header: "Scadenza",
      render: (r) => formatDate(r.scadenza as string | undefined) || "—",
    },
  ];

  const globalCols: Column<Wpqr>[] = [
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
          Nuovo WPQR
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
          emptyMessage="Nessun WPQR."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica WPQR" : "Nuovo WPQR"}
        onClose={() => {
          setModalOpen(false);
          setSaveError(null);
        }}
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" form="form-wpqr" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form id="form-wpqr" className="space-y-3" onSubmit={save}>
          {saveError ? (
            <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
          ) : null}
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
                    wpsId: "",
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
            label="Codice WPQR *"
            value={form.codice}
            onChange={(e) => setForm((f) => ({ ...f, codice: e.target.value }))}
            required
          />
          <Input
            label="Saldatore (nome) *"
            value={form.saldatore}
            onChange={(e) =>
              setForm((f) => ({ ...f, saldatore: e.target.value }))
            }
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              WPS * (della commessa)
            </label>
            <select
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.wpsId}
              onChange={(e) =>
                setForm((f) => ({ ...f, wpsId: e.target.value }))
              }
            >
              <option value="">
                {effectiveCommessaId ? "— Seleziona WPS —" : "— Commessa —"}
              </option>
              {wpsList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.codice} — {w.processo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Qualifica anagrafica (opzionale)
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.qualificaId}
              onChange={(e) =>
                setForm((f) => ({ ...f, qualificaId: e.target.value }))
              }
            >
              <option value="">— Nessuna —</option>
              {qualifiche.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.nome} — {q.ruolo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Data qualifica *"
              type="date"
              value={form.dataQualifica}
              onChange={(e) =>
                setForm((f) => ({ ...f, dataQualifica: e.target.value }))
              }
              required
            />
            <Input
              label="Scadenza validità"
              type="date"
              value={form.scadenza}
              onChange={(e) =>
                setForm((f) => ({ ...f, scadenza: e.target.value }))
              }
            />
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
