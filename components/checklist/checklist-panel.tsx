"use client";

import { CommessaFilterBanner } from "@/components/en1090/commessa-filter-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { checklistApi, commesseApi, documentiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type {
  Checklist,
  ChecklistAllegatoRef,
  ChecklistElemento,
  Commessa,
  Documento,
} from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Scope = "commessa" | "global";

const STATI: { value: string; label: string }[] = [
  { value: "APERTA", label: "Aperta" },
  { value: "IN_CORSO", label: "In corso" },
  { value: "COMPLETATA", label: "Completata" },
  { value: "ARCHIVIATA", label: "Archiviata" },
];

const ESITI: { value: string; label: string }[] = [
  { value: "", label: "— Non impostato —" },
  { value: "CONFORME", label: "Conforme" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "PARZIALE", label: "Parziale" },
  { value: "NON_APPLICABILE", label: "Non applicabile" },
];

type ElementoRow = {
  id: string;
  descrizione: string;
  completato: boolean;
  risposta: string;
  note: string;
};

const emptyElemento = (): ElementoRow => ({
  id: newElId(),
  descrizione: "",
  completato: false,
  risposta: "",
  note: "",
});

function newElId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseElementi(raw: unknown): ElementoRow[] {
  if (!Array.isArray(raw)) return [emptyElemento()];
  const rows = raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      id: String(o.id ?? newElId()),
      descrizione: String(o.descrizione ?? ""),
      completato: Boolean(o.completato),
      risposta: String(o.risposta ?? ""),
      note: String(o.note ?? ""),
    };
  });
  return rows.length ? rows : [emptyElemento()];
}

function toInputDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type ChecklistPanelProps = {
  scope: Scope;
  commessaId?: string;
  title?: string;
  description?: string;
  /** In elenco globale, filtra le righe se l’URL contiene `?commessaId=` */
  applyUrlCommessaFilter?: boolean;
};

export function ChecklistPanel({
  scope,
  commessaId,
  title = "Checklist",
  description = "Controlli per fase con esito, note e allegati",
  applyUrlCommessaFilter = false,
}: ChecklistPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCommessaFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;
  const skipGlobalFetch =
    scope === "global" && applyUrlCommessaFilter && !urlCommessaFilter;
  const [rows, setRows] = useState<Checklist[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [documenti, setDocumenti] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formCommessaId, setFormCommessaId] = useState("");
  const [titolo, setTitolo] = useState("");
  const [categoria, setCategoria] = useState("fabbricazione");
  const [fase, setFase] = useState("");
  const [stato, setStato] = useState("APERTA");
  const [esito, setEsito] = useState("");
  const [operatore, setOperatore] = useState("");
  const [note, setNote] = useState("");
  const [dataCompilazione, setDataCompilazione] = useState("");
  const [elementi, setElementi] = useState<ElementoRow[]>([emptyElemento()]);
  const [allegatiDocIds, setAllegatiDocIds] = useState<string[]>([]);

  const effectiveCommessaId =
    scope === "commessa" ? commessaId ?? "" : formCommessaId;

  const documentiPerCommessa = useMemo(() => {
    const cid = effectiveCommessaId;
    if (!cid) return [];
    return documenti.filter(
      (d) => String(d.commessaId ?? d.commessa_id) === cid
    );
  }, [documenti, effectiveCommessaId]);

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
        setRows(await checklistApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlCommessaFilter) {
        setRows(await checklistApi.byCommessa(urlCommessaFilter));
      } else if (scope === "global") {
        setRows(await checklistApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento checklist"
      );
    } finally {
      setLoading(false);
    }
  }, [
    scope,
    commessaId,
    applyUrlCommessaFilter,
    urlCommessaFilter,
    skipGlobalFetch,
  ]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (scope !== "global") return;
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
  }, [scope]);

  useEffect(() => {
    if (!effectiveCommessaId) return;
    let cancelled = false;
    void (async () => {
      try {
        const d = await documentiApi.list();
        if (!cancelled) setDocumenti(d);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveCommessaId]);

  function resetForm() {
    setTitolo("");
    setCategoria("fabbricazione");
    setFase("");
    setStato("APERTA");
    setEsito("");
    setOperatore("");
    setNote("");
    setDataCompilazione("");
    setElementi([emptyElemento()]);
    setAllegatiDocIds([]);
    setFormCommessaId(scope === "commessa" ? "" : "");
  }

  function openCreate() {
    setEditingId(null);
    resetForm();
    if (scope === "commessa" && commessaId) {
      setFormCommessaId(commessaId);
    }
    setModalOpen(true);
    setError(null);
  }

  function openEdit(c: Checklist) {
    setEditingId(c.id);
    setTitolo(String(c.titolo ?? ""));
    setCategoria(String(c.categoria ?? c.tipo ?? "fabbricazione"));
    setFase(String(c.fase ?? ""));
    setStato(String(c.stato ?? "APERTA"));
    setEsito(c.esito ? String(c.esito) : "");
    setOperatore(String(c.operatore ?? ""));
    setNote(String(c.note ?? ""));
    setDataCompilazione(toInputDateTime(c.dataCompilazione as string | undefined));
    setElementi(parseElementi(c.elementi));
    setFormCommessaId(String(c.commessaId ?? c.commessa_id ?? ""));
    const alleg = c.allegati;
    const ids: string[] = [];
    if (Array.isArray(alleg)) {
      for (const a of alleg) {
        const ref = a as ChecklistAllegatoRef;
        if (ref.documentoId) ids.push(ref.documentoId);
      }
    }
    setAllegatiDocIds(ids);
    setModalOpen(true);
    setError(null);
  }

  function buildPayload(): Record<string, unknown> {
    const el: ChecklistElemento[] = elementi
      .filter((e) => e.descrizione.trim())
      .map((e) => ({
        id: e.id,
        descrizione: e.descrizione.trim(),
        completato: e.completato,
        risposta: e.risposta.trim() || undefined,
        note: e.note.trim() || undefined,
      }));
    const allegati: ChecklistAllegatoRef[] = allegatiDocIds.map((docId) => {
      const doc = documenti.find((d) => d.id === docId);
      return {
        documentoId: docId,
        nome: doc ? String(doc.nome ?? doc.titolo ?? "") : undefined,
      };
    });
    const body: Record<string, unknown> = {
      titolo: titolo.trim(),
      categoria: categoria.trim() || "generale",
      fase: fase.trim() || undefined,
      stato,
      esito: esito || undefined,
      operatore: operatore.trim() || undefined,
      note: note.trim() || undefined,
      dataCompilazione: dataCompilazione
        ? new Date(dataCompilazione).toISOString()
        : undefined,
      elementi: el.length ? el : [],
      allegati: allegati.length ? allegati : undefined,
    };
    const cid = effectiveCommessaId.trim();
    if (cid) body.commessaId = cid;
    return body;
  }

  async function saveChecklist(e: React.FormEvent) {
    e.preventDefault();
    if (scope === "global" && !effectiveCommessaId.trim()) {
      setError("Seleziona una commessa.");
      return;
    }
    if (!titolo.trim()) {
      setError("Il titolo è obbligatorio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = buildPayload();
      if (editingId) {
        await checklistApi.update(editingId, body);
      } else {
        await checklistApi.create(body);
      }
      setModalOpen(false);
      const cid = effectiveCommessaId.trim();
      if (
        scope === "global" &&
        applyUrlCommessaFilter &&
        !urlCommessaFilter &&
        cid
      ) {
        router.replace(`/checklist?commessaId=${encodeURIComponent(cid)}`);
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

  async function removeChecklist(c: Checklist) {
    if (!window.confirm(`Eliminare la checklist «${c.titolo ?? c.id}»?`))
      return;
    setError(null);
    try {
      await checklistApi.remove(c.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  function updateElemento(i: number, patch: Partial<ElementoRow>) {
    setElementi((prev) =>
      prev.map((row, j) => (j === i ? { ...row, ...patch } : row))
    );
  }

  function addElemento() {
    setElementi((prev) => [...prev, emptyElemento()]);
  }

  function removeElemento(i: number) {
    setElementi((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, j) => j !== i)
    );
  }

  const columns: Column<Checklist>[] = [
    {
      key: "titolo",
      header: "Titolo",
      render: (r) => (
        <Link
          href={`/checklist/${r.id}`}
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          {String(r.titolo ?? "—")}
        </Link>
      ),
    },
    { key: "fase", header: "Fase", render: (r) => String(r.fase ?? "—") },
    {
      key: "data",
      header: "Data",
      render: (r) =>
        formatDate(r.dataCompilazione as string | undefined) || "—",
    },
    {
      key: "esito",
      header: "Esito",
      render: (r) => String(r.esito ?? "—"),
    },
    { key: "stato", header: "Stato", render: (r) => String(r.stato ?? "—") },
  ];

  const globalColumns: Column<Checklist>[] = [
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

  const docLink =
    scope === "commessa" && commessaId ? (
      <Link
        href={`/documenti?commessaId=${commessaId}`}
        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
      >
        Documenti — allega PDF
      </Link>
    ) : null;

  return (
    <Card
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {docLink}
          <Button type="button" onClick={openCreate}>
            Nuova checklist
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {applyUrlCommessaFilter ? (
        <CommessaFilterBanner commessaId={urlCommessaFilter} />
      ) : null}
      {scope === "global" && !skipGlobalFetch ? (
        <p className="mb-3 text-xs text-zinc-500">
          Per creare una checklist scegli la commessa nel form. Gli allegati
          devono essere documenti già caricati in{" "}
          <Link href="/documenti" className="text-sky-700 underline">
            Documenti
          </Link>
          .
        </p>
      ) : scope === "global" && skipGlobalFetch ? (
        <p className="mb-3 text-xs text-zinc-500">
          Puoi comunque creare una checklist con «Nuova checklist» e scegliere
          la commessa nel modulo. Gli allegati richiedono documenti già presenti
          in{" "}
          <Link href="/documenti" className="text-sky-700 underline">
            Documenti
          </Link>
          .
        </p>
      ) : (
        <p className="mb-3 text-xs text-zinc-500">
          Elenco aggiornato da GET /commesse/:id/checklist. Dettaglio e
          modifica anche da{" "}
          <Link href="/checklist" className="text-sky-700 underline">
            Checklist globali
          </Link>
          .
        </p>
      )}
      {skipGlobalFetch ? null : loading ? (
        <p className="text-sm text-zinc-500">Caricamento…</p>
      ) : (
        <Table
          columns={
            scope === "global"
              ? [
                  ...globalColumns,
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
                          onClick={() => void removeChecklist(r)}
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
                        <Link
                          href={`/checklist/${r.id}`}
                          className="inline-flex rounded-lg px-3 py-1.5 text-xs font-medium text-sky-700 hover:bg-zinc-100 dark:text-sky-400 dark:hover:bg-zinc-800"
                        >
                          Dettaglio
                        </Link>
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
                          onClick={() => void removeChecklist(r)}
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
          emptyMessage="Nessuna checklist."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica checklist" : "Nuova checklist"}
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
            <Button type="submit" form="form-checklist" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form
          id="form-checklist"
          className="max-h-[70vh] space-y-3 overflow-y-auto pr-1"
          onSubmit={saveChecklist}
        >
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
            label="Titolo *"
            name="titolo"
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
            required
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Categoria"
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            <Input
              label="Fase di lavorazione"
              name="fase"
              value={fase}
              onChange={(e) => setFase(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Stato workflow
              </label>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={stato}
                onChange={(e) => setStato(e.target.value)}
              >
                {STATI.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Esito controllo
              </label>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={esito}
                onChange={(e) => setEsito(e.target.value)}
              >
                {ESITI.map((s) => (
                  <option key={s.value || "none"} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Operatore"
              name="operatore"
              value={operatore}
              onChange={(e) => setOperatore(e.target.value)}
            />
            <Input
              label="Data compilazione"
              name="dataCompilazione"
              type="datetime-local"
              value={dataCompilazione}
              onChange={(e) => setDataCompilazione(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Note generali
            </label>
            <textarea
              name="note"
              rows={3}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="mb-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Punti controllo (domande / risposte)
            </p>
            {elementi.map((el, i) => (
              <div
                key={el.id}
                className="mb-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    Punto {i + 1}
                  </span>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={el.completato}
                      onChange={(e) =>
                        updateElemento(i, { completato: e.target.checked })
                      }
                    />
                    Completato
                  </label>
                </div>
                <Input
                  label="Descrizione / domanda"
                  value={el.descrizione}
                  onChange={(e) =>
                    updateElemento(i, { descrizione: e.target.value })
                  }
                />
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    label="Risposta"
                    value={el.risposta}
                    onChange={(e) =>
                      updateElemento(i, { risposta: e.target.value })
                    }
                  />
                  <Input
                    label="Note punto"
                    value={el.note}
                    onChange={(e) => updateElemento(i, { note: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 text-xs text-red-700"
                  onClick={() => removeElemento(i)}
                >
                  Rimuovi punto
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addElemento}>
              Aggiungi punto controllo
            </Button>
          </div>

          {effectiveCommessaId ? (
            <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Allegati (documenti della commessa)
              </label>
              <p className="text-xs text-zinc-500">
                Seleziona uno o più PDF/registrazioni già caricati in Documenti.
              </p>
              <select
                multiple
                className="min-h-[96px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={allegatiDocIds}
                onChange={(e) => {
                  const opts = Array.from(e.target.selectedOptions).map(
                    (o) => o.value
                  );
                  setAllegatiDocIds(opts);
                }}
              >
                {documentiPerCommessa.map((d) => (
                  <option key={d.id} value={d.id}>
                    {String(d.nome ?? d.titolo ?? d.id)} ({String(d.tipo ?? "")}
                    )
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </form>
      </Modal>
    </Card>
  );
}
