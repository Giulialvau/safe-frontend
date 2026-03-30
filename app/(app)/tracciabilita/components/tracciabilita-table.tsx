"use client";

import { Button } from "@/components/ui/button";
import { Table, type Column } from "@/components/ui/table";
import {
  groupTracciabilitaByMateriale,
  lottoLabel,
  materialeKeyFromRecord,
} from "@/lib/tracciabilita-chain";
import type { TracciabilitaRecord } from "@/types";
import Link from "next/link";

function formatQty(q: unknown): string {
  if (q === null || q === undefined) return "—";
  if (typeof q === "number") return String(q);
  return String(q);
}

export type TracciabilitaTableProps = {
  rows: TracciabilitaRecord[];
  mode?: "flat" | "hierarchical";
  showCommessaColumn?: boolean;
  onEdit?: (r: TracciabilitaRecord) => void;
  onDelete?: (r: TracciabilitaRecord) => void;
};

export function TracciabilitaTable({
  rows,
  mode = "flat",
  showCommessaColumn = false,
  onEdit,
  onDelete,
}: TracciabilitaTableProps) {
  const baseCols: Column<TracciabilitaRecord>[] = [
    ...(showCommessaColumn
      ? ([
          {
            key: "commessa",
            header: "Commessa",
            render: (r) => {
              const c = r.commessa as { codice?: string } | undefined;
              const cid = r.commessaId ?? r.commessa_id;
              if (!cid) return "—";
              return (
                <Link
                  className="text-sky-700 hover:underline dark:text-sky-400"
                  href={`/commesse/${cid}`}
                >
                  {String(c?.codice ?? cid)}
                </Link>
              );
            },
          },
        ] as Column<TracciabilitaRecord>[])
      : []),
    {
      key: "materiale",
      header: "Materiale → lotto",
      render: (r) => {
        const m = r.materiale as
          | { codice?: string; lotto?: string; descrizione?: string }
          | undefined;
        return (
          <span>
            <span className="font-medium">{String(m?.codice ?? "—")}</span>
            <span className="text-zinc-500">
              {" "}
              · lotto {lottoLabel(r)}
            </span>
            {m?.descrizione ? (
              <span className="block text-xs text-zinc-500">
                {m.descrizione}
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "componente",
      header: "Componente",
      render: (r) => (
        <Link
          className="font-medium text-sky-700 hover:underline dark:text-sky-400"
          href={`/tracciabilita/record/${r.id}`}
        >
          {String(
            r.descrizioneComponente ?? r.descrizione_componente ?? "—"
          )}
        </Link>
      ),
    },
    {
      key: "posizione",
      header: "Posizione",
      render: (r) => String(r.posizione ?? "—"),
    },
    {
      key: "disegno",
      header: "Rif. disegno",
      render: (r) =>
        String(r.riferimentoDisegno ?? r.riferimento_disegno ?? "—"),
    },
    {
      key: "quantita",
      header: "Qtà",
      render: (r) => formatQty(r.quantita),
    },
  ];

  const actionCol: Column<TracciabilitaRecord> | null =
    onEdit || onDelete
      ? {
          key: "actions",
          header: "",
          render: (r) => (
            <div className="flex flex-wrap gap-2">
              {onEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => onEdit(r)}
                >
                  Modifica
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-red-700"
                  onClick={() => onDelete(r)}
                >
                  Elimina
                </Button>
              ) : null}
            </div>
          ),
        }
      : null;

  const columns = [...baseCols, ...(actionCol ? [actionCol] : [])];

  if (mode === "flat") {
    return (
      <Table
        columns={columns}
        data={rows}
        getRowKey={(r) => r.id}
        emptyMessage="Nessun collegamento registrato."
      />
    );
  }

  const grouped = groupTracciabilitaByMateriale(rows);
  const keys = [...grouped.keys()];

  if (keys.length === 0) {
    return (
      <p className="text-sm text-zinc-500">Nessun collegamento registrato.</p>
    );
  }

  return (
    <div className="space-y-6">
      {keys.map((key) => {
        const groupRows = grouped.get(key) ?? [];
        const first = groupRows[0];
        const m = first?.materiale as
          | { codice?: string; descrizione?: string }
          | undefined;
        const title = m?.codice
          ? `${m.codice} — lotto ${lottoLabel(first)}`
          : `Materiale ${materialeKeyFromRecord(first).slice(0, 12)}…`;

        return (
          <div
            key={key}
            className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700"
          >
            <div className="bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              {title}
              {m?.descrizione ? (
                <span className="ml-2 font-normal text-zinc-600 dark:text-zinc-400">
                  ({m.descrizione})
                </span>
              ) : null}
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {groupRows.length} collegamento/i
              </span>
            </div>
            <Table
              columns={columns}
              data={groupRows}
              getRowKey={(r) => r.id}
              emptyMessage="—"
            />
          </div>
        );
      })}
    </div>
  );
}
