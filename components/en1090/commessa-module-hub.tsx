"use client";

import Link from "next/link";

const LINKS: {
  href: string | ((id: string) => string);
  label: string;
  hint: string;
}[] = [
  {
    href: (id) => `/materiali?commessaId=${id}`,
    label: "Materiali",
    hint: "Lotti e certificati",
  },
  {
    href: (id) => `/documenti?commessaId=${id}`,
    label: "Documenti",
    hint: "Procedure e registrazioni",
  },
  {
    href: (id) => `/piani-controllo?commessaId=${id}`,
    label: "Piani di controllo",
    hint: "Controlli per fase",
  },
  {
    href: (id) => `/checklist?commessaId=${id}`,
    label: "Checklist",
    hint: "Verifiche operative",
  },
  {
    href: (id) => `/wps?commessaId=${id}`,
    label: "WPS",
    hint: "Istruzioni di saldatura",
  },
  {
    href: (id) => `/wpqr?commessaId=${id}`,
    label: "WPQR",
    hint: "Qualifiche di procedura",
  },
  {
    href: (id) => `/tracciabilita/${id}`,
    label: "Tracciabilità",
    hint: "Materiale → lotto → componente",
  },
  {
    href: (id) => `/nc?commessaId=${id}`,
    label: "Non conformità",
    hint: "NC collegate",
  },
  {
    href: (id) => `/audit?commessaId=${id}`,
    label: "Audit",
    hint: "Verifiche programmate",
  },
  {
    href: (id) => `/report/${id}`,
    label: "Report",
    hint: "Sintesi commessa (GET /report/commessa/:id)",
  },
];

type CommessaModuleHubProps = { commessaId: string };

export function CommessaModuleHub({ commessaId }: CommessaModuleHubProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {LINKS.map((item) => {
        const href =
          typeof item.href === "function" ? item.href(commessaId) : item.href;
        return (
          <Link
            key={item.label + href}
            href={href}
            className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 transition hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-sky-700 dark:hover:bg-sky-950/40"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {item.label}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {item.hint}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
