"use client";

import { QualifichePanel } from "@/components/qualifiche/qualifiche-panel";
import { Card } from "@/components/ui/card";

export default function SaldatoriPage() {
  return (
    <div className="space-y-6">
      <QualifichePanel
        scope="global"
        title="Saldatori e qualifiche"
        description="Personale qualificato EN ISO 9606 — anagrafica, scadenze e riferimenti documentali. Le abilitazioni sui giunti di commessa sono nelle WPQR."
      />
      <Card title="Collegamento alle commesse" description="Flusso operativo">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Dalla scheda commessa apri il tab <strong>WPQR</strong> per collegare
          procedure e saldatori ai giunti del progetto.
        </p>
      </Card>
    </div>
  );
}
