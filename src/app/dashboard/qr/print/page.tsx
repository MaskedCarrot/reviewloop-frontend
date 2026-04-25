"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageLoader from "@/components/PageLoader";
import PrintableQrPoster, {
  PRINT_PAGE_SIZES,
  type PrintPageKey,
  type PrintThemeKey,
  getPageSizeSpec,
} from "@/components/print/PrintableQrPoster";
import StyledSelect from "@/components/StyledSelect";
import { getMyBusiness, getQrInfo, listMyLocations } from "@/lib/api";
import type { BusinessLocation } from "@/types";

const THEMES: { id: PrintThemeKey; label: string; hint: string }[] = [
  { id: "sunset", label: "Sunset", hint: "Warm amber, rose, violet" },
  { id: "ocean", label: "Ocean", hint: "Cyan to indigo" },
  { id: "aurora", label: "Aurora", hint: "Bold pink → purple → cyan" },
  { id: "brand", label: "Your brand", hint: "Uses accent from settings" },
];

function pickStoreId(list: BusinessLocation[], defId: string | null, preferred: string | null) {
  if (!list.length) return null;
  if (preferred && list.some((l) => l.id === preferred)) return preferred;
  if (defId && list.some((l) => l.id === defId)) return defId;
  return list[0]!.id;
}

export default function QrPrintPage() {
  const searchParams = useSearchParams();
  const lFromQuery = (searchParams.get("l") || "").trim() || null;

  const [url, setUrl] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [brand, setBrand] = useState<string | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [defaultLocationId, setDefaultLocationId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageKey, setPageKey] = useState<PrintPageKey>("a4");
  const [theme, setTheme] = useState<PrintThemeKey>("sunset");

  const load = useCallback(
    async (storeOverride: string | null | undefined) => {
      setLoadError("");
      const locsRes = await listMyLocations().catch(() => ({
        locations: [] as BusinessLocation[],
        default_location_id: null as string | null,
      }));
      setLocations(locsRes.locations);
      setDefaultLocationId(locsRes.default_location_id);
      const picked =
        storeOverride !== undefined
          ? pickStoreId(locsRes.locations, locsRes.default_location_id, storeOverride)
          : pickStoreId(locsRes.locations, locsRes.default_location_id, lFromQuery);
      setStoreId(picked);

      const [q, b] = await Promise.all([
        getQrInfo({ locationId: locsRes.locations.length ? picked : null }),
        getMyBusiness(),
      ]);
      setUrl(q.url);
      setName(b.business?.name || "");
      setBrand(b.business?.branding_color ?? null);
    },
    [lFromQuery]
  );

  useEffect(() => {
    let live = true;
    setLoading(true);
    load(undefined)
      .catch((e) => live && setLoadError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [lFromQuery, load]);

  const spec = getPageSizeSpec(pageKey);

  useEffect(() => {
    const id = "reviewloop-print-page-size";
    let node = document.getElementById(id) as HTMLStyleElement | null;
    if (!node) {
      node = document.createElement("style");
      node.id = id;
      document.head.appendChild(node);
    }
    node.textContent = `@media print { @page { size: ${spec.pageCss}; margin: 0; } }`;
    return () => {
      if (node) node.textContent = "";
    };
  }, [spec.pageCss]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <PageLoader message="Preparing your poster" size="md" />
      </div>
    );
  }

  if (loadError || !url) {
    return (
      <div className="max-w-md card p-6 text-center">
        <p className="text-red-800 text-sm">{loadError || "No QR link available."}</p>
        <Link href="/dashboard/qr" className="text-brand-600 font-medium text-sm mt-3 inline-block">
          ← Back to Connect
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:space-y-0">
      <div className="print:hidden space-y-6 max-w-3xl">
        <div>
          <Link
            href="/dashboard/qr"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Back to Connect
          </Link>
        </div>
        <header className="space-y-1.5 max-w-2xl">
          <h1 className="app-title">Print layout</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Poster and counter formats with your name, the QR, and a short line of copy. Pick paper size and a theme, then
            print or save as PDF.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 gap-4">
          {locations.length > 0 ? (
            <div className="sm:col-span-2 max-w-md">
              <label className="label" htmlFor="print-store">
                Store
              </label>
              <StyledSelect
                id="print-store"
                value={storeId || ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  load(v).catch((err) => setLoadError(err.message || "Failed to update"));
                }}
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.is_default || loc.id === defaultLocationId ? " (default)" : ""}
                  </option>
                ))}
              </StyledSelect>
            </div>
          ) : null}
          <div>
            <label className="label" htmlFor="paper">
              Page size
            </label>
            <StyledSelect
              id="paper"
              value={pageKey}
              onChange={(e) => setPageKey(e.target.value as PrintPageKey)}
            >
              {PRINT_PAGE_SIZES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.description}
                </option>
              ))}
            </StyledSelect>
          </div>
          <div>
            <label className="label" htmlFor="theme">
              Color theme
            </label>
            <StyledSelect id="theme" value={theme} onChange={(e) => setTheme(e.target.value as PrintThemeKey)}>
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} — {t.hint}
                </option>
              ))}
            </StyledSelect>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary h-11 px-6"
            onClick={() => window.print()}
          >
            Print or save as PDF
          </button>
          <Link href="/dashboard/qr" className="btn-secondary h-11 px-4 text-sm">
            Back to Connect
          </Link>
        </div>

        <p className="text-xs text-slate-500">
          Tip: For a small stand, use <strong>Counter card (A6)</strong> or <strong>4×6″</strong>. For a window, try{" "}
          <strong>A4</strong> or <strong>Letter</strong>. Enable <strong>Background graphics</strong> in the print dialog so
          gradients print vividly.
        </p>
      </div>

      <p className="print:hidden text-center text-xs text-slate-400">Preview (matches print layout — scroll on small screens)</p>

      <div
        className="print-surface mx-auto print:mx-0 rounded-2xl overflow-hidden ring-1 ring-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.18)] print:shadow-none print:ring-0 print:rounded-none"
        style={{
          width: `min(100%, ${spec.widthMm}mm)`,
          aspectRatio: `${spec.widthMm} / ${spec.heightMm}`,
        }}
      >
        <div className="h-full w-full" style={{ width: "100%", minHeight: "100%" }}>
          <PrintableQrPoster dataUrl={url} businessName={name} pageKey={pageKey} theme={theme} brandColor={brand} />
        </div>
      </div>
    </div>
  );
}
