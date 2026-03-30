"use client";

import type {
  CommessaPhaseCountMap,
  CommessaPhaseMap,
  CommessaPhaseTabId,
} from "@/hooks/use-commessa-phase-status";

const STEPS: { id: CommessaPhaseTabId; label: string }[] = [
  { id: "overview", label: "Anagrafica" },
  { id: "materiali", label: "Materiali" },
  { id: "documenti", label: "Documenti" },
  { id: "checklist", label: "Checklist" },
  { id: "tracciabilita", label: "Tracciabilità" },
  { id: "non-conformita", label: "NC" },
  { id: "wps-wpqr", label: "WPS / WPQR" },
  { id: "qualifiche", label: "Saldatori" },
  { id: "audit", label: "Audit FPC" },
  { id: "piani-controllo", label: "Piani ctrl." },
  { id: "report", label: "Report" },
];

type Props = {
  phases: CommessaPhaseMap;
  counts: CommessaPhaseCountMap;
  loading: boolean;
  activeTab: CommessaPhaseTabId;
  onSelectTab: (id: CommessaPhaseTabId) => void;
};

export function CommessaWorkflowBar({
  phases,
  counts,
  loading,
  activeTab,
  onSelectTab,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/90 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Stato avanzamento EN 1090
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {STEPS.map((s) => {
          const done = phases[s.id];
          const n = counts[s.id];
          const isNc = s.id === "non-conformita";
          const subline = (() => {
            if (isNc) {
              return done
                ? "Nessuna NC aperta"
                : `${n} NC apert${n === 1 ? "a" : "e"}`;
            }
            if (s.id === "overview") {
              return done ? "Anagrafica completa" : "Completare codice e cliente";
            }
            if (s.id === "wps-wpqr") {
              return `${n} record (WPS + WPQR)`;
            }
            return `${n} elemento${n === 1 ? "" : "i"}`;
          })();

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectTab(s.id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                activeTab === s.id
                  ? "border-sky-500 bg-white shadow-sm dark:border-sky-600 dark:bg-zinc-950"
                  : "border-zinc-200 bg-white/80 hover:border-sky-300 dark:border-zinc-700 dark:bg-zinc-950/60"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  loading
                    ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-700"
                    : done
                      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                      : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                }`}
              >
                {loading ? "…" : done ? "✓" : "!"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-zinc-900 dark:text-zinc-50">
                  {s.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {subline}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
