import { smsSegmentCount } from "./smsSegments";

/** Appended at send time if the rendered SMS doesn't already contain opt-out language. */
export const SMS_OPT_OUT_FOOTER = "\nReply STOP to opt out";

const SMS_OPT_OUT_KEYWORDS = ["reply stop", "text stop", "opt out", "opt-out", "unsubscribe"];

export function smsNeedsOptOutFooter(text: string): boolean {
  const lower = text.toLowerCase();
  return !SMS_OPT_OUT_KEYWORDS.some((kw) => lower.includes(kw));
}

export function sampleRenderTemplate(
  template: string,
  opts: { businessName: string; timezone: string }
): string {
  const now = new Date();
  const tz = opts.timezone || "UTC";
  const dateStr = new Intl.DateTimeFormat(undefined, { timeZone: tz, dateStyle: "medium" }).format(now);
  const timeStr = new Intl.DateTimeFormat(undefined, { timeZone: tz, timeStyle: "short" }).format(now);
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

export function templateHasBusiness(body: string): boolean {
  return /\{business\}/.test(body);
}

export function estimateSmsCredits(
  templateBody: string,
  opts: { businessName: string; timezone: string },
  creditsPerSegment: number
): { segments: number; credits: number; samplePlain: string; footerAutoAppended: boolean } {
  const rendered = sampleRenderTemplate(templateBody, opts);
  const footerAutoAppended = smsNeedsOptOutFooter(rendered);
  const withFooter = footerAutoAppended ? rendered + SMS_OPT_OUT_FOOTER : rendered;
  const samplePlain = smsPlainFromStyled(withFooter);
  const segments = smsSegmentCount(samplePlain);
  return {
    segments,
    credits: Math.max(1, creditsPerSegment) * segments,
    samplePlain,
    footerAutoAppended,
  };
}
