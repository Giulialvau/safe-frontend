"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadDocument } from "@/components/ui/upload-document";
import { documentiApi, materialiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Materiale } from "@/types";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function MaterialeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<Materiale | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [pdfOpening, setPdfOpening] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const m = await materialiApi.get(id);
      setRow(m ?? null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openCertPdf(docId: string) {
    setPdfOpening(docId);
    try {
      const blob = await documentiApi.downloadFile(docId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setFileError("Impossibile aprire il file.");
    } finally {
      setPdfOpening(null);
    }
  }

  async function remove() {
    if (!window.confirm("Eliminare questo materiale?")) return;
    try {
      await materialiApi.remove(id);
      router.replace("/materiali");
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Eliminazione non riuscita");
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (loadError || !row) {
    return (
      <Card title="Materiale">
        <p className="text-sm text-red-600">{loadError ?? "Non trovato"}</p>
        <Link href="/materiali" className="mt-2 inline-block text-sm text-sky-700 hover:underline">
          Torna ai materiali
        </Link>
      </Card>
    );
  }

  const cid = String(row.commessaId ?? row.commessa_id ?? "");
  const comm = row.commessa as { codice?: string } | undefined;
  const doc = row.certificatoDocumento as { id?: string; nome?: string } | undefined;
  const docId = row.certificatoDocumentoId ?? doc?.id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/materiali" className="text-sky-700 hover:underline">
              Materiali
            </Link>{" "}
            / {String(row.codice ?? id)}
          </p>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {String(row.descrizione ?? row.codice ?? "Materiale")}
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
        <Button type="button" variant="ghost" className="text-red-700" onClick={() => void remove()}>
          Elimina
        </Button>
      </div>

      <Card title="Dati lotto / certificato">
        {fileError ? (
          <p className="mb-3 text-sm text-red-600">{fileError}</p>
        ) : null}
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Codice</dt>
            <dd>{String(row.codice ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Lotto</dt>
            <dd>{String(row.lotto ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Fornitore</dt>
            <dd>{String(row.fornitore ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Norma</dt>
            <dd>{String(row.norma ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Rif. 3.1</dt>
            <dd>{String(row.certificato31 ?? row.certificato_3_1 ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Data carico</dt>
            <dd>
              {formatDate(
                (row.dataCarico as string | undefined) ??
                  (row.data_carico as string | undefined)
              )}
            </dd>
          </div>
        </dl>
        {docId ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={pdfOpening === String(docId)}
              onClick={() => void openCertPdf(String(docId))}
            >
              {pdfOpening === String(docId) ? "Apertura…" : "Apri certificato"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">
            Nessun certificato collegato. Usa il caricamento qui sotto o{" "}
            <Link href="/documenti" className="text-sky-700 underline">
              Documenti
            </Link>
            .
          </p>
        )}
      </Card>

      {cid ? (
        <Card
          title="Carica certificato EN 10204"
          description="Il file viene associato a questo lotto (PATCH materiale con certificatoDocumentoId)."
        >
          {uploadErr ? (
            <p className="mb-3 text-sm text-red-600">{uploadErr}</p>
          ) : null}
          <UploadDocument
            commessaId={cid}
            tipo="certificato_en10204"
            defaultTitle={`Certificato ${String(row.codice ?? id)}`}
            onSuccess={async (res) => {
              setUploadErr(null);
              try {
                await materialiApi.update(id, {
                  certificatoDocumentoId: res.id,
                });
                await load();
              } catch (e) {
                setUploadErr(
                  e instanceof ApiError
                    ? e.message
                    : "Collegamento certificato non riuscito"
                );
              }
            }}
            onError={(msg) => setUploadErr(msg)}
          />
        </Card>
      ) : null}
    </div>
  );
}
