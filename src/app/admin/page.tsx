"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminGetStats,
  adminListSmsAccessRequests,
  adminListUsers,
  adminSetSmsEnabled,
  type AdminSmsAccessRequest,
  type AdminStats,
  type AdminUserRow,
} from "@/lib/api";
import { useAppToast } from "@/components/ToastProvider";
import KpiCard from "@/components/KpiCard";

type SmsFilter = "all" | "true" | "false";

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [requests, setRequests] = useState<AdminSmsAccessRequest[]>([]);
  const [q, setQ] = useState("");
  const [smsFilter, setSmsFilter] = useState<SmsFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserIds, setBusyUserIds] = useState<Set<string>>(new Set());
  const toast = useAppToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, u, r] = await Promise.all([
        adminGetStats().catch(() => null),
        adminListUsers({ q: q.trim() || undefined, smsEnabled: smsFilter, limit: 200 }),
        adminListSmsAccessRequests("pending").catch(() => ({ requests: [] as AdminSmsAccessRequest[] })),
      ]);
      setStats(s);
      setUsers(u.users);
      setTotal(u.total);
      setRequests(r.requests);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load admin data");
    } finally {
      setLoading(false);
    }
  }, [q, smsFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const setSms = async (userId: string, enabled: boolean) => {
    setBusyUserIds((prev) => new Set(prev).add(userId));
    try {
      await adminSetSmsEnabled(userId, enabled);
      toast.success(enabled ? "SMS enabled" : "SMS disabled");
      // Optimistically update the row + remove any pending request from the queue.
      setUsers((prev) =>
        prev.map((row) => (row.user_id === userId ? { ...row, sms_enabled: enabled, pending_sms_request: 0 } : row)),
      );
      setRequests((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change SMS access");
    } finally {
      setBusyUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const kpiCards = useMemo(
    () => [
      { label: "Users (total)", value: stats?.users_total ?? 0 },
      { label: "Users (last 7d)", value: stats?.users_last_7d ?? 0 },
      { label: "SMS-enabled businesses", value: stats?.sms_enabled_businesses ?? 0 },
      { label: "Pending SMS requests", value: stats?.pending_sms_requests ?? 0 },
      { label: "Email sent (24h)", value: stats?.email_sent_24h ?? 0 },
      { label: "Email sent (7d)", value: stats?.email_sent_7d ?? 0 },
      { label: "SMS sent (24h)", value: stats?.sms_sent_24h ?? 0 },
      { label: "SMS sent (7d)", value: stats?.sms_sent_7d ?? 0 },
    ],
    [stats],
  );

  return (
    <div className="space-y-8">
      {/* Header — eyebrow + title + env-flag pills */}
      <header className="space-y-3">
        <p className="app-eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-warm-500" />
          Operator console
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <h1 className="display-title-lg text-slate-900">Admin overview</h1>
            <p className="mt-2 text-sm text-slate-700 max-w-xl leading-relaxed">
              High-level stats for GoodWord, plus the queue of users waiting for SMS
              access. Toggle SMS on a row to grant access immediately.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill on={stats?.sms_public_preview} label="SMS public preview" />
            <Pill on={stats?.force_sandbox} label="Force sandbox" tone="amber" />
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section>
        <h2 className="app-eyebrow-quiet mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpiCards.map((c, i) => (
            <KpiCard
              key={c.label}
              value={c.value.toLocaleString()}
              label={c.label}
              accent={i === 2 ? "warm" : i === 3 && c.value > 0 ? "warm" : null}
            />
          ))}
        </div>
      </section>

      {/* Pending SMS requests */}
      {requests.length > 0 && (
        <section>
          <h2 className="app-eyebrow-quiet mb-3">
            Pending SMS access requests ({requests.length})
          </h2>
          <div className="overflow-hidden rounded-2xl border border-warm-200/80 bg-gradient-to-br from-warm-50 to-white shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-warm-100/50 text-left">
                <tr>
                  <Th>User</Th>
                  <Th>Business</Th>
                  <Th>Country</Th>
                  <Th>Note</Th>
                  <Th>Requested</Th>
                  <Th className="text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/70">
                {requests.map((r) => (
                  <tr key={r.id}>
                    <Td>
                      <p className="font-medium text-slate-900">{r.email}</p>
                      {r.user_name && <p className="text-xs text-slate-600">{r.user_name}</p>}
                    </Td>
                    <Td>{r.business_name || <span className="text-slate-400">—</span>}</Td>
                    <Td className="font-mono text-xs">{r.country_code || "—"}</Td>
                    <Td className="max-w-[20rem]">
                      <p className="line-clamp-3 text-slate-700 text-xs leading-relaxed">{r.note || "—"}</p>
                    </Td>
                    <Td className="text-xs text-slate-600">{formatDate(r.requested_at)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          onClick={() => void setSms(r.user_id, true)}
                          disabled={busyUserIds.has(r.user_id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          onClick={() => void setSms(r.user_id, false)}
                          disabled={busyUserIds.has(r.user_id)}
                        >
                          Deny
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Users */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-3">
          <h2 className="app-eyebrow-quiet">
            Users ({total.toLocaleString()})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search email or business…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load();
              }}
              className="h-9 w-full sm:w-72 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <select
              value={smsFilter}
              onChange={(e) => setSmsFilter(e.target.value as SmsFilter)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">SMS: any</option>
              <option value="true">SMS: enabled</option>
              <option value="false">SMS: disabled</option>
            </select>
            <button
              type="button"
              onClick={() => void load()}
              className="h-9 rounded-lg bg-slate-900 px-3.5 text-sm font-semibold text-white hover:bg-slate-800 shadow-sm transition active:scale-[0.99]"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-200/85 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-br from-warm-50/40 to-white text-left">
              <tr>
                <Th>User</Th>
                <Th>Business</Th>
                <Th>Country</Th>
                <Th>Signed up</Th>
                <Th>Contacts</Th>
                <Th>Camp.</Th>
                <Th>Credits</Th>
                <Th>Sent (E / S)</Th>
                <Th>Last send</Th>
                <Th className="text-right">SMS</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500 text-sm">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-slate-500 text-sm">
                    No users matched.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.user_id} className="hover:bg-slate-50/60">
                    <Td>
                      <p className="font-medium text-slate-900">{u.email}</p>
                      {u.user_name && <p className="text-xs text-slate-500">{u.user_name}</p>}
                      {u.is_sandbox && (
                        <p className="text-[10px] uppercase tracking-wide text-amber-700 mt-0.5">sandbox</p>
                      )}
                    </Td>
                    <Td>
                      {u.business_name ? (
                        <span className="text-slate-800">{u.business_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">No business yet</span>
                      )}
                    </Td>
                    <Td className="font-mono text-xs">{u.country_code || "—"}</Td>
                    <Td className="text-xs text-slate-600 whitespace-nowrap">{formatDate(u.signup_at)}</Td>
                    <Td className="tabular-nums">{u.contact_count}</Td>
                    <Td className="tabular-nums">{u.campaign_count}</Td>
                    <Td className="tabular-nums">{u.credit_balance}</Td>
                    <Td className="tabular-nums">
                      <span title="Email">{u.email_sent_total}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span title="SMS">{u.sms_sent_total}</span>
                    </Td>
                    <Td className="text-xs text-slate-600 whitespace-nowrap">
                      {u.last_send_at ? formatDate(u.last_send_at) : "—"}
                    </Td>
                    <Td className="text-right">
                      <SmsToggle
                        enabled={u.sms_enabled}
                        pending={u.pending_sms_request > 0}
                        disabled={!u.business_id || busyUserIds.has(u.user_id)}
                        onToggle={() => void setSms(u.user_id, !u.sms_enabled)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Pill({ on, label, tone = "slate" }: { on: boolean | undefined; label: string; tone?: "slate" | "amber" }) {
  const colour = on
    ? tone === "amber"
      ? "bg-amber-100 text-amber-900 border-amber-300"
      : "bg-emerald-100 text-emerald-900 border-emerald-300"
    : "bg-slate-100 text-slate-700 border-slate-300";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${colour}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          on
            ? tone === "amber"
              ? "bg-amber-500"
              : "bg-emerald-500"
            : "bg-slate-400"
        }`}
      />
      <span className="font-medium">
        {label}: {on ? "ON" : "OFF"}
      </span>
    </span>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 ${className}`}
      scope="col"
    >
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-top ${className}`}>{children}</td>;
}

function SmsToggle({
  enabled,
  pending,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  pending: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
        enabled ? "bg-emerald-500" : pending ? "bg-amber-400" : "bg-slate-300"
      }`}
      title={pending ? "Pending request — click to approve, click again to deny" : enabled ? "Disable SMS" : "Enable SMS"}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return s;
  }
}
