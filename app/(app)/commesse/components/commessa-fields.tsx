"use client";

import { Input } from "@/components/ui/input";

export const COMMESA_STATI = [
  { value: "BOZZA", label: "Bozza" },
  { value: "IN_CORSO", label: "In corso" },
  { value: "SOSPESA", label: "Sospesa" },
  { value: "CHIUSA", label: "Chiusa" },
] as const;

export type CommessaFormState = {
  codice: string;
  titolo: string;
  cliente: string;
  descrizione: string;
  responsabile: string;
  luogo: string;
  note: string;
  dataInizio: string;
  dataFine: string;
  stato: string;
};

type Props = {
  form: CommessaFormState;
  setForm: React.Dispatch<React.SetStateAction<CommessaFormState>>;
  /** Se false, nasconde il select stato (es. form ridotto) */
  showStato?: boolean;
};

export function CommessaFormFields({
  form,
  setForm,
  showStato = true,
}: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Codice *"
          name="codice"
          value={form.codice}
          onChange={(e) => setForm((f) => ({ ...f, codice: e.target.value }))}
          required
          autoComplete="off"
        />
        <Input
          label="Titolo"
          name="titolo"
          value={form.titolo}
          onChange={(e) => setForm((f) => ({ ...f, titolo: e.target.value }))}
        />
        <Input
          label="Cliente *"
          name="cliente"
          value={form.cliente}
          onChange={(e) => setForm((f) => ({ ...f, cliente: e.target.value }))}
          required
        />
        {showStato ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Stato
            </label>
            <select
              name="stato"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={form.stato}
              onChange={(e) =>
                setForm((f) => ({ ...f, stato: e.target.value }))
              }
            >
              {COMMESA_STATI.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <Input
          label="Responsabile"
          name="responsabile"
          value={form.responsabile}
          onChange={(e) =>
            setForm((f) => ({ ...f, responsabile: e.target.value }))
          }
        />
        <Input
          label="Luogo / cantiere"
          name="luogo"
          value={form.luogo}
          onChange={(e) => setForm((f) => ({ ...f, luogo: e.target.value }))}
        />
        <Input
          label="Data inizio"
          name="dataInizio"
          type="date"
          value={form.dataInizio}
          onChange={(e) =>
            setForm((f) => ({ ...f, dataInizio: e.target.value }))
          }
        />
        <Input
          label="Data fine"
          name="dataFine"
          type="date"
          value={form.dataFine}
          onChange={(e) => setForm((f) => ({ ...f, dataFine: e.target.value }))}
        />
      </div>
      <Input
        label="Descrizione"
        name="descrizione"
        value={form.descrizione}
        onChange={(e) =>
          setForm((f) => ({ ...f, descrizione: e.target.value }))
        }
      />
      <Input
        label="Note"
        name="note"
        value={form.note}
        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
      />
    </>
  );
}
