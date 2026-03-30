"use client";

import { Card } from "@/components/ui/card";
import {
  materialeKeyFromRecord,
  uniqueLottiFromMateriali,
} from "@/lib/tracciabilita-chain";
import type { Materiale, TracciabilitaRecord } from "@/types";

export type TracciabilitaSummaryCardsProps = {
  commessaCodice?: string;
  /** Se vuoto, i conteggi materiali/lotti si deducono dai record mostrati */
  materiali: Materiale[];
  tracciabilita: TracciabilitaRecord[];
};

export function TracciabilitaSummaryCards({
  commessaCodice,
  materiali,
  tracciabilita,
}: TracciabilitaSummaryCardsProps) {
  const lotti =
    materiali.length > 0
      ? uniqueLottiFromMateriali(materiali)
      : [
          ...new Set(
            tracciabilita
              .map((r) => r.materiale?.lotto ?? r.lotto)
              .filter((x): x is string => x != null && String(x).trim() !== "")
              .map((x) => String(x).trim())
          ),
        ].sort();

  const materialiCount =
    materiali.length > 0
      ? materiali.length
      : new Set(tracciabilita.map((r) => materialeKeyFromRecord(r))).size;

  const componenti = new Set(
    tracciabilita.map((r) =>
      String(
        r.descrizioneComponente ??
          r.descrizione_componente ??
          r.posizione ??
          r.id
      ).trim()
    )
  ).size;

  const items = [
    {
      label: "Materiali censiti",
      value: String(materialiCount),
      hint:
        materiali.length > 0
          ? "Anagrafica lotti commessa"
          : "Stima da record filtrati",
    },
    {
      label: "Lotti distinti",
      value: String(lotti.length),
      hint:
        materiali.length > 0
          ? "Da tabella materiali"
          : "Da dati tracciabilità",
    },
    {
      label: "Collegamenti tracciabilità",
      value: String(tracciabilita.length),
      hint: "Materiale → componente → posizione",
    },
    {
      label: "Componenti (voci)",
      value: String(componenti),
      hint: "Descrizioni/posizioni uniche",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => (
        <Card key={it.label} title={it.label} description={it.hint}>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {it.value}
          </p>
          {commessaCodice ? (
            <p className="mt-1 text-xs text-zinc-500">Commessa {commessaCodice}</p>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
