/** Valori allineati agli enum Prisma usati dal backend NestJS */

export const NC_TIPO = [
  { value: "INTERNA", label: "Interna" },
  { value: "ESTERNA", label: "Esterna" },
  { value: "FORNITORE", label: "Fornitore" },
  { value: "PROCESSO", label: "Processo" },
] as const;

export const NC_GRAVITA = [
  { value: "BASSA", label: "Bassa" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
  { value: "CRITICA", label: "Critica" },
] as const;

export const NC_STATO = [
  { value: "APERTA", label: "Aperta" },
  { value: "IN_ANALISI", label: "In analisi" },
  { value: "IN_CORSO_AZIONI", label: "In corso azioni" },
  { value: "CHIUSA", label: "Chiusa" },
] as const;

export const AUDIT_ESITO = [
  { value: "CONFORME", label: "Conforme" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "PARZIALE", label: "Parziale" },
] as const;

export const PIANO_ESITO = [
  { value: "IN_ATTESA", label: "In attesa" },
  { value: "CONFORME", label: "Conforme" },
  { value: "NON_CONFORME", label: "Non conforme" },
  { value: "NON_APPLICABILE", label: "Non applicabile" },
] as const;
