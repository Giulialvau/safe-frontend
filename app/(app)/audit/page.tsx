"use client";

import { CommessaRequiredEmptyState } from "@/components/en1090/commessa-required-empty-state";
import { AuditPanel } from "@/components/audit/audit-panel";
import { Card } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AuditPageInner() {
  const commessaId = useSearchParams().get("commessaId")?.trim() ?? null;

  return (
    <div className="space-y-6">
      {!commessaId ? (
        <CommessaRequiredEmptyState resourceLabel="gli audit FPC" />
      ) : null}
      <AuditPanel
        scope="global"
        applyUrlCommessaFilter
        title="Audit FPC"
        description={
          commessaId
            ? "Verifiche del sistema di controllo per la commessa selezionata."
            : "Nuovo audit: indica la commessa nel modulo. Per l’elenco serve ?commessaId= nell’URL."
        }
      />
    </div>
  );
}

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <Suspense
        fallback={
          <Card title="Audit">
            <p className="text-sm text-zinc-500">Caricamento…</p>
          </Card>
        }
      >
        <AuditPageInner />
      </Suspense>
    </div>
  );
}
