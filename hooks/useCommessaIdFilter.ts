"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { pick } from "@/types";

/**
 * Filtra righe con `commessaId` / `commessa_id` quando l’URL contiene `?commessaId=`.
 */
export function useCommessaIdFilter<T extends Record<string, unknown>>(
  rows: T[]
): { queryCommessaId: string | null; filteredRows: T[] } {
  const searchParams = useSearchParams();
  const commessaId = searchParams.get("commessaId");

  const filteredRows = useMemo(() => {
    if (!commessaId?.trim()) return rows;
    const id = commessaId.trim();
    return rows.filter((r) => {
      const cid = pick(r as Record<string, unknown>, ["commessaId", "commessa_id"], undefined);
      return cid != null && String(cid) === id;
    });
  }, [rows, commessaId]);

  return { queryCommessaId: commessaId?.trim() || null, filteredRows };
}
