import type { Contact } from "@/types";

export default function ListStats({
  total,
  contacts,
  sms,
  hasFilters = false,
}: {
  total: number;
  contacts: Contact[];
  sms: boolean;
  /** When true, the total is for the current search/date filters. */
  hasFilters?: boolean;
}) {
  const optedOut = contacts.filter((c) => c.unsubscribed_at).length;
  const eligible = contacts.filter((c) => {
    if (c.unsubscribed_at) return false;
    return Boolean(c.email) || (Boolean(c.phone_e164) && sms);
  }).length;
  return (
    <div className="flex flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 text-xs tabular-nums text-slate-600 sm:shrink-0">
      <span className="text-slate-700">
        {total} {total === 1 ? "person" : "people"}
        {hasFilters ? " matching" : ""}
      </span>
      <span className="text-slate-300" aria-hidden>
        ·
      </span>
      <span
        title="On this page only — has email, or phone where SMS is available — and not opted out"
        className="whitespace-nowrap"
      >
        {eligible} eligible (page)
      </span>
      {optedOut > 0 && (
        <>
          <span className="text-slate-300" aria-hidden>
            ·
          </span>
          <span className="text-amber-800/90" title="On this page only">
            {optedOut} opted out (page)
          </span>
        </>
      )}
    </div>
  );
}
