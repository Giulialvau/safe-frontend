"use client";

import { Input } from "@/components/ui/input";
import { NC_GRAVITA, NC_STATO, NC_TIPO } from "@/lib/en1090-enums";
import type { Commessa } from "@/types";

export type NcFormState = {
  titolo: string;
  descrizione: string;
  tipo: string;
  gravita: string;
  stato: string;
  azioniCorrettive: string;
  dataApertura: string;
  dataChiusura: string;
  commessaId: string;
};

export const emptyNcForm = (): NcFormState => ({
  titolo: "",
  descrizione: "",
  tipo: "INTERNA",
  gravita: "MEDIA",
  stato: "APERTA",
  azioniCorrettive: "",
  dataApertura: "",
  dataChiusura: "",
  commessaId: "",
});

type Props = {
  form: NcFormState;
  setForm: React.Dispatch<React.SetStateAction<NcFormState>>;
  commesse: Commessa[];
  showCommessaSelect: boolean;
  /** In modifica: disabilita cambio commessa */
  lockCommessa?: boolean;
};

export function NcFormFields({
  form,
  setForm,
  commesse,
  showCommessaSelect,
  lockCommessa,
}: Props) {
  return (
    <>
      {showCommessaSelect ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Commessa *</label>
          <select
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={form.commessaId}
            onChange={(e) =>
              setForm((f) => ({ ...f, commessaId: e.target.value }))
            }
            disabled={Boolean(lockCommessa)}
          >
            <option value="">— Seleziona —</option>
            {commesse.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codice ?? c.id}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <Input
        label="Titolo *"
        value={form.titolo}
        onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Descrizione *</label>
        <textarea
          required
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          rows={3}
          value={form.descrizione}
          onChange={(e) =>
            setForm((f) => ({ ...f, descrizione: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Tipo</label>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
          >
            {NC_TIPO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Gravità</label>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={form.gravita}
            onChange={(e) =>
              setForm((f) => ({ ...f, gravita: e.target.value }))
            }
          >
            {NC_GRAVITA.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Stato</label>
          <select
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={form.stato}
            onChange={(e) => setForm((f) => ({ ...f, stato: e.target.value }))}
          >
            {NC_STATO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Azioni correttive</label>
        <textarea
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          rows={2}
          value={form.azioniCorrettive}
          onChange={(e) =>
            setForm((f) => ({ ...f, azioniCorrettive: e.target.value }))
          }
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Data apertura"
          type="date"
          value={form.dataApertura}
          onChange={(e) =>
            setForm((f) => ({ ...f, dataApertura: e.target.value }))
          }
        />
        <Input
          label="Data chiusura"
          type="date"
          value={form.dataChiusura}
          onChange={(e) =>
            setForm((f) => ({ ...f, dataChiusura: e.target.value }))
          }
        />
      </div>
    </>
  );
}
