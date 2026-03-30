"use client";

import { Card } from "@/components/ui/card";
import { UploadDocument } from "@/components/ui/upload-document";
import { documentiApi, wpsApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Commessa, Documento, Wps } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function WpsDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<Wps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docs, setDocs] = useState<Documento[]>([]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const w = await wpsApi.get(id);
      setRow(w ?? null);
      const c = w
        ? String(w.commessaId ?? w.commessa_id ?? "")
        : "";
      if (c) {
        try {
          setDocs(await documentiApi.byCommessa(c));
        } catch {
          setDocs([]);
        }
      } else {
        setDocs([]);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (error || !row) {
    return (
      <Card title="WPS">
        <p className="text-sm text-red-600">{error ?? "Non trovato"}</p>
        <Link href="/wps" className="mt-2 inline-block text-sm text-sky-700 hover:underline">
          Torna alle WPS
        </Link>
      </Card>
    );
  }

  const cid = String(row.commessaId ?? row.commessa_id ?? "");
  const comm = row.commessa as Commessa | undefined;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/wps" className="text-sky-700 hover:underline">
            WPS
          </Link>{" "}
          / {String(row.codice ?? id)}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {String(row.descrizione ?? row.codice ?? "WPS")}
        </h2>
        {cid ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Commessa:{" "}
            <Link className="text-sky-700 hover:underline" href={`/commesse/${cid}`}>
              {String(comm?.codice ?? cid)}
            </Link>
          </p>
        ) : null}
      </div>

      <Card title="Specifiche">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Processo</dt>
            <dd>{String(row.processo ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Spessore</dt>
            <dd>{String(row.spessore ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Materiale base</dt>
            <dd>{String(row.materialeBase ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Scadenza</dt>
            <dd>
              {formatDate(
                (row.scadenza as string | undefined) ??
                  (row.dataScadenza as string | undefined) ??
                  (row.data_scadenza as string | undefined)
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">Note</dt>
            <dd className="whitespace-pre-wrap">{String(row.note ?? "—")}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-zinc-500">
          Modifica da elenco globale o dalla scheda commessa (tab WPS).
        </p>
      </Card>

      {cid ? (
        <Card
          title="Documentazione WPS (PDF)"
          description="Scheda WPS in PDF archiviata come documento di commessa (tipo wps_pdf)."
        >
          <p className="mb-3 text-sm">
            <Link
              className="text-sky-700 hover:underline dark:text-sky-400"
              href={`/documenti?commessaId=${cid}`}
            >
              Modulo Documenti (commessa)
            </Link>
          </p>
          <UploadDocument
            commessaId={cid}
            tipo="wps_pdf"
            defaultTitle={`WPS ${String(row.codice ?? id)} — scheda PDF`}
            onSuccess={() => void load()}
            onError={(msg) => setError(msg)}
          />
          <ul className="mt-4 space-y-1 text-sm">
            {docs
              .filter((d) => String(d.tipo ?? "") === "wps_pdf")
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
        </Card>
      ) : (
        <Card title="Documentazione WPS (PDF)">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Associa una commessa alla WPS per abilitare l&apos;upload nel
            fascicolo documenti.
          </p>
        </Card>
      )}
    </div>
  );
}
