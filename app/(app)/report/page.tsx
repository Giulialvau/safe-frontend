"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  reportApi,
  reportCommessaApi,
  reportPdfApi,
  type ReportPdfTipo,
} from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const PDF_ACTIONS: {
  tipo: ReportPdfTipo;
  label: string;
  fileHint: string;
}[] = [
  { tipo: "dop", label: "Genera DoP", fileHint: "dop" },
  { tipo: "ce", label: "Genera CE", fileHint: "marcatura-ce" },
  {
    tipo: "fascicolo-tecnico",
    label: "Genera Fascicolo tecnico",
    fileHint: "fascicolo-tecnico",
  },
  {
    tipo: "materiali",
    label: "Genera Report materiali",
    fileHint: "report-materiali",
  },
  {
    tipo: "tracciabilita",
    label: "Genera Report tracciabilità",
    fileHint: "report-tracciabilita",
  },
  {
    tipo: "commessa",
    label: "Genera Report commessa",
    fileHint: "report-commessa",
  },
];

export default function ReportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(
    null
  );
  const [fornitori, setFornitori] = useState<unknown>(null);
  const [commessaReportId, setCommessaReportId] = useState("");
  const [commessaReportJson, setCommessaReportJson] = useState<string | null>(
    null
  );
  const [loadingCommessaReport, setLoadingCommessaReport] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState<ReportPdfTipo | null>(
    null
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const [dash, matForn] = await Promise.all([
        reportApi.dashboard().catch(() => null),
        reportApi.materialiFornitori().catch(() => null),
      ]);
      setDashboard(
        dash && typeof dash === "object"
          ? (dash as Record<string, unknown>)
          : null
      );
      setFornitori(matForn);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento reportistica"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const loadCommessaReport = useCallback(async () => {
    const id = commessaReportId.trim();
    if (!id) {
      window.alert("Inserisci l’ID della commessa.");
      return;
    }
    setLoadingCommessaReport(true);
    setCommessaReportJson(null);
    try {
      const raw = await reportCommessaApi.byCommessa(id);
      setCommessaReportJson(JSON.stringify(raw, null, 2));
    } catch (e) {
      window.alert(
        e instanceof ApiError ? e.message : "Errore report commessa"
      );
    } finally {
      setLoadingCommessaReport(false);
    }
  }, [commessaReportId]);

  const downloadPdf = useCallback(
    async (tipo: ReportPdfTipo, fileHint: string) => {
      const id = commessaReportId.trim();
      if (!id) {
        window.alert("Inserisci l’ID della commessa per generare il PDF.");
        return;
      }
      setPdfDownloading(tipo);
      try {
        const blob = await reportPdfApi.download(tipo, id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileHint}-${id.slice(0, 8)}.pdf`;
        a.rel = "noopener";
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        window.alert(
          e instanceof ApiError ? e.message : "Download PDF non riuscito."
        );
      } finally {
        setPdfDownloading(null);
      }
    },
    [commessaReportId]
  );

  return (
    <div className="space-y-6">
      <Card
        title="Reportistica EN 1090"
        description="Sintesi da GET /report/dashboard, report per commessa e PDF da GET /report/:tipo?commessaId="
        actions={
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Aggiorna
          </Button>
        }
      >
        {error ? (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-500">Caricamento…</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dashboard (<code className="text-xs">GET /report/dashboard</code>)
              </h3>
              {dashboard ? (
                <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
                  {JSON.stringify(dashboard, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Nessun dato o endpoint non disponibile.
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Materiali per fornitore (
                <code className="text-xs">GET /report/materiali/fornitori</code>)
              </h3>
              {fornitori != null ? (
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
                  {JSON.stringify(fornitori, null, 2)}
                </pre>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Dato non disponibile.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Report per commessa"
        description="Anteprima JSON: GET /report/commessa/:id — PDF: GET /report/commessa?commessaId= (report completo)"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Input
              label="ID commessa"
              value={commessaReportId}
              onChange={(e) => setCommessaReportId(e.target.value)}
              placeholder="UUID commessa"
            />
          </div>
          <Button
            type="button"
            onClick={() => void loadCommessaReport()}
            disabled={loadingCommessaReport}
          >
            {loadingCommessaReport ? "Caricamento…" : "Carica report JSON"}
          </Button>
          <Link
            href="/commesse"
            className="text-sm text-sky-700 hover:underline dark:text-sky-400"
          >
            Vai alle commesse
          </Link>
          {commessaReportId.trim() ? (
            <Link
              href={`/report/${commessaReportId.trim()}`}
              className="text-sm text-sky-700 hover:underline dark:text-sky-400"
            >
              Apri vista dedicata
            </Link>
          ) : null}
        </div>
        {commessaReportJson ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
            {commessaReportJson}
          </pre>
        ) : null}
      </Card>

      <Card
        title="Generazione documenti (PDF)"
        description="GET /report/:tipo?commessaId= — risposta application/pdf (generazione lato server con pdf-lib)"
      >
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Inserisci l&apos;ID commessa nel campo sopra, poi genera il PDF
          desiderato. Ogni pulsante chiama il relativo endpoint e avvia il
          download.
        </p>
        <div className="flex flex-wrap gap-2">
          {PDF_ACTIONS.map(({ tipo, label, fileHint }) => (
            <Button
              key={tipo}
              type="button"
              variant="secondary"
              disabled={pdfDownloading !== null}
              onClick={() => void downloadPdf(tipo, fileHint)}
            >
              {pdfDownloading === tipo ? "Generazione…" : label}
            </Button>
          ))}
        </div>
      </Card>

      <Card title="Tipologie di report" description="Sezioni previste dalla gestione qualità">
        <ul className="list-inside list-disc space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Report commessa: stato avanzamento, documenti, NC collegate.</li>
          <li>Report materiali: certificati 3.1 e tracciabilità lotti.</li>
          <li>Report NC: trend, tempi di chiusura, azioni correttive.</li>
          <li>Report audit: esiti, finding, azioni.</li>
        </ul>
      </Card>
    </div>
  );
}
