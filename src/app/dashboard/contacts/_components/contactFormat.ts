import type { Contact } from "@/types";

export const SOURCE_PILL: Record<Contact["source"], string> = {
  manual: "bg-slate-100/95 text-slate-700 border-slate-200",
  csv: "bg-sky-50/95 text-sky-800 border-sky-200/70",
  qr: "bg-emerald-50/95 text-emerald-800 border-emerald-200/70",
  webhook: "bg-amber-50/95 text-amber-900 border-amber-200/80",
};

export const SOURCE_LABEL: Record<Contact["source"], string> = {
  manual: "Manual",
  csv: "CSV",
  qr: "QR",
  webhook: "Webhook",
};

export function contactInitial(c: Contact): string {
  const s = (c.name || c.email || c.phone_e164 || "?").trim();
  return (s[0] || "?").toUpperCase();
}

/**
 * Renders a stored instant in a fixed IANA zone (from business settings), not the viewer's local zone.
 */
export function shortDate(iso: string, timeZoneIana?: string) {
  try {
    const tz = (timeZoneIana || "UTC").trim() || "UTC";
    return new Date(iso).toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function delayLabel(min: number) {
  return min === 1 ? "1 minute" : `${min} minutes`;
}
