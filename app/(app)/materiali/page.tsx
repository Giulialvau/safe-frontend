"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { MaterialiPanel } from "@/components/materiali/materiali-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MaterialiPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="i materiali" />
      ) : null}
      <MaterialiPanel
        scope="global"
        applyUrlCommessaFilter
        title="Materiali e certificati"
        description={
          commessaId
            ? "Lotti, norme, fornitori e certificati per la commessa selezionata (GET /commesse/:id/materiali)."
            : "Per l’elenco, seleziona una commessa nell’URL o dal menu. Puoi comunque registrare un nuovo materiale con «Nuovo materiale» (commessa obbligatoria nel modulo)."
        }
      />
    </div>
  );
}

export default function MaterialiPage() {
  return (
    <Suspense
      fallback={
        <Card title="Materiali">
          <p className="text-sm text-zinc-500">Caricamento…</p>
        </Card>
      }
    >
      <MaterialiPageInner />
    </Suspense>
  );
}
