import Link from "next/link";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  /** Emoji o breve simbolo (accessibile con aria-hidden sul contenitore decorativo) */
  icon?: string;
  href?: string;
}

export function StatCard({ label, value, hint, icon, href }: StatCardProps) {
  const inner = (
    <div className="flex items-start gap-3">
      {icon ? (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-xl dark:bg-sky-950/60"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
        ) : null}
        {href ? (
          <p className="mt-2 text-xs font-medium text-sky-700 dark:text-sky-400">
            Apri →
          </p>
        ) : null}
      </div>
    </div>
  );

  const className =
    "block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-sky-800 dark:hover:bg-sky-950/30";

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
