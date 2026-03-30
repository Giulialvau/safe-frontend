"use client";

import { Card } from "@/components/ui/card";
import { Table, type Column } from "@/components/ui/table";
import { attrezzatureApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Attrezzatura } from "@/types";
import { useCallback, useEffect, useState } from "react";

export default function AttrezzaturePage() {
  const [rows, setRows] = useState<Attrezzatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await attrezzatureApi.list());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Errore caricamento attrezzature"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Attrezzatura>[] = [
    { key: "nome", header: "Macchinario / attrezzatura" },
    { key: "tipo", header: "Tipo" },
    { key: "codice", header: "Codice interno" },
    { key: "stato", header: "Stato" },
    {
      key: "manutenzione",
      header: "Prossima manutenzione",
      render: (r) =>
        formatDate(
          (r.prossimaManutenzione as string | undefined) ??
            (r.prossima_manutenzione as string | undefined)
        ),
    },
    {
      key: "taratura",
      header: "Prossima taratura",
      render: (r) =>
        formatDate(
          (r.prossimaTaratura as string | undefined) ??
            (r.prossima_taratura as string | undefined)
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="Attrezzature"
        description="Macchinari, manutenzioni programmate, tarature e registrazioni obbligatorie"
      >
        {error ? (
          <p className="mb-4 text-sm text-red-600">{error}</p>
        ) : null}
        {loading ? (
          <p className="text-sm text-zinc-500">Caricamento…</p>
        ) : (
          <Table
            columns={columns}
            data={rows}
            getRowKey={(r) => r.id}
            emptyMessage="Nessuna attrezzatura. Verifica GET /attrezzature."
          />
        )}
      </Card>
    </div>
  );
}
