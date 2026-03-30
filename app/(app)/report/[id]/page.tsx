"use client";

import { TracciabilitaPdfActions } from "@/app/(app)/tracciabilita/components/tracciabilita-pdf-actions";
import { Card } from "@/components/ui/card";
import { UploadDocument } from "@/components/ui/upload-document";
import { reportCommessaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** `[id]` = ID commessa — anteprima GET /report/commessa/:id */
export default function ReportCommessaPage() {
  const params = useParams();
  const commessaId = String(params.id ?? "");
  const [json, setJson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const raw = await reportCommessaApi.byCommessa(commessaId);
      setJson(JSON.stringify(raw, null, 2));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Errore report");
      setJson(null);
    } finally {
      setLoading(false);
    }
  }, [commessaId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/report" className="text-sky-700 hover:underline">
            Report
          </Link>{" "}
          / commessa
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Report commessa
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          ID:{" "}
          <Link
            className="text-sky-700 hover:underline"
            href={`/commesse/${commessaId}`}
          >
            {commessaId}
          </Link>
        </p>
      </div>

      <Card
        title="PDF collegati alla commessa"
        description="GET /report/:tipo?commessaId= — materiali, tracciabilità, fascicolo tecnico, report commessa"
      >
        <TracciabilitaPdfActions commessaId={commessaId} />
      </Card>

      <Card title="Anteprima JSON" description="GET /report/commessa/:id">
        {loading ? (
          <p className="text-sm text-zinc-500">Caricamento…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : json ? (
          <pre className="max-h-[min(70vh,520px)] overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
            {json}
          </pre>
        ) : (
          <p className="text-sm text-zinc-500">Nessun dato.</p>
        )}
      </Card>

      <Card
        title="Allegati fascicolo tecnico"
        description="PDF o scansioni archiviati nel modulo Documenti (tipo report_fascicolo)."
      >
        <p className="mb-4 text-sm">
          <Link
            className="text-sky-700 hover:underline dark:text-sky-400"
            href={`/documenti?commessaId=${commessaId}`}
          >
            Vai ai documenti della commessa
          </Link>
        </p>
        {uploadErr ? (
          <p className="mb-3 text-sm text-red-600">{uploadErr}</p>
        ) : null}
        <UploadDocument
          commessaId={commessaId}
          tipo="report_fascicolo"
          defaultTitle={`Fascicolo tecnico commessa ${commessaId.slice(0, 8)}…`}
          onSuccess={() => setUploadErr(null)}
          onError={(msg) => setUploadErr(msg)}
        />
      </Card>
    </div>
  );
}
