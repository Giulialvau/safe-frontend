"use client";

import { Button } from "@/components/ui/button";
import { reportPdfApi, type ReportPdfTipo } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { useCallback, useState } from "react";

const PDFS: {
  tipo: ReportPdfTipo;
  label: string;
  fileHint: string;
}[] = [
  { tipo: "materiali", label: "PDF materiali", fileHint: "report-materiali" },
  {
    tipo: "tracciabilita",
    label: "PDF tracciabilità",
    fileHint: "report-tracciabilita",
  },
  {
    tipo: "fascicolo-tecnico",
    label: "PDF fascicolo tecnico",
    fileHint: "fascicolo-tecnico",
  },
  { tipo: "commessa", label: "PDF report commessa", fileHint: "report-commessa" },
];

export function TracciabilitaPdfActions({ commessaId }: { commessaId: string }) {
  const [downloading, setDownloading] = useState<ReportPdfTipo | null>(null);

  const download = useCallback(
    async (tipo: ReportPdfTipo, fileHint: string) => {
      setDownloading(tipo);
      try {
        const blob = await reportPdfApi.download(tipo, commessaId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileHint}-${commessaId.slice(0, 8)}.pdf`;
        a.rel = "noopener";
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        window.alert(
          e instanceof ApiError ? e.message : "Download PDF non riuscito."
        );
      } finally {
        setDownloading(null);
      }
    },
    [commessaId]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {PDFS.map(({ tipo, label, fileHint }) => (
        <Button
          key={tipo}
          type="button"
          variant="secondary"
          disabled={downloading !== null}
          onClick={() => void download(tipo, fileHint)}
        >
          {downloading === tipo ? "Generazione…" : label}
        </Button>
      ))}
    </div>
  );
}
