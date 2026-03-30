"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { WpsPanel } from "@/components/wps/wps-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WpsPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="le WPS" />
      ) : null}
      <WpsPanel
        scope="global"
        applyUrlCommessaFilter
        title="WPS"
        description={
          commessaId
            ? "Welding Procedure Specification — processi, materiali e revisioni per la commessa selezionata."
            : "Creazione WPS: usa «Nuova WPS» e seleziona la commessa. Per l’elenco serve ?commessaId= nell’URL."
        }
      />
    </div>
  );
}

export default function WpsPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card title="WPS">
            <p className="text-sm text-zinc-500">Caricamento…</p>
          </Card>
        }
      >
        <WpsPageInner />
      </Suspense>
    </div>
  );
}
