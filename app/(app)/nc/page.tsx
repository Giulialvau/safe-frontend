"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { NonConformitaPanel } from "@/components/non-conformita/non-conformita-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function NcPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="le non conformità" />
      ) : null}
      <NonConformitaPanel
        scope="global"
        applyUrlCommessaFilter
        title="Non conformità"
        description={
          commessaId
            ? "Segnalazioni, classificazione, azioni correttive e chiusura per la commessa selezionata."
            : "Nuova NC: collega la commessa nel modulo. Per l’elenco serve ?commessaId= nell’URL."
        }
      />
    </div>
  );
}

export default function NcListPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card title="Non conformità">
            <p className="text-sm text-zinc-500">Caricamento…</p>
          </Card>
        }
      >
        <NcPageInner />
      </Suspense>
    </div>
  );
}
