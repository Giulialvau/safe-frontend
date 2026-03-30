"use client";

import { Card } from "@/components/ui/card";
import { tracciabilitaApi } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import type { TracciabilitaRecord } from "@/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Dettaglio singolo record — catena materiale → lotto → componente → commessa */
export default function TracciabilitaRecordPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [row, setRow] = useState<TracciabilitaRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const t = await tracciabilitaApi.get(id);
      setRow(t ?? null);
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
      <Card title="Tracciabilità">
        <p className="text-sm text-red-600">{error ?? "Non trovato"}</p>
        <Link
          href="/tracciabilita"
          className="mt-2 inline-block text-sm text-sky-700 hover:underline"
        >
          Torna all&apos;elenco
        </Link>
      </Card>
    );
  }

  const mid = String(row.materialeId ?? row.materiale_id ?? "");
  const cid = String(row.commessaId ?? row.commessa_id ?? "");
  const mat = row.materiale;
  const comm = row.commessa;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-zinc-500">
          <Link href="/tracciabilita" className="text-sky-700 hover:underline">
            Tracciabilità
          </Link>{" "}
          / record
        </p>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {String(
            row.descrizioneComponente ??
              row.descrizione_componente ??
              row.pezzo ??
              "Record"
          )}
        </h2>
      </div>

      <Card title="Catena materiale → lotto → componente → commessa">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Materiale
            </dt>
            <dd>
              {mid ? (
                <Link
                  className="text-sky-700 hover:underline"
                  href={`/materiali/${mid}`}
                >
                  {String(mat?.codice ?? mat?.descrizione ?? mid)}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Lotto
            </dt>
            <dd>{String(row.lotto ?? mat?.lotto ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Componente
            </dt>
            <dd>
              {String(
                row.descrizioneComponente ??
                  row.descrizione_componente ??
                  "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Posizione
            </dt>
            <dd>{String(row.posizione ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Quantità
            </dt>
            <dd>{String(row.quantita ?? "—")}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Commessa
            </dt>
            <dd>
              {cid ? (
                <Link
                  className="text-sky-700 hover:underline"
                  href={`/commesse/${cid}`}
                >
                  {String(comm?.codice ?? cid)}
                </Link>
              ) : (
                "—"
              )}
              {cid ? (
                <>
                  {" "}
                  <Link
                    className="text-xs text-sky-600 hover:underline"
                    href={`/tracciabilita/${cid}`}
                  >
                    Vista tracciabilità commessa
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">
              Rif. disegno
            </dt>
            <dd>
              {String(row.riferimentoDisegno ?? row.riferimento_disegno ?? "—")}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-zinc-500">Note</dt>
            <dd className="whitespace-pre-wrap">{String(row.note ?? "—")}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
