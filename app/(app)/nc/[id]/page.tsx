"use client";

import { NcFormFields, emptyNcForm, type NcFormState } from "../form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadDocument } from "@/components/ui/upload-document";
import { commesseApi, documentiApi, nonConformitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, Documento, NonConformita } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function formatDateIn(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function NcDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");

  const [row, setRow] = useState<NonConformita | null>(null);
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NcFormState>(emptyNcForm());
  const [docs, setDocs] = useState<Documento[]>([]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [raw, c] = await Promise.all([
        nonConformitaApi.get(id),
        commesseApi.list(),
      ]);
      setCommesse(c);
      if (!raw) {
        setError("NC non trovata");
        return;
      }
      setRow(raw);
      const commId = String(raw.commessaId ?? raw.commessa_id ?? "");
      if (commId) {
        try {
          setDocs(await documentiApi.byCommessa(commId));
        } catch {
          setDocs([]);
        }
      } else {
        setDocs([]);
      }
      setForm({
        titolo: String(raw.titolo ?? ""),
        descrizione: String(raw.descrizione ?? ""),
        tipo: String(raw.tipo ?? "INTERNA"),
        gravita: String(raw.gravita ?? "MEDIA"),
        stato: String(raw.stato ?? "APERTA"),
        azioniCorrettive: String(raw.azioniCorrettive ?? ""),
        dataApertura: formatDateIn(
          (raw.dataApertura as string | undefined) ??
            (raw.data_apertura as string | undefined)
        ),
        dataChiusura: formatDateIn(
          (raw.dataChiusura as string | undefined) ??
            (raw.data_chiusura as string | undefined)
        ),
        commessaId: String(raw.commessaId ?? raw.commessa_id ?? ""),
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore caricamento NC");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titolo.trim() || !form.descrizione.trim()) {
      setError("Titolo e descrizione sono obbligatori.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
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
      await nonConformitaApi.update(id, body);
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
    if (!window.confirm("Eliminare questa NC?")) return;
    setError(null);
    try {
      await nonConformitaApi.remove(id);
      router.replace("/nc");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Eliminazione non riuscita"
      );
    }
  }

  if (loading && !row) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (error && !row) {
    return (
      <Card title="Errore">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/nc" className="mt-2 inline-block text-sm text-sky-700 hover:underline">
          Torna alla lista
        </Link>
      </Card>
    );
  }

  if (!row) return null;

  const cid = commessaId(row);
  const comm = row.commessa as { codice?: string } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/nc" className="text-sky-700 hover:underline">
              Non conformità
            </Link>{" "}
            / {row.titolo ?? id}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {String(row.titolo ?? "NC")}
          </h2>
          {cid ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Commessa:{" "}
              <Link
                className="text-sky-700 hover:underline dark:text-sky-400"
                href={`/commesse/${cid}`}
              >
                {String(comm?.codice ?? cid)}
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="text-red-700" onClick={() => void remove()}>
            Elimina
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Card title="Riepilogo" description="Stato e date">
        <dl className="grid gap-2 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Tipo</dt>
            <dd>{String(row.tipo ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Gravità</dt>
            <dd>{String(row.gravita ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Stato</dt>
            <dd>{String(row.stato ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Apertura</dt>
            <dd>
              {formatDate(
                (row.dataApertura as string | undefined) ??
                  (row.data_apertura as string | undefined)
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {cid ? (
        <Card
          title="Allegati ed evidenze"
          description="Documenti di commessa caricati come evidenza NC (tipo «nc_allegato»). Il backend non espone ancora un campo allegati sulla NC: usare il modulo Documenti."
        >
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              className="text-sky-700 underline dark:text-sky-400"
              href={`/documenti?commessaId=${cid}`}
            >
              Apri Documenti filtrati per commessa
            </Link>
          </p>
          <UploadDocument
            commessaId={cid}
            tipo="nc_allegato"
            defaultTitle={`NC ${String(row.titolo ?? id).slice(0, 80)} — allegato`}
            onSuccess={() => void load()}
            onError={(msg) => setError(msg)}
          />
          <ul className="mt-4 space-y-2 text-sm">
            {docs
              .filter((d) => String(d.tipo ?? "") === "nc_allegato")
              .map((d) => (
                <li key={d.id}>
                  <Link
                    className="text-sky-700 hover:underline dark:text-sky-400"
                    href={`/documenti/${d.id}`}
                  >
                    {String(d.nome ?? d.titolo ?? d.id)}
                  </Link>
                </li>
              ))}
          </ul>
          {docs.filter((d) => String(d.tipo ?? "") === "nc_allegato").length ===
          0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              Nessun documento con tipo nc_allegato. Dopo l&apos;upload comparirà
              qui.
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card title="Modifica" description="Salvataggio con PATCH /non-conformita/:id">
        <form className="space-y-4" onSubmit={save}>
          <NcFormFields
            form={form}
            setForm={setForm}
            commesse={commesse}
            showCommessaSelect={false}
            lockCommessa
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function commessaId(r: NonConformita): string {
  return String(r.commessaId ?? r.commessa_id ?? "");
}
