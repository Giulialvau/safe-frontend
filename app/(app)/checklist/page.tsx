"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { ChecklistPanel } from "@/components/checklist/checklist-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ChecklistPageInner() {
  const searchParams = useSearchParams();
  const commessaId = searchParams.get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="le checklist" />
      ) : null}
      <ChecklistPanel
        scope="global"
        applyUrlCommessaFilter
        title="Checklist EN 1090"
        description={
          commessaId
            ? "Fabbricazione, saldatura, controlli — stato, esito e tracciabilità per la commessa selezionata."
            : "Creazione checklist: usa «Nuova checklist» e scegli la commessa nel modulo. Per l’elenco, seleziona una commessa (URL o link da scheda commessa)."
        }
      />
    </div>
  );
}

export default function ChecklistPage() {
  return (
    <Suspense
      fallback={
        <Card title="Checklist EN 1090">
          <p className="text-sm text-zinc-500">Caricamento…</p>
        </Card>
      }
    >
      <ChecklistPageInner />
    </Suspense>
  );
}
