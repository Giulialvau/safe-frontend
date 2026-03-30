"use client";

import { Card } from "@/components/ui/card";
import { auditApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import type { Audit } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AuditDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const a = await auditApi.get(id);
      setRow(a ?? null);
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
      <Card title="Audit">
        <p className="text-sm text-red-600">{error ?? "Non trovato"}</p>
        <Link href="/audit" className="mt-2 inline-block text-sm text-sky-700 hover:underline">
          Torna agli audit
        </Link>
      </Card>
    );
  }

  const cid = String(row.commessaId ?? row.commessa_id ?? "");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/audit" className="text-sky-700 hover:underline">
            Audit FPC
          </Link>{" "}
          / {String(row.titolo ?? id)}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {String(row.titolo ?? "Audit")}
        </h2>
        {cid ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Commessa:{" "}
            <Link className="text-sky-700 hover:underline" href={`/commesse/${cid}`}>
              {cid}
            </Link>
          </p>
        ) : null}
      </div>

      <Card title="Esito e pianificazione">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Stato</dt>
            <dd>{String(row.stato ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Esito</dt>
            <dd>{String(row.esito ?? "—")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">Data programmata</dt>
            <dd>
              {formatDate(
                (row.dataProgrammata as string | undefined) ??
                  (row.data_programmata as string | undefined)
              )}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
