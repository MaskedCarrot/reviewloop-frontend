"use client";

import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

export type PrintPageKey = "a4" | "a4-landscape" | "letter" | "a6" | "4x6";

export type PrintThemeKey = "sunset" | "ocean" | "aurora" | "brand";

export const PRINT_PAGE_SIZES: {
  id: PrintPageKey;
  label: string;
  description: string;
  /** @page `size` value */
  pageCss: string;
  widthMm: number;
  heightMm: number;
}[] = [
  { id: "a4", label: "A4 portrait", description: "210 × 297 mm — posters, window", pageCss: "A4 portrait", widthMm: 210, heightMm: 297 },
  {
    id: "a4-landscape",
    label: "A4 landscape",
    description: "297 × 210 mm — wide counter display",
    pageCss: "A4 landscape",
    widthMm: 297,
    heightMm: 210,
  },
  {
    id: "letter",
    label: "US Letter",
    description: "8.5 × 11 in",
    pageCss: "letter portrait",
    widthMm: 215.9,
    heightMm: 279.4,
  },
  {
    id: "a6",
    label: "Counter card (A6)",
    description: "105 × 148 mm — small stand or tent",
    pageCss: "105mm 148mm portrait",
    widthMm: 105,
    heightMm: 148,
  },
  {
    id: "4x6",
    label: '4 × 6" print',
    description: "Photo kiosks & home printers",
    pageCss: "4in 6in portrait",
    widthMm: 101.6,
    heightMm: 152.4,
  },
];

const THEMES: Record<
  PrintThemeKey,
  { className: string; titleClass: string; subClass: string; qrShell: string }
> = {
  sunset: {
    className: "from-amber-400 via-rose-500 to-violet-600",
    titleClass: "text-white drop-shadow-sm",
    subClass: "text-white/90",
    qrShell: "ring-white/40 shadow-2xl shadow-rose-900/20",
  },
  ocean: {
    className: "from-cyan-400 via-sky-600 to-indigo-800",
    titleClass: "text-white drop-shadow-sm",
    subClass: "text-cyan-50/95",
    qrShell: "ring-white/40 shadow-2xl shadow-indigo-900/25",
  },
  aurora: {
    className: "from-fuchsia-500 via-purple-600 to-cyan-500",
    titleClass: "text-white drop-shadow",
    subClass: "text-fuchsia-50/95",
    qrShell: "ring-white/50 shadow-2xl shadow-purple-900/30",
  },
  brand: {
    className: "", // set via style
    titleClass: "text-white drop-shadow-sm",
    subClass: "text-white/90",
    qrShell: "ring-white/40 shadow-2xl",
  },
};

function safeHex(input: string | null | undefined, fallback: string): string {
  const raw = (input || fallback).replace(/^#/, "");
  if (raw.length === 6 && /^[0-9a-fA-F]+$/.test(raw)) return `#${raw}`;
  return fallback;
}

function brandGradient(brand: string): string {
  return `linear-gradient(145deg, ${brand} 0%, #0f172a 100%)`;
}

type Props = {
  dataUrl: string;
  businessName: string;
  pageKey: PrintPageKey;
  theme: PrintThemeKey;
  brandColor: string | null;
};

/** Inner poster (single page) — QR rendered at high res, scaled by layout. */
export default function PrintableQrPoster({ dataUrl, businessName, pageKey, theme, brandColor }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const qrSize = pageKey === "a6" || pageKey === "4x6" ? 240 : pageKey === "letter" || pageKey === "a4" ? 420 : 400;

  const spec = PRINT_PAGE_SIZES.find((p) => p.id === pageKey)!;
  const t = THEMES[theme];
  const brand = safeHex(brandColor, "#2563eb");
  const brandBg = theme === "brand" ? { background: brandGradient(brand) } : undefined;
  const moduleColor = theme === "brand" ? brand : "#0f172a";

  useEffect(() => {
    const el = ref.current;
    if (!el || !dataUrl) return;
    el.innerHTML = "";
    const qr = new QRCodeStyling({
      width: qrSize,
      height: qrSize,
      type: "canvas",
      data: dataUrl,
      margin: 6,
      qrOptions: { errorCorrectionLevel: "H" },
      dotsOptions: { type: "classy", color: moduleColor },
      backgroundOptions: { color: "#ffffff" },
      cornersSquareOptions: { type: "extra-rounded", color: moduleColor },
      cornersDotOptions: { type: "dot", color: moduleColor },
    });
    qr.append(el);
    return () => {
      el.innerHTML = "";
    };
  }, [dataUrl, qrSize, moduleColor]);

  const small = pageKey === "a6" || pageKey === "4x6";
  const titleCl = small ? "text-2xl sm:text-3xl" : "text-4xl sm:text-5xl";
  const pad = small ? "p-5 sm:p-6" : "p-8 sm:p-10";

  return (
    <div
      className={`printable-poster h-full w-full min-h-0 flex flex-col items-center justify-between text-center box-border ${
        theme === "brand" ? "" : `bg-gradient-to-br ${t.className}`
      } ${pad} print:shadow-none`}
      style={{
        ...brandBg,
        printColorAdjust: "exact" as const,
        WebkitPrintColorAdjust: "exact" as const,
        width: "100%",
        minHeight: "100%",
        pageBreakInside: "avoid" as const,
      }}
    >
      <div className="w-full max-w-[90%]">
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${t.subClass} mb-2 opacity-90`}>
          We&apos;d love your feedback
        </p>
        <h1
          className={`font-extrabold leading-[1.1] ${titleCl} ${t.titleClass}`}
          style={{ wordBreak: "break-word" as const }}
        >
          {businessName || "Your business"}
        </h1>
        <p className={`mt-2 text-sm sm:text-base font-medium ${t.subClass} max-w-md mx-auto`}>
          Scan the code to leave a quick Google review
        </p>
      </div>

      <div
        className={`my-4 sm:my-6 rounded-3xl bg-white p-3 sm:p-4 ${t.qrShell} ${
          small ? "max-w-[min(72mm,90vw)]" : "max-w-[min(95mm,88vw)]"
        } print:max-w-[78mm] print:my-3`}
      >
        <div className="flex items-center justify-center [&_canvas]:!max-w-full [&_canvas]:h-auto" ref={ref} />
      </div>

      <div className="w-full flex flex-col items-center gap-1">
        <p className={`text-xs sm:text-sm font-semibold ${t.subClass}`}>Point your phone camera here</p>
        <div className="mt-3 flex items-center gap-2 opacity-95">
          <div className="h-px w-8 bg-white/50" />
          <span className="text-[10px] sm:text-xs font-semibold text-white/90 tracking-wide">Powered by</span>
          <div className="h-px w-8 bg-white/50" />
        </div>
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 text-xs font-black">
            RL
          </div>
          <div className="text-left leading-tight">
            <div className="text-sm sm:text-base font-bold tracking-tight">ReviewLoop</div>
            <div className="text-[10px] text-white/75">google reviews, made simple</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function getPageSizeSpec(key: PrintPageKey) {
  return PRINT_PAGE_SIZES.find((p) => p.id === key) || PRINT_PAGE_SIZES[0];
}
