import { smsSegmentCount } from "./smsSegments";

export function sampleRenderTemplate(
  template: string,
  opts: { businessName: string; timezone: string }
): string {
  const now = new Date();
  const tz = opts.timezone || "UTC";
  const dateStr = new Intl.DateTimeFormat("en-GB", { timeZone: tz, dateStyle: "medium" }).format(now);
  const timeStr = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeStyle: "short" }).format(now);
  let out = template;
  out = out.replace(/\{name\}/g, "Alex");
  out = out.replace(/\{business\}/g, opts.businessName);
  out = out.replace(/\{link\}/g, "https://example.com/r/xxxxxxxxxx");
  out = out.replace(/\{date\}/g, dateStr);
  out = out.replace(/\{time\}/g, timeStr);
  return out;
}

export function smsPlainFromStyled(rich: string): string {
  let t = rich;
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 $2");
  t = t.replace(/\*\*([^*]+)\*\*/g, "$1");
  t = t.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  t = t.replace(/^#+\s*/gm, "");
  return t.trim();
}

export function templateHasLink(body: string): boolean {
  return /\{link\}/.test(body);
}

export function estimateSmsCredits(
  templateBody: string,
  opts: { businessName: string; timezone: string },
  creditsPerSegment: number
): { segments: number; credits: number; samplePlain: string } {
  const rendered = sampleRenderTemplate(templateBody, opts);
  const samplePlain = smsPlainFromStyled(rendered);
  const segments = smsSegmentCount(samplePlain);
  return {
    segments,
    credits: Math.max(1, creditsPerSegment) * segments,
    samplePlain,
  };
}
