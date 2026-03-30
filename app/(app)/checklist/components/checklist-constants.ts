/** Opzioni stato / esito checklist (allineate a dettaglio e backend) */
export const CHECKLIST_STATI = [
  { value: "APERTA", label: "Aperta" },
  { value: "IN_CORSO", label: "In corso" },
  { value: "COMPLETATA", label: "Completata" },
  { value: "ARCHIVIATA", label: "Archiviata" },
] as const;

export const CHECKLIST_ESITI = [
  { value: "", label: "— Non impostato —" },
  { value: "CONFORME", label: "Conforme" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "PARZIALE", label: "Parziale" },
  { value: "NON_APPLICABILE", label: "Non applicabile" },
] as const;
