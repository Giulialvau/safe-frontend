"use client";

import { Input } from "@/components/ui/input";

export type QualificaFormState = {
  nome: string;
  ruolo: string;
  scadenza: string;
  documento: string;
};

export const emptyQualificaForm = (): QualificaFormState => ({
  nome: "",
  ruolo: "",
  scadenza: "",
  documento: "",
});

type Props = {
  form: QualificaFormState;
  setForm: React.Dispatch<React.SetStateAction<QualificaFormState>>;
};

export function QualificaFormFields({ form, setForm }: Props) {
  return (
    <>
      <Input
        label="Nome / cognome *"
        value={form.nome}
        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
        required
      />
      <Input
        label="Ruolo / tipo qualifica *"
        value={form.ruolo}
        onChange={(e) => setForm((f) => ({ ...f, ruolo: e.target.value }))}
        required
        placeholder="es. Saldatore MAG 135"
      />
      <Input
        label="Scadenza"
        type="date"
        value={form.scadenza}
        onChange={(e) => setForm((f) => ({ ...f, scadenza: e.target.value }))}
      />
      <Input
        label="Riferimento documento (testo)"
        value={form.documento}
        onChange={(e) =>
          setForm((f) => ({ ...f, documento: e.target.value }))
        }
      />
    </>
  );
}
