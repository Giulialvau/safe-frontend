"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { PianiControlloPanel } from "@/components/piani-controllo/piani-controllo-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PianiPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="i piani di controllo" />
      ) : null}
      <PianiControlloPanel
        scope="global"
        applyUrlCommessaFilter
        title="Piani di controllo"
        description={
          commessaId
            ? "Controlli per fase ed esiti per la commessa selezionata."
            : "Nuovo piano: scegli la commessa nel modulo. Per l’elenco serve ?commessaId= nell’URL."
        }
      />
    </div>
  );
}

export default function PianiControlloPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card title="Piani di controllo">
            <p className="text-sm text-zinc-500">Caricamento…</p>
          </Card>
        }
      >
        <PianiPageInner />
      </Suspense>
    </div>
  );
}
