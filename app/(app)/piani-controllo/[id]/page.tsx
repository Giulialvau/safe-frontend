"use client";

import { Card } from "@/components/ui/card";
import { pianiControlloApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { PianoControllo } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function PianoControlloDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<PianoControllo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const p = await pianiControlloApi.get(id);
      setRow(p ?? null);
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
      <Card title="Piano di controllo">
        <p className="text-sm text-red-600">{error ?? "Non trovato"}</p>
        <Link
          href="/piani-controllo"
          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna all&apos;elenco
        </Link>
      </Card>
    );
  }

  const cid = String(row.commessaId ?? row.commessa_id ?? "");
  const comm = row.commessa;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/piani-controllo" className="text-sky-700 hover:underline">
            Piani di controllo
          </Link>{" "}
          / {String(row.titolo ?? id)}
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {String(row.titolo ?? "Piano")}
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

      <Card title="Controlli ed esito">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Fase</dt>
            <dd>{String(row.fase ?? row.fasi ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Stato</dt>
            <dd>{String(row.stato ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">Esito</dt>
            <dd>{String(row.esito ?? "—")}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">Controlli</dt>
            <dd className="whitespace-pre-wrap">{String(row.controlli ?? "—")}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
