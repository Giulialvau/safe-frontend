/**
 * Mappa funzionale del gestionale EN 1090 (concetti di fabbricazione strutturale
 * e controllo documentale — senza riprodurre testi normativi protetti).
 * Usata per navigazione, dashboard e collegamenti tra moduli.
 */

export type En1090Module = {
  id: string;
  href: string;
  label: string;
  /** Breve contesto d’uso in azienda */
  description: string;
};

export type En1090NavSection = {
  id: string;
  title: string;
  /** Ordine logico nel flusso operativo */
  flowOrder: number;
  items: En1090Module[];
};

/** Flusso sintetico: commessa come “grembo” di tutti i dati di progetto */
export const EN1090_FLOW_STEPS: readonly {
  step: number;
  title: string;
  detail: string;
  moduleHref: string;
}[] = [
  {
    step: 1,
    title: "Commessa",
    detail: "Anagrafica ordine / cantiere, cliente, stato e periodo.",
    moduleHref: "/commesse",
  },
  {
    step: 2,
    title: "Materiali & certificati",
    detail: "Lotti, certificati di collaudo, collegamento alla commessa.",
    moduleHref: "/materiali",
  },
  {
    step: 3,
    title: "Controlli & piani",
    detail: "Piani di controllo e checklist per fase di lavorazione.",
    moduleHref: "/piani-controllo",
  },
  {
    step: 4,
    title: "Documentazione",
    detail: "Procedure, registrazioni, evidenze documentali per commessa.",
    moduleHref: "/documenti",
  },
  {
    step: 5,
    title: "Saldatura & qualifiche",
    detail: "WPS, WPQR e qualifiche del personale.",
    moduleHref: "/wps",
  },
  {
    step: 6,
    title: "Tracciabilità",
    detail: "Collegamento materiale–posizione–commessa.",
    moduleHref: "/tracciabilita",
  },
  {
    step: 7,
    title: "Non conformità & audit",
    detail: "Segnalazioni, azioni correttive e verifiche.",
    moduleHref: "/nc",
  },
  {
    step: 8,
    title: "Report",
    detail: "Sintesi indicatori e stato documentale.",
    moduleHref: "/report",
  },
];

export const EN1090_NAV_SECTIONS: readonly En1090NavSection[] = [
  {
    id: "core",
    title: "Centro commessa",
    flowOrder: 0,
    items: [
      {
        id: "dashboard",
        href: "/dashboard",
        label: "Dashboard",
        description: "Sintesi scadenze, NC, audit e collegamenti rapidi.",
      },
      {
        id: "commesse",
        href: "/commesse",
        label: "Commesse",
        description: "Hub ordini di fabbricazione e dettaglio per progetto.",
      },
    ],
  },
  {
    id: "input",
    title: "Input operativi",
    flowOrder: 1,
    items: [
      {
        id: "materiali",
        href: "/materiali",
        label: "Materiali",
        description: "Certificati, lotti, legame con commessa.",
      },
      {
        id: "documenti",
        href: "/documenti",
        label: "Documenti",
        description: "Registrazioni, procedure, archivio PDF per commessa.",
      },
      {
        id: "tracciabilita",
        href: "/tracciabilita",
        description: "Tracciabilità pezzi e materiali.",
        label: "Tracciabilità",
      },
    ],
  },
  {
    id: "quality",
    title: "Controlli & qualità",
    flowOrder: 2,
    items: [
      {
        id: "checklist",
        href: "/checklist",
        label: "Checklist",
        description: "Verifiche per fase e categoria.",
      },
      {
        id: "piani-controllo",
        href: "/piani-controllo",
        label: "Piani di controllo",
        description: "Controlli richiesti per fase commessa.",
      },
      {
        id: "wps",
        href: "/wps",
        label: "WPS",
        description: "Istruzioni di saldatura applicate.",
      },
      {
        id: "wpqr",
        href: "/wpqr",
        label: "WPQR",
        description: "Qualifiche procedure di saldatura.",
      },
      {
        id: "saldatori",
        href: "/saldatori",
        label: "Saldatori",
        description: "Personale qualificato EN ISO 9606 e scadenze.",
      },
      {
        id: "attrezzature",
        href: "/attrezzature",
        label: "Attrezzature",
        description: "Strumenti, manutenzione e tarature.",
      },
    ],
  },
  {
    id: "improvement",
    title: "Miglioramento & verifiche",
    flowOrder: 3,
    items: [
      {
        id: "nc",
        href: "/nc",
        label: "Non conformità",
        description: "NC, gravità e azioni correttive.",
      },
      {
        id: "audit",
        href: "/audit",
        label: "Audit",
        description: "Ispezioni e esiti.",
      },
    ],
  },
  {
    id: "output",
    title: "Sintesi",
    flowOrder: 4,
    items: [
      {
        id: "report",
        href: "/report",
        label: "Report",
        description: "Indicatori aggregati e stato certificazione.",
      },
    ],
  },
];

/** Lista piatta per compatibilità con codice esistente */
export const APP_NAV: readonly { href: string; label: string }[] =
  EN1090_NAV_SECTIONS.flatMap((s) => s.items).filter(
    (item, i, arr) => arr.findIndex((x) => x.href === item.href) === i
  );
