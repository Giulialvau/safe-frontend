"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadDocument } from "@/components/ui/upload-document";
import { checklistApi, documentiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import {
  CHECKLIST_ESITI as ESITI,
  CHECKLIST_STATI as STATI,
} from "../form";
import type {
  Checklist,
  ChecklistAllegatoRef,
  ChecklistElemento,
} from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type ElRow = {
  id: string;
  descrizione: string;
  completato: boolean;
  risposta: string;
  note: string;
};

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `el-${Date.now()}`;
}

function parseElementi(raw: unknown): ElRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const o = item as Record<string, unknown>;
    return {
      id: String(o.id ?? newId()),
      descrizione: String(o.descrizione ?? ""),
      completato: Boolean(o.completato),
      risposta: String(o.risposta ?? ""),
      note: String(o.note ?? ""),
    };
  });
}

function toInputDateTime(iso: string | undefined | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");

  const [row, setRow] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pdfOpening, setPdfOpening] = useState<string | null>(null);

  const [titolo, setTitolo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fase, setFase] = useState("");
  const [stato, setStato] = useState("APERTA");
  const [esito, setEsito] = useState("");
  const [operatore, setOperatore] = useState("");
  const [note, setNote] = useState("");
  const [dataCompilazione, setDataCompilazione] = useState("");
  const [elementi, setElementi] = useState<ElRow[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    setLoading(true);
    try {
      const c = await checklistApi.get(id);
      if (!c) {
        setError("Checklist non trovata");
        setRow(null);
        return;
      }
      setRow(c);
      setTitolo(String(c.titolo ?? ""));
      setCategoria(String(c.categoria ?? c.tipo ?? ""));
      setFase(String(c.fase ?? ""));
      setStato(String(c.stato ?? "APERTA"));
      setEsito(c.esito ? String(c.esito) : "");
      setOperatore(String(c.operatore ?? ""));
      setNote(String(c.note ?? ""));
      setDataCompilazione(toInputDateTime(c.dataCompilazione as string | undefined));
      const els = parseElementi(c.elementi);
      setElementi(els.length ? els : []);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Checklist non trovata"
      );
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function updateEl(i: number, patch: Partial<ElRow>) {
    setElementi((prev) =>
      prev.map((r, j) => (j === i ? { ...r, ...patch } : r))
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const el: ChecklistElemento[] = elementi
      .filter((x) => x.descrizione.trim())
      .map((x) => ({
        id: x.id,
        descrizione: x.descrizione.trim(),
        completato: x.completato,
        risposta: x.risposta.trim() || undefined,
        note: x.note.trim() || undefined,
      }));
    setSaving(true);
    setError(null);
    try {
      await checklistApi.update(id, {
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
        elementi: el,
      });
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Salvataggio non riuscito"
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !row) return;
    if (!window.confirm("Eliminare definitivamente questa checklist?")) return;
    setError(null);
    try {
      await checklistApi.remove(id);
      router.replace("/checklist");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  async function openPdf(docId: string) {
    setPdfOpening(docId);
    try {
      const blob = await documentiApi.downloadFile(docId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Impossibile aprire il file.");
    } finally {
      setPdfOpening(null);
    }
  }

  const allegatiParsed: ChecklistAllegatoRef[] = Array.isArray(row?.allegati)
    ? (row!.allegati as ChecklistAllegatoRef[])
    : [];

  const commessaId = row?.commessaId ?? row?.commessa_id;
  const commessa = row?.commessa as { codice?: string } | undefined;

  if (loading) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (error && !row) {
    return (
      <Card title="Errore">
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/checklist"
          className="mt-4 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna alle checklist
        </Link>
      </Card>
    );
  }

  if (!row) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/checklist" className="text-sky-700 hover:underline">
              Checklist
            </Link>{" "}
            / {titolo || id}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {titolo || "Checklist"}
          </h2>
          {commessaId ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Commessa:{" "}
              <Link
                className="text-sky-700 hover:underline dark:text-sky-400"
                href={`/commesse/${commessaId}`}
              >
                {String(commessa?.codice ?? commessaId)}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-zinc-500">Senza commessa collegata</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => void remove()}>
            Elimina
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card
        title="Allegati"
        description="Riferimenti a documenti caricati in Documenti"
      >
        {allegatiParsed.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nessun allegato. Aggiungili dalla modifica checklist (scheda
            commessa o elenco).
          </p>
        ) : (
          <ul className="space-y-2">
            {allegatiParsed.map((a, i) => (
              <li
                key={`${a.documentoId ?? i}-${i}`}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                {a.documentoId ? (
                  <button
                    type="button"
                    className="text-sky-700 hover:underline dark:text-sky-400"
                    disabled={pdfOpening === a.documentoId}
                    onClick={() => void openPdf(a.documentoId!)}
                  >
                    {pdfOpening === a.documentoId
                      ? "Apertura…"
                      : String(a.nome ?? "Apri file")}
                  </button>
                ) : (
                  <span>{String(a.nome ?? "—")}</span>
                )}
                {a.note ? (
                  <span className="text-zinc-500">— {a.note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {commessaId ? (
          <div className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
            <p className="mb-3 text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Aggiungi allegato (PDF o immagine)
            </p>
            <UploadDocument
              commessaId={String(commessaId)}
              tipo="checklist_allegato"
              defaultTitle={`${titolo || "Checklist"} — allegato`}
              onSuccess={async (res) => {
                const next: ChecklistAllegatoRef[] = [
                  ...allegatiParsed,
                  { documentoId: res.id, nome: res.nome },
                ];
                await checklistApi.update(id, { allegati: next });
                await load();
              }}
              onError={(msg) => setError(msg)}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
            Assegna una commessa alla checklist per caricare allegati nel modulo
            Documenti.
          </p>
        )}
      </Card>

      <Card
        title="Foto e firma operatore"
        description="Evidenze visive e accettazione (EN 1090 — registrazione fase)"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Carica foto o scansione firma come documento di commessa; il collegamento
          viene salvato negli allegati della checklist.
        </p>
        {commessaId ? (
          <div className="mt-4">
            <UploadDocument
              commessaId={String(commessaId)}
              tipo="checklist_foto"
              defaultTitle={`${titolo || "Checklist"} — foto`}
              onSuccess={async (res) => {
                const next: ChecklistAllegatoRef[] = [
                  ...allegatiParsed,
                  { documentoId: res.id, nome: res.nome, note: "Foto / firma" },
                ];
                await checklistApi.update(id, { allegati: next });
                await load();
              }}
              onError={(msg) => setError(msg)}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">
            Commessa richiesta per l&apos;upload.
          </p>
        )}
      </Card>

      <Card title="Dati e punti controllo" description="Salvataggio con PATCH /checklist/:id">
        <form className="space-y-4" onSubmit={save}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Titolo *"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
              required
            />
            <Input
              label="Categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            />
            <Input
              label="Fase"
              value={fase}
              onChange={(e) => setFase(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Stato
              </span>
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
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Esito
              </span>
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                value={esito}
                onChange={(e) => setEsito(e.target.value)}
              >
                {ESITI.map((s) => (
                  <option key={s.value || "x"} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Operatore"
              value={operatore}
              onChange={(e) => setOperatore(e.target.value)}
            />
            <Input
              label="Data compilazione"
              type="datetime-local"
              value={dataCompilazione}
              onChange={(e) => setDataCompilazione(e.target.value)}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Note
            </span>
            <textarea
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-2 text-sm font-medium">Elementi (domande / risposte)</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="py-2 pr-2">Descrizione</th>
                    <th className="py-2 pr-2">Risposta</th>
                    <th className="py-2 pr-2">Note</th>
                    <th className="py-2">Ok</th>
                  </tr>
                </thead>
                <tbody>
                  {elementi.map((el, i) => (
                    <tr
                      key={el.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-2 pr-2 align-top">
                        <textarea
                          className="w-full min-w-[180px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                          rows={2}
                          value={el.descrizione}
                          onChange={(e) =>
                            updateEl(i, { descrizione: e.target.value })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <textarea
                          className="w-full min-w-[120px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                          rows={2}
                          value={el.risposta}
                          onChange={(e) =>
                            updateEl(i, { risposta: e.target.value })
                          }
                        />
                      </td>
                      <td className="py-2 pr-2 align-top">
                        <textarea
                          className="w-full min-w-[100px] rounded border border-zinc-300 bg-white px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-950"
                          rows={2}
                          value={el.note}
                          onChange={(e) => updateEl(i, { note: e.target.value })}
                        />
                      </td>
                      <td className="py-2 align-top">
                        <input
                          type="checkbox"
                          checked={el.completato}
                          onChange={(e) =>
                            updateEl(i, { completato: e.target.checked })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-2"
              onClick={() =>
                setElementi((prev) => [
                  ...prev,
                  {
                    id: newId(),
                    descrizione: "",
                    completato: false,
                    risposta: "",
                    note: "",
                  },
                ])
              }
            >
              Aggiungi riga
            </Button>
          </div>

          <div className="flex gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <Button type="submit" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva modifiche"}
            </Button>
            <p className="self-center text-xs text-zinc-500">
              Ultimo aggiornamento:{" "}
              {formatDate(row.dataCompilazione as string | undefined) || "—"}
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
