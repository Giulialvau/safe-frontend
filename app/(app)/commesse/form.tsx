import type { CommessaFormState } from "./components/commessa-fields";

export {
  CommessaFormFields,
  COMMESA_STATI,
} from "./components/commessa-fields";

export type { CommessaFormState } from "./components/commessa-fields";

/** Corpo POST /commesse da form nuova commessa */
export function commessaFormToCreateBody(
  form: CommessaFormState
): Record<string, unknown> {
  const toIsoDateOrUndefined = (value: string): string | undefined => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
  };

  const body: Record<string, unknown> = {
    codice: form.codice.trim(),
    cliente: form.cliente.trim(),
    stato: form.stato,
  };
  if (form.titolo.trim()) body.titolo = form.titolo.trim();
  if (form.descrizione.trim()) body.descrizione = form.descrizione.trim();
  if (form.responsabile.trim()) body.responsabile = form.responsabile.trim();
  if (form.luogo.trim()) body.luogo = form.luogo.trim();
  if (form.note.trim()) body.note = form.note.trim();
  const dataInizioIso = toIsoDateOrUndefined(form.dataInizio);
  if (dataInizioIso) body.dataInizio = dataInizioIso;
  const dataFineIso = toIsoDateOrUndefined(form.dataFine);
  if (dataFineIso) body.dataFine = dataFineIso;
  return body;
}
