/**
 * Messaggio uniforme quando una modulistica globale richiede `?commessaId=` nell’URL.
 */
export type CommessaRequiredEmptyStateProps = {
  /** Es. "le checklist", "le WPS" — default: "i dati" */
  resourceLabel?: string;
};

export function CommessaRequiredEmptyState({
  resourceLabel = "i dati",
}: CommessaRequiredEmptyStateProps) {
  return (
    <div
      className="rounded-xl border border-dashed border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-zinc-50/80 px-6 py-10 text-center shadow-sm dark:border-sky-900/60 dark:from-sky-950/50 dark:via-zinc-950 dark:to-zinc-900/80"
      role="status"
    >
      <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
        Seleziona una commessa per visualizzare {resourceLabel}.
      </p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        Apri una commessa e usa il link nel tab corrispondente, oppure aggiungi{" "}
        <code className="rounded-md bg-white px-2 py-0.5 font-mono text-xs text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-200">
          ?commessaId=
        </code>{" "}
        seguito dall&apos;identificativo della commessa nell&apos;URL.
      </p>
    </div>
  );
}
