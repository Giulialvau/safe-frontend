"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Table, type Column } from "@/components/ui/table";
import { commesseApi, documentiApi, materialiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { Commessa, Documento, Materiale } from "@/types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Scope = "commessa" | "global";

type MaterialiPanelProps = {
  scope: Scope;
  /** Obbligatorio se scope === "commessa" */
  commessaId?: string;
  title?: string;
  description?: string;
  /** Elenco globale: richiede ?commessaId= per la fetch (no GET /materiali senza filtro) */
  applyUrlCommessaFilter?: boolean;
};

const emptyForm = {
  codice: "",
  descrizione: "",
  tipo: "",
  norma: "",
  certificato31: "",
  lotto: "",
  fornitore: "",
  dataCarico: "",
  certificatoDocumentoId: "",
  commessaId: "",
};

export function MaterialiPanel({
  scope,
  commessaId,
  title = "Materiali",
  description = "Tracciabilità, norme, fornitori e certificati (testo o PDF da Documenti)",
  applyUrlCommessaFilter = false,
}: MaterialiPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCommessaFilter =
    applyUrlCommessaFilter && scope === "global"
      ? searchParams.get("commessaId")?.trim() || null
      : null;
  const skipGlobalFetch =
    scope === "global" && applyUrlCommessaFilter && !urlCommessaFilter;

  const [rows, setRows] = useState<Materiale[]>([]);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [documenti, setDocumenti] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [pdfOpening, setPdfOpening] = useState<string | null>(null);

  const effectiveCommessaId =
    scope === "commessa" ? commessaId ?? "" : form.commessaId;

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
        setRows(await materialiApi.byCommessa(commessaId));
      } else if (scope === "global" && applyUrlCommessaFilter && urlCommessaFilter) {
        setRows(await materialiApi.byCommessa(urlCommessaFilter));
      } else if (scope === "global") {
        setRows(await materialiApi.list());
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento materiali"
      );
    } finally {
      setLoading(false);
    }
  }, [scope, commessaId, applyUrlCommessaFilter, urlCommessaFilter, skipGlobalFetch]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (scope !== "global") return;
    let cancelled = false;
    void (async () => {
      try {
        const [c, d] = await Promise.all([
          commesseApi.list(),
          documentiApi.list(),
        ]);
        if (!cancelled) {
          setCommesse(c);
          setDocumenti(d);
        }
      } catch {
        /* opzionale */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  useEffect(() => {
    if (scope !== "commessa" || !commessaId) return;
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
  }, [scope, commessaId]);

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      commessaId: scope === "commessa" ? (commessaId ?? "") : "",
    });
    setModalOpen(true);
    setError(null);
  }

  function openEdit(m: Materiale) {
    setEditingId(m.id);
    setForm({
      codice: String(m.codice ?? ""),
      descrizione: String(m.descrizione ?? ""),
      tipo: String(m.tipo ?? ""),
      norma: String(m.norma ?? ""),
      certificato31: String(m.certificato31 ?? m.certificato_3_1 ?? ""),
      lotto: String(m.lotto ?? ""),
      fornitore: String(m.fornitore ?? ""),
      dataCarico: toInputDate(
        (m.dataCarico as string | undefined) ??
          (m.data_carico as string | undefined)
      ),
      certificatoDocumentoId: String(
        m.certificatoDocumentoId ?? m.certificatoDocumento?.id ?? ""
      ),
      commessaId: String(m.commessaId ?? m.commessa_id ?? ""),
    });
    setModalOpen(true);
    setError(null);
  }

  async function saveMateriale(e: React.FormEvent) {
    e.preventDefault();
    const cid =
      scope === "commessa" ? commessaId : form.commessaId.trim();
    if (!cid) {
      setError("Seleziona una commessa.");
      return;
    }
    if (!form.codice.trim() || !form.descrizione.trim()) {
      setError("Codice e descrizione sono obbligatori.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        commessaId: cid,
        codice: form.codice.trim(),
        descrizione: form.descrizione.trim(),
        tipo: form.tipo.trim() || undefined,
        norma: form.norma.trim() || undefined,
        certificato31: form.certificato31.trim() || undefined,
        lotto: form.lotto.trim() || undefined,
        fornitore: form.fornitore.trim() || undefined,
        dataCarico: form.dataCarico
          ? new Date(form.dataCarico).toISOString()
          : undefined,
        certificatoDocumentoId: form.certificatoDocumentoId.trim() || undefined,
      };
      if (editingId) {
        const { commessaId: _drop, ...patch } = body;
        await materialiApi.update(editingId, patch);
      } else {
        await materialiApi.create(body);
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
          `/materiali?commessaId=${encodeURIComponent(commessaIdForUrl)}`
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

  async function removeMateriale(m: Materiale) {
    if (!window.confirm(`Eliminare il materiale ${m.codice ?? m.id}?`)) return;
    setError(null);
    try {
      await materialiApi.remove(m.id);
      await loadRows();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  async function openCertPdf(docId: string) {
    setPdfOpening(docId);
    try {
      const blob = await documentiApi.downloadPdf(docId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Impossibile aprire il PDF del certificato.");
    } finally {
      setPdfOpening(null);
    }
  }

  const columns: Column<Materiale>[] = [
    {
      key: "codice",
      header: "Codice",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/materiali/${r.id}`}
        >
          {String(r.codice ?? r.id)}
        </Link>
      ),
    },
    { key: "descrizione", header: "Descrizione" },
    { key: "tipo", header: "Tipo", render: (r) => String(r.tipo ?? "—") },
    { key: "norma", header: "Norma", render: (r) => String(r.norma ?? "—") },
    { key: "lotto", header: "Lotto", render: (r) => String(r.lotto ?? "—") },
    {
      key: "fornitore",
      header: "Fornitore",
      render: (r) => String(r.fornitore ?? "—"),
    },
    {
      key: "cert31",
      header: "Rif. 3.1",
      render: (r) =>
        String(r.certificato31 ?? r.certificato_3_1 ?? "—"),
    },
    {
      key: "certPdf",
      header: "Cert. PDF",
      render: (r) => {
        const doc = r.certificatoDocumento as { id?: string; nome?: string } | undefined;
        const docId = r.certificatoDocumentoId ?? doc?.id;
        if (!docId) return "—";
        return (
          <button
            type="button"
            className="text-sky-700 hover:underline dark:text-sky-400"
            disabled={pdfOpening === docId}
            onClick={() => void openCertPdf(String(docId))}
          >
            {pdfOpening === docId
              ? "Apertura…"
              : String(doc?.nome ?? "Apri PDF")}
          </button>
        );
      },
    },
  ];

  if (scope === "commessa" && !commessaId) {
    return (
      <p className="text-sm text-amber-700">Commessa non valida.</p>
    );
  }

  const docLink =
    scope === "commessa" && commessaId ? (
      <Link
        href={`/documenti?commessaId=${commessaId}`}
        className="text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
      >
        Documenti — carica certificato PDF
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
            Aggiungi materiale
          </Button>
        </div>
      }
    >
      {error ? (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      {scope === "global" ? (
        <p className="mb-3 text-xs text-zinc-500">
          In modalità elenco globale scegli la commessa nel form. Per collegare
          un PDF, caricalo prima in{" "}
          <Link href="/documenti" className="text-sky-700 underline">
            Documenti
          </Link>{" "}
          per la stessa commessa.
        </p>
      ) : (
        <p className="mb-3 text-xs text-zinc-500">
          Collega un certificato: carica il file in Documenti, poi seleziona il
          documento qui. {docLink}
        </p>
      )}
      {skipGlobalFetch ? null : loading ? (
        <p className="text-sm text-zinc-500">Caricamento…</p>
      ) : (
        <Table
          columns={
            scope === "global"
              ? [
                  ...columns.slice(0, 1),
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
                  ...columns.slice(1),
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
                          onClick={() => void removeMateriale(r)}
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
                          onClick={() => void removeMateriale(r)}
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
          emptyMessage="Nessun materiale. Aggiungine uno o verifica l’API."
        />
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Modifica materiale" : "Nuovo materiale"}
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
            <Button type="submit" form="form-materiale" disabled={saving}>
              {saving ? "Salvataggio…" : "Salva"}
            </Button>
          </>
        }
      >
        <form id="form-materiale" className="space-y-3" onSubmit={saveMateriale}>
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
                  setForm((f) => ({ ...f, commessaId: e.target.value }))
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Codice *"
              name="codice"
              value={form.codice}
              onChange={(e) =>
                setForm((f) => ({ ...f, codice: e.target.value }))
              }
              required
              disabled={Boolean(editingId)}
            />
            <Input
              label="Descrizione *"
              name="descrizione"
              value={form.descrizione}
              onChange={(e) =>
                setForm((f) => ({ ...f, descrizione: e.target.value }))
              }
              required
            />
            <Input
              label="Tipo"
              name="tipo"
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
            />
            <Input
              label="Norma"
              name="norma"
              value={form.norma}
              onChange={(e) => setForm((f) => ({ ...f, norma: e.target.value }))}
            />
            <Input
              label="Lotto"
              name="lotto"
              value={form.lotto}
              onChange={(e) => setForm((f) => ({ ...f, lotto: e.target.value }))}
            />
            <Input
              label="Fornitore"
              name="fornitore"
              value={form.fornitore}
              onChange={(e) =>
                setForm((f) => ({ ...f, fornitore: e.target.value }))
              }
            />
            <Input
              label="Riferimento certificato 3.1 (testo)"
              name="certificato31"
              value={form.certificato31}
              onChange={(e) =>
                setForm((f) => ({ ...f, certificato31: e.target.value }))
              }
            />
            <Input
              label="Data carico"
              name="dataCarico"
              type="date"
              value={form.dataCarico}
              onChange={(e) =>
                setForm((f) => ({ ...f, dataCarico: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Certificato PDF (da modulo Documenti)
            </label>
            <select
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.certificatoDocumentoId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  certificatoDocumentoId: e.target.value,
                }))
              }
            >
              <option value="">— Nessun PDF collegato —</option>
              {documentiPerCommessa.map((d) => (
                <option key={d.id} value={d.id}>
                  {String(d.nome ?? d.id)} ({String(d.tipo ?? "")})
                </option>
              ))}
            </select>
            <p className="text-xs text-zinc-500">
              Il documento deve essere della stessa commessa. Caricalo da{" "}
              <Link href="/documenti" className="text-sky-700 underline">
                Documenti
              </Link>
              .
            </p>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

function toInputDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
