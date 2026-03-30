"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type CommessaFilterBannerProps = {
  commessaId: string | null;
};

export function CommessaFilterBanner({ commessaId }: CommessaFilterBannerProps) {
  const pathname = usePathname();
  if (!commessaId) return null;

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100"
      role="status"
    >
      <span>
        Vista filtrata per{" "}
        <strong className="font-semibold">commessa</strong> (ID in URL).
      </span>
      <Link
        href={pathname}
        className="font-medium text-sky-800 underline hover:no-underline dark:text-sky-300"
      >
        Mostra tutti
      </Link>
      <span className="text-sky-700/80 dark:text-sky-400/90">·</span>
      <Link
        href={`/commesse/${commessaId}`}
        className="font-medium text-sky-800 underline hover:no-underline dark:text-sky-300"
      >
        Apri scheda commessa
      </Link>
    </div>
  );
}
