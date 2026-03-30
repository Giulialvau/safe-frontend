export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export function isWithinDays(iso: string | undefined, maxDays: number): boolean {
  const d = daysUntil(iso);
  if (d === null) return false;
  return d >= 0 && d <= maxDays;
}

export function isPast(iso?: string | null): boolean {
  const d = daysUntil(iso);
  return d !== null && d < 0;
}
