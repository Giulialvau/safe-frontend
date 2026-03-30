"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { PIANO_ESITO } from "@/lib/en1090-enums";
import { commesseApi, pianiControlloApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Commessa, PianoControllo } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Scope = "commessa" | "global";

type ControlloRow = { codice: string; descrizione: string; riferimentoNormativo: string };

type Props = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  applyUrlCommessaFilter?: boolean;
};

function parseControlli(raw: unknown): ControlloRow[] {
  if (!Array.isArray(raw)) return [{ codice: "", descrizione: "", riferimentoNormativo: "" }];
  return raw.map((x) => {
    const o = x as Record<string, unknown>;
    return {
      codice: String(o.codice ?? ""),
      descrizione: String(o.descrizione ?? ""),
      riferimentoNormativo: String(o.riferimentoNormativo ?? ""),
    };
  });
}

export function PianiControlloPanel({
  scope,
  commessaId,
  title = "Piani di controllo",
  description = "Controlli richiesti per fase (esiti e riferimenti normativi)",
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

  const [rows, setRows] = useState<PianoControllo[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fase: "",
    esito: "IN_ATTESA",
    commessaId: "",
    controlli: [] as ControlloRow[],
  });

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
        setRows(await pianiControlloApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlFilter) {
        setRows(await pianiControlloApi.byCommessa(urlFilter));
      } else if (scope === "global") {
        setRows(await pianiControlloApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento piani"
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
      fase: "",
      esito: "IN_ATTESA",
      commessaId: scope === "commessa" ? (commessaId ?? "") : "",
      controlli: [{ codice: "PC-1", descrizione: "", riferimentoNormativo: "" }],
    });
    setModalOpen(true);
    setError(null);
  }

  function openEdit(r: PianoControllo) {
    setEditingId(r.id);
    const raw = r.controlliRichiesti ?? r.controlli ?? r.fasi;
    setForm({
      fase: String(r.fase ?? ""),
      esito: String(r.esito ?? "IN_ATTESA"),
      commessaId: String(r.commessaId ?? r.commessa_id ?? ""),
      controlli: parseControlli(raw),
    });
    setModalOpen(true);
    setError(null);
  }

  function updateCtrl(i: number, patch: Partial<ControlloRow>) {
    setForm((f) => ({
      ...f,
      controlli: f.controlli.map((row, j) => (j === i ? { ...row, ...patch } : row)),
    }));
  }

  function addCtrl() {
    setForm((f) => ({
      ...f,
      controlli: [
        ...f.controlli,
        { codice: `PC-${f.controlli.length + 1}`, descrizione: "", riferimentoNormativo: "" },
      ],
    }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      scope === "commessa" ? (commessaId ?? "").trim() : form.commessaId.trim();
    if (!cid) {
      setError("Seleziona una commessa.");
      return;
    }
    if (!form.fase.trim()) {
      setError("Indica la fase.");
      return;
    }
    const controlliRichiesti = form.controlli
      .filter((c) => c.codice.trim() && c.descrizione.trim())
      .map((c) => ({
        codice: c.codice.trim(),
        descrizione: c.descrizione.trim(),
        riferimentoNormativo: c.riferimentoNormativo.trim() || undefined,
      }));
    if (controlliRichiesti.length === 0) {
      setError("Aggiungi almeno un controllo con codice e descrizione.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        commessaId: cid,
        fase: form.fase.trim(),
        esito: form.esito,
        controlliRichiesti,
      };
      if (editingId) {
        const { commessaId: _c, ...patch } = body;
        await pianiControlloApi.update(editingId, patch);
      } else {
        await pianiControlloApi.create(body);
      }
      setModalOpen(false);
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlFilter &&
        cid
      ) {
        router.replace(
          `/piani-controllo?commessaId=${encodeURIComponent(cid)}`
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

  async function removeRow(r: PianoControllo) {
    if (!window.confirm(`Eliminare il piano fase «${r.fase}»?`)) return;
    setError(null);
    try {
      await pianiControlloApi.remove(r.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  const columns: Column<PianoControllo>[] = [
    {
      key: "fase",
      header: "Fase",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/piani-controllo/${r.id}`}
        >
          {String(r.fase ?? r.titolo ?? "—")}
        </Link>
      ),
    },
    {
      key: "esito",
      header: "Esito",
      render: (r) => String(r.esito ?? "—"),
    },
    {
      key: "n",
      header: "Controlli",
      render: (r) => {
        const c = r.controlliRichiesti ?? r.controlli;
        return Array.isArray(c) ? String(c.length) : "—";
      },
    },
  ];

  const globalCols: Column<PianoControllo>[] = [
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
          Nuovo piano
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
          emptyMessage="Nessun piano di controllo."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica piano" : "Nuovo piano di controllo"}
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
            <Button type="submit" form="form-pc" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form
          id="form-pc"
          className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
          onSubmit={save}
        >
          {scope === "global" ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Commessa *</label>
              <select
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={form.commessaId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, commessaId: e.target.value }))
                }
                disabled={Boolean(editingId)}
              >
                <option value="">— Seleziona —</option>
                {commesse.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codice ?? c.id}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <Input
            label="Fase / lotto di controllo *"
            value={form.fase}
            onChange={(e) => setForm((f) => ({ ...f, fase: e.target.value }))}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Esito complessivo</label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.esito}
              onChange={(e) =>
                setForm((f) => ({ ...f, esito: e.target.value }))
              }
            >
              {PIANO_ESITO.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <p className="mb-2 text-sm font-medium">Controlli richiesti</p>
            {form.controlli.map((c, i) => (
              <div
                key={i}
                className="mb-2 grid gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-700"
              >
                <Input
                  label="Codice"
                  value={c.codice}
                  onChange={(e) =>
                    updateCtrl(i, { codice: e.target.value })
                  }
                />
                <Input
                  label="Descrizione"
                  value={c.descrizione}
                  onChange={(e) =>
                    updateCtrl(i, { descrizione: e.target.value })
                  }
                />
                <Input
                  label="Rif. normativo (opz.)"
                  value={c.riferimentoNormativo}
                  onChange={(e) =>
                    updateCtrl(i, { riferimentoNormativo: e.target.value })
                  }
                />
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addCtrl}>
              Aggiungi controllo
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
