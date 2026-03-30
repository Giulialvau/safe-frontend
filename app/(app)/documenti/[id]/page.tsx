"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { documentiApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Documento } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function classifyPreview(
  blob: Blob,
  nome: string
): "pdf" | "image" | "other" {
  const t = blob.type;
  if (t === "application/pdf") return "pdf";
  if (t.startsWith("image/")) return "image";
  const lower = nome.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(jpe?g|png|gif|webp)$/i.test(lower)) return "image";
  return "other";
}

export default function DocumentoDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<"pdf" | "image" | "other">(
    "other"
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const d = await documentiApi.get(id);
      setRow(d ?? null);
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : "Errore caricamento");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!row?.id) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    const nome = String(row.nome ?? row.titolo ?? "file");
    setPreviewLoading(true);
    setPreviewUrl(null);
    setPreviewErr(null);
    void (async () => {
      try {
        const blob = await documentiApi.downloadFile(id);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        setPreviewKind(classifyPreview(blob, nome));
      } catch (e) {
        if (!cancelled) {
          setPreviewErr(
            e instanceof ApiError ? e.message : "Anteprima non disponibile"
          );
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, row?.id, row?.nome, row?.titolo]);

  async function downloadToDevice() {
    if (!row) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const blob = await documentiApi.downloadFile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(row.nome ?? "documento").replace(/[^\w.\-]+/g, "_");
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError(
        e instanceof ApiError ? e.message : "Download non riuscito"
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Caricamento…</p>;
  }

  if (loadError || !row) {
    return (
      <Card title="Documento">
        <p className="text-sm text-red-600">{loadError ?? "Non trovato"}</p>
        <Link
          href="/documenti"
          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna ai documenti
        </Link>
      </Card>
    );
  }

  const cid = String(row.commessaId ?? row.commessa_id ?? "");
  const comm = row.commessa as { codice?: string; cliente?: string } | undefined;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/documenti" className="text-sky-700 hover:underline">
            Documenti
          </Link>{" "}
          / {String(row.titolo ?? row.nome ?? id)}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {String(row.titolo ?? row.nome ?? "Documento")}
        </h2>
      </div>

      <Card title="Anteprima" description="PDF o immagine (download autenticato)">
        {previewErr ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">{previewErr}</p>
        ) : null}
        {previewLoading ? (
          <p className="text-sm text-zinc-500">Caricamento anteprima…</p>
        ) : previewUrl && previewKind === "pdf" ? (
          <iframe
            title="Anteprima PDF"
            src={previewUrl}
            className="h-[min(70vh,640px)] w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
          />
        ) : previewUrl && previewKind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={String(row.nome ?? "Anteprima")}
            className="max-h-[min(70vh,640px)] w-auto max-w-full rounded-lg border border-zinc-200 object-contain dark:border-zinc-700"
          />
        ) : previewUrl ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Anteprima non disponibile per questo tipo di file. Usa Scarica.
          </p>
        ) : (
          <p className="text-sm text-zinc-500">Nessun file da mostrare.</p>
        )}
      </Card>

      <Card title="Metadati" description="Dati esposti dall’API">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Tipo</dt>
            <dd>{String(row.tipo ?? row.categoria ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Versione</dt>
            <dd>{String(row.versione ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Stato</dt>
            <dd>
              {String(
                row.statoApprovazione ?? row.stato_approvazione ?? row.stato ?? "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Scadenza</dt>
            <dd>
              {formatDate(
                (row.dataScadenza as string | undefined) ??
                  (row.data_scadenza as string | undefined)
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">Commessa</dt>
            <dd>
              {cid ? (
                <Link
                  className="text-sky-700 hover:underline dark:text-sky-400"
                  href={`/commesse/${cid}`}
                >
                  {String(comm?.codice ?? cid)}
                  {comm?.cliente ? ` — ${comm.cliente}` : ""}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
        {downloadError ? (
          <p className="mb-3 text-sm text-red-600">{downloadError}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void downloadToDevice()}
            disabled={downloading}
          >
            {downloading ? "Download…" : "Scarica file"}
          </Button>
          <Link
            href="/documenti"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Torna all&apos;elenco
          </Link>
        </div>
      </Card>
    </div>
  );
}
