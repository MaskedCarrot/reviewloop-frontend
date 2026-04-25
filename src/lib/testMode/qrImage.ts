import QRCodeStyling from "qr-code-styling";
import { getTestState } from "./state";
import { getPublicOriginForClientLinks } from "./siteOrigin";

const BRAND = "#2563eb";

type Style = "classic" | "dots" | "rounded";

function baseConfig(style: Style) {
  if (style === "dots") {
    return { dotsOptions: { type: "dots" as const, color: "#0f172a" }, backgroundOptions: { color: "#ffffff" } };
  }
  if (style === "rounded") {
    return { dotsOptions: { type: "rounded" as const, color: "#0f172a" }, backgroundOptions: { color: "#ffffff" } };
  }
  return { dotsOptions: { type: "square" as const, color: "#0f172a" }, backgroundOptions: { color: "#ffffff" } };
}

function publicQDataUrl(businessId: string, locationId?: string | null) {
  const u = `${getPublicOriginForClientLinks()}/q/${businessId}`;
  if (locationId && String(locationId).trim()) {
    return `${u}?l=${encodeURIComponent(String(locationId).trim())}`;
  }
  return u;
}

export async function getTestModeQrPngBlob(style: Style = "classic", locationId?: string | null) {
  const b = getTestState().business;
  const data = publicQDataUrl(b.id, locationId);
  const bcfg = baseConfig(style);
  const qr = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "svg",
    data,
    ...bcfg,
    cornersSquareOptions: { type: "extra-rounded" as const, color: BRAND },
    cornersDotOptions: { type: "dot" as const, color: "#0f172a" },
  });
  const raw = await qr.getRawData("png");
  if (!raw || !(raw instanceof Blob)) throw new Error("Could not generate test QR");
  return raw;
}

export async function getTestModeQrSvgBlob(locationId?: string | null) {
  const b = getTestState().business;
  const data = publicQDataUrl(b.id, locationId);
  const qr = new QRCodeStyling({
    width: 300,
    height: 300,
    type: "svg",
    data,
    dotsOptions: { type: "square", color: "#0f172a" },
    backgroundOptions: { color: "#ffffff" },
  });
  const raw = await qr.getRawData("svg");
  if (!raw || !(raw instanceof Blob)) throw new Error("Could not generate test QR (svg)");
  return raw;
}
