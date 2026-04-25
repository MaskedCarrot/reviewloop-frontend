"use client";

import type { ReactNode } from "react";
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
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import QrStyleGallery, { QrStyleGallerySkeleton } from "@/components/QrStyleGallery";
import PreviewCustomerPageLinks from "@/components/PreviewCustomerPageLinks";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import StyledSelect from "@/components/StyledSelect";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import type { BusinessLocation, WebhookKeyRecord } from "@/types";

function ConnectBlock({
  title,
  description,
  children,
  info,
  infoLabel = "More about this section",
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
  info?: ReactNode;
  infoLabel?: string;
}) {
  return (
    <section className="card p-5 sm:p-6 space-y-4">
      <div className="max-w-2xl space-y-1.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {info ? (
            <InfoTip size="md" label={infoLabel}>
              {info}
            </InfoTip>
          ) : null}
        </div>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function QrPage() {
  const [info, setInfo] = useState<Awaited<ReturnType<typeof getQrInfo>> | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [keys, setKeys] = useState<WebhookKeyRecord[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [publicCfg, setPublicCfg] = useState<Awaited<ReturnType<typeof getPublicConfig>> | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const storeIdRef = useRef<string | null>(null);
  const toast = useAppToast();

  const platformChips = useMemo(() => activePlatformChips(locations, publicCfg), [locations, publicCfg]);

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
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <div className="max-w-3xl space-y-6">
      <DashboardPageHeader
        eyebrow="Ingest & links"
        title="Connect"
        credits={creditBalance}
        description="Sign-up link, QR, print layout, test links, and webhooks into your list."
        info={{
          label: "What Connect is for",
          size: "md",
          children: (
            <p>
              One place for your public sign-up page, printable QR, test links to the review flow, and webhooks so other
              systems can add contacts. Everyone who opts in (or is ingested) shows up in{" "}
              <Link href="/dashboard/contacts" className="font-medium text-brand-600 hover:underline">
                People
              </Link>{" "}
              — same list as add/import there.
            </p>
          ),
        }}
      />

      {publicCfg && <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />}

      <ConnectBlock
        title="Your public sign-up page"
        description={
          locations.length > 0
            ? "Pick which store the link and QRs are for; review buttons on the page use that store's Google and other review URLs."
            : "The URL people open to opt in; every QR below encodes the same address."
        }
        infoLabel="Your public sign-up page"
        info={
          <p>
            This page collects details and then sends them through your review request flow. All QRs in the gallery
            use the same URL as the copy field — for multiple stores, choose the store so each place gets the right
            review links. Check the page in a new tab before you print, and copy the link when you share by email or
            social instead of a QR image.
          </p>
        }
      >
        {qrLoading ? (
          <div className="animate-pulse space-y-3 max-w-2xl">
            <div className="h-10 rounded-lg bg-slate-200/80" />
            <div className="h-10 w-40 rounded-lg bg-slate-200/60" />
          </div>
        ) : info?.url ? (
          <div className="space-y-3 max-w-2xl">
            {locations.length > 0 ? (
              <div>
                <label className="label" htmlFor="connect-store">
                  Store
                </label>
                <StyledSelect
                  id="connect-store"
                  className="max-w-md"
                  value={storeId || ""}
                  onChange={async (e) => {
                    const v = e.target.value;
                    if (!v) return;
                    storeIdRef.current = v;
                    setStoreId(v);
                    setQrLoading(true);
                    try {
                      const qr = await getQrInfo({ locationId: v });
                      setInfo(qr);
                    } catch {
                      /* refresh full state on error */
                      await refresh();
                    } finally {
                      setQrLoading(false);
                    }
                  }}
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                      {loc.is_default || loc.id === defaultLocationId ? " (default)" : ""}
                    </option>
                  ))}
                </StyledSelect>
                <p className="text-xs text-slate-500 mt-1.5 max-w-md">
                  Change store to get a different public link; opt-ins are tagged to that store when the page includes{" "}
                  <code className="text-[0.65rem] px-0.5 bg-slate-100 rounded">?l=…</code> in the URL.
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 font-mono text-xs text-slate-800 break-all">
              {info.url}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a href={info.url} target="_blank" rel="noreferrer" className="btn-primary text-sm inline-flex h-10 px-4">
                Open in new tab
              </a>
              <button
                type="button"
                className="btn-secondary text-sm h-10 px-4"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(info.url);
                    setLinkCopied(true);
                    window.setTimeout(() => setLinkCopied(false), 2000);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                {linkCopied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">Link could not be loaded. Try refreshing the page.</p>
        )}
      </ConnectBlock>

      <ConnectBlock
        title="Preview: review link page"
        description="The /r/… link from a message (not the public form above) — use after a test send."
        infoLabel="Preview vs public sign-up"
        info={
          <p>
            The links here are the personalized <strong>review</strong> URLs from outgoing messages, not the Connect
            sign-up page. After you message yourself, open the same link a real customer would get. Some flows may show
            only the private feedback form, depending on your send.
          </p>
        }
      >
        <PreviewCustomerPageLinks compact />
      </ConnectBlock>

      <ConnectBlock
        title="QR designs"
        description={
          locations.length > 0
            ? "For the store selected above — each code opens that store's public page and review links."
            : "Choose a look and download PNG; use SVG for large or editable art."
        }
        infoLabel="QR styles and formats"
        info={
          <p>
            Each card is a different module and edge shape, not just a new colour. Download a PNG for each style. The
            vector <strong>SVG</strong> below is one default pattern you can scale for windows or design tools, or use the
            <strong> Brand</strong> tile to match your dashboard colour.
          </p>
        }
      >
        <div className="min-h-0">
          {qrLoading ? (
            <QrStyleGallerySkeleton />
          ) : info?.url ? (
            <QrStyleGallery data={info.url} brandColor={brandColor} />
          ) : (
            <p className="text-sm text-slate-600 py-6">QR codes could not be generated. Try refreshing the page.</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 px-4 py-3.5 space-y-2 max-w-2xl">
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-medium text-slate-900">Download SVG (vector)</div>
            <InfoTip size="md" label="When to use the SVG file">
              <p>
                One file that stays sharp at any size — for shop windows, banners, or Canva, Affinity, Adobe, etc. It
                is a single system style. Use the gallery PNGs when you need a specific built-in look.
              </p>
            </InfoTip>
          </div>
          <p className="text-sm text-slate-600 line-clamp-2">Scales cleanly for big prints; PNG gallery above is for a fixed on-brand style.</p>
          <button
            type="button"
            className="btn-secondary text-sm disabled:opacity-50"
            disabled={qrLoading || !info?.url}
            onClick={async () => {
              const blob = await fetchMyQrSvg(locations.length ? storeId : null);
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "reviewloop-qr.svg";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Download SVG
          </button>
        </div>
      </ConnectBlock>

      <ConnectBlock
        title="Poster and counter card"
        description="Name, QR, and short line — pick size and theme, then print or PDF."
        infoLabel="Print layout"
        info={
          <p>One print-ready layout. Choose the paper or card size and colour theme, then use your browser to print or save as PDF.</p>
        }
      >
        <div>
          <Link
            href={storeId ? `/dashboard/qr/print?l=${encodeURIComponent(storeId)}` : "/dashboard/qr/print"}
            className="btn-primary inline-flex"
          >
            Open print layout
          </Link>
        </div>
      </ConnectBlock>

      <ConnectBlock
        title="Webhooks & sample request"
        description="Create a key, then POST to ingest with the same header. Example payload below."
        infoLabel="HTTP ingest: keys, headers, and body"
        info={
          <div className="space-y-2">
            <p>
              Create a key here and send it as{" "}
              <code className="px-0.5 rounded bg-slate-100 text-[0.7rem]">X-ReviewLoop-Key</code> on <strong>every</strong>{" "}
              request to the ingest URL (same URL as the sample). Typical sources: POS, your server, or Zapier.
            </p>
            <p>
              <code className="px-0.5 rounded bg-slate-100 text-[0.7rem]">delay_minutes</code> and{" "}
              <code className="px-0.5 rounded bg-slate-100 text-[0.7rem]">channel</code> control timing and email vs
              SMS where that applies. Use optional{" "}
              <code className="px-0.5 rounded bg-slate-100 text-[0.7rem]">location_id</code> to tag the person to a
              store (use a store id from <Link href="/dashboard/settings">Settings → Store locations</Link>).
              In <strong>Zapier</strong>, use &quot;Webhooks by Zapier&quot; to POST the same JSON body shape.
            </p>
          </div>
        }
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:items-stretch max-w-xl">
          <input
            className="input flex-1"
            placeholder="Key label (e.g. Square POS)"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={async () => {
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
            className="btn-primary sm:w-36 inline-flex items-center justify-center gap-2"
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

        {createdKey && (
          <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm max-w-2xl">
            <div className="font-medium text-amber-950">Save this key now — you will not see it again</div>
            <code className="block mt-2 text-xs break-all text-amber-900">{createdKey}</code>
            <button type="button" onClick={() => setCreatedKey(null)} className="text-xs text-amber-800/90 mt-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {keys.length === 0 ? (
          <p className="text-sm text-slate-500">No keys yet</p>
        ) : (
          <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-w-2xl">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between gap-3 text-sm py-2.5 px-3 bg-white">
                <div>
                  <span className="font-medium text-slate-800">{k.label}</span>
                  <span className="ml-2 text-slate-400 text-xs font-mono">{k.key_prefix}…</span>
                  {k.revoked_at && <span className="ml-2 pill bg-slate-100 text-slate-500 text-[10px]">revoked</span>}
                </div>
                {!k.revoked_at && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm(`Revoke key "${k.label}"?`)) return;
                      await revokeWebhookKey(k.id);
                      refresh();
                    }}
                    className="text-xs text-red-600 hover:text-red-800 shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="pt-2 border-t border-slate-200/80 max-w-2xl">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2.5">Sample request</h3>
          <pre className="text-xs text-slate-200 bg-slate-900 rounded-lg p-4 overflow-x-auto">
{`POST ${PUBLIC_API_BASE}/api/reviewloop/ingest
X-ReviewLoop-Key: rl_•••
Content-Type: application/json

{
  "name": "Sam Customer",
  "email": "sam@example.com",
  "phone": "+447700900123",
  "external_ref": "order_12345",
  "location_id": "your-store-uuid-optional",
  "channel": "auto",
  "consent": true,
  "delay_minutes": 60
}`}
          </pre>
        </div>
      </ConnectBlock>
    </div>
  );
}
