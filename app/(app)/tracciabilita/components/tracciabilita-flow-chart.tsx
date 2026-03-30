"use client";

import { groupTracciabilitaByMateriale, lottoLabel } from "@/lib/tracciabilita-chain";
import type { TracciabilitaRecord } from "@/types";

type Props = {
  rows: TracciabilitaRecord[];
  maxGroups?: number;
};

/**
 * Grafico di flusso: materiale/lotto → componenti (SVG).
 */
export function TracciabilitaFlowChart({ rows, maxGroups = 8 }: Props) {
  const grouped = groupTracciabilitaByMateriale(rows);
  const keys = [...grouped.keys()].slice(0, maxGroups);
  const w = 520;
  const rowH = 36;
  const pad = 16;
  const h = pad * 2 + keys.length * rowH + 40;

  if (keys.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Nessun dato per il diagramma di flusso.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
      <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Flusso sintetico: materiale/lotto → componenti (max {maxGroups} gruppi)
      </p>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="max-w-full"
        aria-hidden
      >
        {keys.map((key, gi) => {
          const list = grouped.get(key) ?? [];
          const first = list[0];
          const m = first?.materiale as { codice?: string } | undefined;
          const matLabel = (m?.codice ?? "Mat.").slice(0, 14);
          const lot = lottoLabel(first);
          const y0 = pad + gi * rowH;
          const comp = list
            .map((r) =>
              String(
                r.descrizioneComponente ??
                  r.descrizione_componente ??
                  r.posizione ??
                  "—"
              ).slice(0, 22)
            )
            .filter(Boolean);
          const compText = `${comp.slice(0, 3).join(" · ")}${comp.length > 3 ? "…" : ""}`;

          return (
            <g key={key}>
              <rect
                x={pad}
                y={y0}
                width={100}
                height={28}
                rx={4}
                fill="#e8f4fc"
                stroke="#1e3a5f"
              />
              <text
                x={pad + 8}
                y={y0 + 18}
                fontSize={10}
                fontFamily="Arial,Helvetica,sans-serif"
                fill="#1e3a5f"
              >
                {matLabel}
              </text>
              <text
                x={pad + 8}
                y={y0 + 26}
                fontSize={8}
                fontFamily="Arial,Helvetica,sans-serif"
                fill="#555"
              >
                Lotto {lot}
              </text>
              <line
                x1={pad + 100}
                y1={y0 + 14}
                x2={pad + 140}
                y2={y0 + 14}
                stroke="#94a3b8"
                strokeWidth={1.5}
              />
              <polygon
                points={`${pad + 136},${y0 + 10} ${pad + 144},${y0 + 14} ${pad + 136},${y0 + 18}`}
                fill="#94a3b8"
              />
              <rect
                x={pad + 150}
                y={y0}
                width={340}
                height={28}
                rx={4}
                fill="#f1f5f9"
                stroke="#64748b"
              />
              <text
                x={pad + 158}
                y={y0 + 18}
                fontSize={9}
                fontFamily="Arial,Helvetica,sans-serif"
                fill="#334155"
              >
                {compText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
