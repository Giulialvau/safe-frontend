"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { WpqrPanel } from "@/components/wpqr/wpqr-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function WpqrPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="i WPQR" />
      ) : null}
      <WpqrPanel
        scope="global"
        applyUrlCommessaFilter
        title="WPQR"
        description={
          commessaId
            ? "Welder Performance Qualification — saldatori qualificati sulle WPS della commessa."
            : "Nuovo WPQR: scegli la commessa nel modulo. Per l’elenco serve ?commessaId= nell’URL."
        }
      />
    </div>
  );
}

export default function WpqrPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card title="WPQR">
            <p className="text-sm text-zinc-500">Caricamento…</p>
          </Card>
        }
      >
        <WpqrPageInner />
      </Suspense>
    </div>
  );
}
