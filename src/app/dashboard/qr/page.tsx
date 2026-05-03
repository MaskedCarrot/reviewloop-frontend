"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PUBLIC_API_BASE,
  createWebhookKey,
  fetchMyQrSvg,
  getCredits,
  getMyBusiness,
  getPublicConfig,
  getQrInfo,
  listMyLocations,
  listWebhookKeys,
  revokeWebhookKey,
} from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import QrStyleGallery, { QrStyleGallerySkeleton } from "@/components/QrStyleGallery";
import PreviewCustomerPageLinks from "@/components/PreviewCustomerPageLinks";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import StyledSelect from "@/components/StyledSelect";
import Tabs from "@/components/Tabs";
import Disclosure from "@/components/Disclosure";
import type { BusinessLocation, WebhookKeyRecord } from "@/types";

type ConnectTab = "link" | "qr" | "api";

/**
 * Connect — public sign-up + QR + ingest API. Redesigned around three tabs so the user
 * sees, in one glance, exactly what this page can do. Each tab has ONE primary action.
 */
export default function QrPage() {
  const [tab, setTab] = useState<ConnectTab>("link");

  const [info, setInfo] = useState<Awaited<ReturnType<typeof getQrInfo>> | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [keys, setKeys] = useState<WebhookKeyRecord[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [, setPublicCfg] = useState<Awaited<ReturnType<typeof getPublicConfig>> | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const storeIdRef = useRef<string | null>(null);
  const [revokeKey, setRevokeKey] = useState<WebhookKeyRecord | null>(null);
  const [revoking, setRevoking] = useState(false);
  const toast = useAppToast();

  const chooseStoreForList = (list: BusinessLocation[], defId: string | null, preferred: string | null) => {
    if (!list.length) return null;
    if (preferred && list.some((l) => l.id === preferred)) return preferred;
    if (defId && list.some((l) => l.id === defId)) return defId;
    return list[0]!.id;
  };

  const refresh = useCallback(async () => {
    setQrLoading(true);
    try {
      const locs = await listMyLocations().catch(() => ({
        locations: [] as BusinessLocation[],
        default_location_id: null as string | null,
      }));
      setLocations(locs.locations);
      setDefaultLocationId(locs.default_location_id);

      const list = locs.locations;
      const picked = chooseStoreForList(list, locs.default_location_id, storeIdRef.current);
      if (picked !== storeIdRef.current) {
        storeIdRef.current = picked;
        setStoreId(picked);
      }

      const [qr, k, bizRes, cr, p] = await Promise.all([
        getQrInfo({ locationId: list.length ? (picked as string) : null }),
        listWebhookKeys(),
        getMyBusiness(),
        getCredits().catch(() => null),
        getPublicConfig(),
      ]);
      setInfo(qr);
      setKeys(k.keys);
      setBrandColor(bizRes.business?.branding_color ?? null);
      setCreditBalance(typeof cr?.balance === "number" ? cr.balance : undefined);
      setPublicCfg(p);
    } finally {
      setQrLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch((e: unknown) => {
      // Used to silently swallow load failures; surface the issue so users
      // know the QR / webhooks panel didn't actually load.
      const msg = e instanceof Error ? e.message : "Could not load this page.";
      toast.error(msg);
    });
    // toast is stable; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const tabItems = useMemo(
    () =>
      [
        { value: "link" as const, label: "Sign-up link" },
        { value: "qr" as const, label: "QR & poster" },
        { value: "api" as const, label: "Webhooks", badge: keys.filter((k) => !k.revoked_at).length || undefined },
      ],
    [keys],
  );

  return (
    <div className="max-w-3xl space-y-6">
      <DashboardPageHeader
        eyebrow="Bring people in"
        title="Connect"
        credits={creditBalance}
        description="One public link, printable QR codes, and an HTTP webhook — all routes into your People list."
      />

      <Tabs items={tabItems} value={tab} onChange={setTab} ariaLabel="Connect sections" />

      {tab === "link" ? (
        <SignUpLinkTab
          qrLoading={qrLoading}
          info={info}
          locations={locations}
          defaultLocationId={defaultLocationId}
          storeId={storeId}
          onChangeStore={async (v) => {
            storeIdRef.current = v;
            setStoreId(v);
            setQrLoading(true);
            try {
              const qr = await getQrInfo({ locationId: v });
              setInfo(qr);
            } catch {
              await refresh();
            } finally {
              setQrLoading(false);
            }
          }}
          linkCopied={linkCopied}
          onCopy={async () => {
            if (!info?.url) return;
            try {
              await navigator.clipboard.writeText(info.url);
              setLinkCopied(true);
              window.setTimeout(() => setLinkCopied(false), 2000);
            } catch {
              /* ignore */
            }
          }}
        />
      ) : null}

      {tab === "qr" ? (
        <QrTab
          qrLoading={qrLoading}
          info={info}
          brandColor={brandColor}
          locations={locations}
          storeId={storeId}
        />
      ) : null}

      {tab === "api" ? (
        <WebhooksTab
          keys={keys}
          busy={busy}
          newLabel={newLabel}
          createdKey={createdKey}
          onLabelChange={setNewLabel}
          onCreate={async () => {
            setBusy(true);
            try {
              const out = await createWebhookKey(newLabel || "default");
              setCreatedKey(out.key);
              setNewLabel("");
              await refresh();
              toast.success("Key created — copy and store it now");
            } finally {
              setBusy(false);
            }
          }}
          onDismissCreated={() => setCreatedKey(null)}
          onRevoke={(k) => setRevokeKey(k)}
        />
      ) : null}

      <ConfirmDialog
        open={revokeKey !== null}
        title={`Revoke "${revokeKey?.label ?? ""}"?`}
        body={
          <p>
            Any system using this key will stop being able to ingest contacts. You can generate a new
            key at any time.
          </p>
        }
        confirmLabel="Revoke key"
        tone="danger"
        busy={revoking}
        onConfirm={async () => {
          if (!revokeKey) return;
          setRevoking(true);
          try {
            await revokeWebhookKey(revokeKey.id);
            await refresh();
            toast.success("Key revoked");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not revoke key");
          } finally {
            setRevoking(false);
            setRevokeKey(null);
          }
        }}
        onCancel={() => setRevokeKey(null)}
      />
    </div>
  );
}

/* ------------------------- Sign-up link tab ------------------------- */

function SignUpLinkTab({
  qrLoading,
  info,
  locations,
  defaultLocationId,
  storeId,
  onChangeStore,
  linkCopied,
  onCopy,
}: {
  qrLoading: boolean;
  info: { url?: string } | null;
  locations: BusinessLocation[];
  defaultLocationId: string | null;
  storeId: string | null;
  onChangeStore: (v: string) => void;
  linkCopied: boolean;
  onCopy: () => void;
}) {
  return (
    <section className="card p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Your public sign-up link</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Share this URL anywhere — every QR below points to it. Visitors who opt in land in{" "}
          <Link href="/dashboard/contacts" className="font-medium text-brand-600 hover:underline">
            People
          </Link>
          .
        </p>
      </div>

      {qrLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 rounded-lg bg-slate-200/80" />
          <div className="h-10 w-44 rounded-lg bg-slate-200/60" />
        </div>
      ) : info?.url ? (
        <>
          {locations.length > 0 ? (
            <div>
              <label className="label" htmlFor="connect-store">
                Store
              </label>
              <StyledSelect
                id="connect-store"
                className="max-w-md"
                value={storeId || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) onChangeStore(v);
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.is_default || loc.id === defaultLocationId ? " (default)" : ""}
                  </option>
                ))}
              </StyledSelect>
              <p className="text-xs text-slate-500 mt-1.5">
                Each store has its own review URLs.
              </p>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-mono text-xs text-slate-800 break-all">
            {info.url}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={info.url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary inline-flex h-10 px-5 text-sm"
            >
              Open page
            </a>
            <button type="button" className="btn-secondary text-sm h-10 px-4" onClick={onCopy}>
              {linkCopied ? "Copied" : "Copy link"}
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">Link could not be loaded. Try refreshing the page.</p>
      )}

      <Disclosure
        label="Test the personalised review link"
        hint="Send yourself a real review request to see what customers experience"
      >
        <PreviewCustomerPageLinks compact />
      </Disclosure>
    </section>
  );
}

/* ----------------------------- QR tab ----------------------------- */

function QrTab({
  qrLoading,
  info,
  brandColor,
  locations,
  storeId,
}: {
  qrLoading: boolean;
  info: { url?: string } | null;
  brandColor: string | null;
  locations: BusinessLocation[];
  storeId: string | null;
}) {
  return (
    <div className="space-y-6">
      <section className="card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900">Print a poster or counter card</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pre-built layout with your name and QR. Print it or save as PDF — recommended for shop
              floors.
            </p>
          </div>
          <Link
            href={storeId ? `/dashboard/qr/print?l=${encodeURIComponent(storeId)}` : "/dashboard/qr/print"}
            className="btn-primary inline-flex h-10 px-5 text-sm shrink-0"
          >
            Open print layout
          </Link>
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900">QR designs</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Pick a style and download as PNG. Use SVG for large prints or design tools.
          </p>
        </div>

        <div className="min-h-0">
          {qrLoading ? (
            <QrStyleGallerySkeleton />
          ) : info?.url ? (
            <QrStyleGallery data={info.url} brandColor={brandColor} />
          ) : (
            <p className="text-sm text-slate-600 py-6">QR codes could not be generated. Try refreshing the page.</p>
          )}
        </div>

        <Disclosure label="Download SVG (vector)" hint="For very large prints, banners, or editing in design tools">
          <p className="text-sm text-slate-600 mb-3">
            One scalable file. Use the gallery PNGs above for a fixed on-brand style.
          </p>
          <button
            type="button"
            className="btn-secondary text-sm disabled:opacity-50"
            disabled={qrLoading || !info?.url}
            onClick={async () => {
              const blob = await fetchMyQrSvg(locations.length ? storeId : null);
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "goodword-qr.svg";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download SVG
          </button>
        </Disclosure>
      </section>
    </div>
  );
}

/* --------------------------- Webhooks tab --------------------------- */

function WebhooksTab({
  keys,
  busy,
  newLabel,
  createdKey,
  onLabelChange,
  onCreate,
  onDismissCreated,
  onRevoke,
}: {
  keys: WebhookKeyRecord[];
  busy: boolean;
  newLabel: string;
  createdKey: string | null;
  onLabelChange: (v: string) => void;
  onCreate: () => void;
  onDismissCreated: () => void;
  onRevoke: (k: WebhookKeyRecord) => void;
}) {
  return (
    <section className="card p-5 sm:p-6 space-y-5">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900">Ingest contacts via HTTP</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          POST a JSON body and GoodWord adds the person to your list — useful for POS integrations,
          Zapier, or your own backend.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch">
        <input
          className="input flex-1"
          placeholder="Key label (e.g. Square POS)"
          value={newLabel}
          onChange={(e) => onLabelChange(e.target.value)}
        />
        <button
          disabled={busy}
          onClick={onCreate}
          className="btn-primary sm:w-44 inline-flex items-center justify-center gap-2 h-10 text-sm"
        >
          {busy ? (
            <>
              <ButtonSpinner />
              Generating…
            </>
          ) : (
            "Generate key"
          )}
        </button>
      </div>

      {createdKey ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-sm">
          <div className="font-semibold text-amber-950">Save this key now — you will not see it again</div>
          <code className="block mt-2 text-xs break-all text-amber-900 font-mono">{createdKey}</code>
          <button
            type="button"
            onClick={onDismissCreated}
            className="text-xs text-amber-800 mt-2 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {keys.length === 0 ? (
        <p className="text-sm text-slate-500">No keys yet — generate your first to start sending requests.</p>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {keys.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 text-sm py-2.5 px-3.5 bg-white">
              <div className="min-w-0">
                <span className="font-semibold text-slate-800">{k.label}</span>
                <span className="ml-2 text-slate-400 text-xs font-mono">{k.key_prefix}…</span>
                {k.revoked_at && (
                  <span className="ml-2 pill bg-slate-100 text-slate-500 text-[10px]">revoked</span>
                )}
              </div>
              {!k.revoked_at && (
                <button
                  type="button"
                  onClick={() => onRevoke(k)}
                  className="text-xs font-semibold text-red-600 hover:text-red-800 shrink-0"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Disclosure label="Sample request" hint="POST shape, headers and required fields">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Send the key as <code className="px-1 rounded bg-slate-100 text-[11px]">X-GoodWord-Key</code> on
            every request. Use{" "}
            <Link href="/dashboard/settings" className="font-medium text-brand-600 hover:underline">
              Settings → Store locations
            </Link>{" "}
            to find a store id for the optional <code className="px-1 rounded bg-slate-100 text-[11px]">location_id</code>.
          </p>
          <pre className="text-xs text-slate-200 bg-slate-900 rounded-lg p-4 overflow-x-auto">
{`POST ${PUBLIC_API_BASE}/api/goodword/ingest
X-GoodWord-Key: rl_•••
Content-Type: application/json

{
  "name": "Sam Customer",
  "email": "sam@example.com",
  "phone": "+447700900123",
  "external_ref": "order_12345",
  "location_id": "your-store-uuid-optional",
  "channel": "auto",
  "consent": true
}`}
          </pre>
        </div>
      </Disclosure>
    </section>
  );
}
