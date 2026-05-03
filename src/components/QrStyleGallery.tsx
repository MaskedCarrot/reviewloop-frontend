"use client";

import { useEffect, useMemo, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

type Preset = {
  id: string;
  label: string;
  description: string;
  build: (base: ConstructorParameters<typeof QRCodeStyling>[0]) => ConstructorParameters<typeof QRCodeStyling>[0];
};

const SIZE = 200;

/**
 * Same outer layout as QrStyleGallery so the QR card does not jump when data/canvas load.
 */
export function QrStyleGallerySkeleton() {
  return (
    <div className="relative -mx-1" aria-busy="true" aria-label="Loading QR previews">
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]">
        {Array.from({ length: 8 }, (_, i) => `s-${i}`).map((k) => (
          <div
            key={k}
            className="animate-pulse snap-center shrink-0 w-[min(280px,85vw)] rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm flex flex-col"
          >
            <div className="flex h-[220px] min-h-[220px] items-center justify-center rounded-xl bg-slate-100/90 p-3 ring-1 ring-slate-100">
              <div className="h-[200px] w-[200px] shrink-0 rounded-lg bg-slate-200/70" />
            </div>
            <div className="mt-3 h-4 w-14 rounded bg-slate-200" />
            <div className="mt-2 space-y-1.5 grow">
              <div className="h-3 w-full rounded bg-slate-200/80" />
              <div className="h-3 w-[90%] rounded bg-slate-200/60" />
            </div>
            <div className="mt-3 h-10 w-full rounded-lg bg-slate-200/70" />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1 text-center sm:hidden">Swipe for more styles</p>
    </div>
  );
}

/** Neutral module colors so each preset reads as a different *shape*; use "Brand" for your accent. */
const INK = "#0f172a";
const INK_M = "#334155";
const PAPER = "#ffffff";
const PAPER_ALT = "#f1f5f9";

function getPresets(brandHex: string | undefined): Preset[] {
  const raw = (brandHex || "#2563eb").replace(/^#/, "");
  const safe = raw.length === 6 && /^[0-9a-fA-F]+$/.test(raw) ? raw : "2563eb";
  const brand = `#${safe}`;

  return [
    {
      id: "grid",
      label: "Sharp grid",
      description: 'Square data modules and square finder eyes — most "classic" QR look.',
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER },
        dotsOptions: { type: "square", color: INK },
        cornersSquareOptions: { type: "square", color: INK },
        cornersDotOptions: { type: "square", color: INK },
      }),
    },
    {
      id: "soft",
      label: "Soft blocks",
      description: "Rounded body pixels with big rounded finders; friendly on menu boards.",
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER },
        dotsOptions: { type: "rounded", color: INK_M },
        cornersSquareOptions: { type: "extra-rounded", color: INK_M },
        cornersDotOptions: { type: "dot", color: INK_M },
      }),
    },
    {
      id: "dot-matrix",
      label: "Dot matrix",
      description: 'Tiny circular dots; lighter, less "blocky" at a distance.',
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER_ALT },
        dotsOptions: { type: "dots", color: INK },
        cornersSquareOptions: { type: "extra-rounded", color: INK },
        cornersDotOptions: { type: "dot", color: INK },
      }),
    },
    {
      id: "classy",
      label: "Classy",
      description: 'Curved "petal" modules and dot-centred finders; less technical feel.',
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER },
        dotsOptions: { type: "classy", color: INK_M },
        cornersSquareOptions: { type: "dot", color: INK_M },
        cornersDotOptions: { type: "dot", color: INK_M },
      }),
    },
    {
      id: "leaf",
      label: "Leaf",
      description: "Classy‑rounded data pattern — organic, not a rigid grid.",
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER },
        dotsOptions: { type: "classy-rounded", color: INK_M },
        cornersSquareOptions: { type: "extra-rounded", color: INK_M },
        cornersDotOptions: { type: "dot", color: INK_M },
      }),
    },
    {
      id: "puffy",
      label: "Puffy",
      description: "Extra‑rounded big blobs — bold and readable on slanted surfaces.",
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER_ALT },
        dotsOptions: { type: "extra-rounded", color: INK_M },
        cornersSquareOptions: { type: "extra-rounded", color: INK_M },
        cornersDotOptions: { type: "dot", color: INK_M },
      }),
    },
    {
      id: "round",
      label: "In a circle",
      description: "The whole code sits in a circle — strong for stickers, avatars, and round print.",
      build: (base) => ({
        ...base,
        shape: "circle",
        backgroundOptions: { color: PAPER },
        margin: 4,
        dotsOptions: { type: "rounded", color: INK_M },
        cornersSquareOptions: { type: "extra-rounded", color: INK_M },
        cornersDotOptions: { type: "dot", color: INK_M },
      }),
    },
    {
      id: "brand",
      label: "Brand",
      description: "Same classy layout as the grid family, with your business accent (from settings) on the modules.",
      build: (base) => ({
        ...base,
        shape: "square",
        backgroundOptions: { color: PAPER },
        dotsOptions: { type: "classy", color: brand },
        cornersSquareOptions: { type: "extra-rounded", color: brand },
        cornersDotOptions: { type: "dot", color: brand },
      }),
    },
  ];
}

/**
 * Horizontally scrollable, styled QR previews (qr-code-styling) with download.
 */
export default function QrStyleGallery({ data, brandColor }: { data: string; brandColor?: string | null }) {
  const hostRefs = useRef<(HTMLDivElement | null)[]>([]);
  const instancesRef = useRef<QRCodeStyling[]>([]);
  const list = useMemo(() => getPresets(brandColor || undefined), [brandColor]);

  useEffect(() => {
    if (!data) return;
    const instances: QRCodeStyling[] = [];
    list.forEach((preset, i) => {
      const el = hostRefs.current[i];
      if (!el) return;
      el.innerHTML = "";
      const base: ConstructorParameters<typeof QRCodeStyling>[0] = {
        width: SIZE,
        height: SIZE,
        type: "canvas",
        data,
        margin: 4,
        qrOptions: { errorCorrectionLevel: "Q" },
      };
      const opts = preset.build(base);
      const qr = new QRCodeStyling(opts);
      qr.append(el);
      instances[i] = qr;
    });
    instancesRef.current = instances;
    return () => {
      instancesRef.current = [];
      hostRefs.current.forEach((el) => {
        if (el) el.innerHTML = "";
      });
    };
  }, [data, list]);

  return (
    <div className="relative -mx-1">
      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 px-1 snap-x snap-mandatory scroll-smooth [-webkit-overflow-scrolling:touch]">
        {list.map((p, i) => (
          <div
            key={p.id}
            className="snap-center shrink-0 w-[min(280px,85vw)] rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/90 p-4 shadow-sm flex flex-col"
          >
            <div className="flex h-[220px] min-h-[220px] items-center justify-center rounded-xl bg-white p-3 ring-1 ring-slate-100">
              <div
                className="flex h-[200px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded [&_canvas]:!h-[200px] [&_canvas]:!w-[200px] [&_canvas]:max-w-none"
                ref={(n) => {
                  hostRefs.current[i] = n;
                }}
              />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">{p.label}</h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed grow">{p.description}</p>
            <button
              type="button"
              onClick={() => {
                const qr = instancesRef.current[i];
                if (qr) qr.download({ name: `goodword-qr-${p.id}`, extension: "png" });
              }}
              className="btn-primary text-sm w-full mt-3 py-2"
            >
              Download PNG
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-1 text-center sm:hidden">Swipe for more styles</p>
    </div>
  );
}
