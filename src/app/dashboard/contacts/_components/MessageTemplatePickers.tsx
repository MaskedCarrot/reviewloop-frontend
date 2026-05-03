import Link from "next/link";
import type { Template } from "@/types";
import StyledSelect from "@/components/StyledSelect";

/**
 * Reusable: choose which email/SMS "Message" template a send uses, or the channel default.
 */
export default function MessageTemplatePickers({
  templates,
  emailTemplateId,
  smsTemplateId,
  onEmailChange,
  onSmsChange,
  showSms,
  idPrefix = "p",
}: {
  templates: Template[];
  emailTemplateId: string;
  smsTemplateId: string;
  onEmailChange: (id: string) => void;
  onSmsChange: (id: string) => void;
  showSms: boolean;
  /** Distinguish controls when the pickers are mounted in two places. */
  idPrefix?: string;
}) {
  const p = idPrefix;
  const emailTemplates = templates.filter((c) => c.channel === "email");
  const smsTemplates = templates.filter((c) => c.channel === "sms");
  const hasAny = emailTemplates.length > 0 || (showSms && smsTemplates.length > 0);
  if (!hasAny) {
    return (
      <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2.5 text-xs text-amber-950/90">
        <span className="font-medium">No message templates yet.</span> The default copy from your first-time setup
        is used.{" "}
        <Link href="/dashboard/templates" className="font-medium text-amber-900/95 underline">
          Add templates under Message
        </Link>{" "}
        to pick one here.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2.5 text-sm max-w-2xl">
      <p className="text-xs text-slate-600 leading-snug">
        <span className="font-medium text-slate-800">Message template (optional)</span> — for these sends. &quot;Default&quot; uses
        the one marked for each channel on the{" "}
        <Link href="/dashboard/templates" className="font-medium text-brand-600 hover:underline">
          Message
        </Link>{" "}
        page.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        {emailTemplates.length > 0 && (
          <div>
            <label className="label text-xs" htmlFor={`${p}-mt-email`}>
              Email sends
            </label>
            <StyledSelect
              id={`${p}-mt-email`}
              className="text-sm"
              value={emailTemplateId}
              onChange={(e) => onEmailChange(e.target.value)}
            >
              <option value="">Default (per Message page)</option>
              {emailTemplates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_default ? " — default" : ""}
                </option>
              ))}
            </StyledSelect>
          </div>
        )}
        {showSms && smsTemplates.length > 0 && (
          <div>
            <label className="label text-xs" htmlFor={`${p}-mt-sms`}>
              SMS sends
            </label>
            <StyledSelect
              id={`${p}-mt-sms`}
              className="text-sm"
              value={smsTemplateId}
              onChange={(e) => onSmsChange(e.target.value)}
            >
              <option value="">Default (per Message page)</option>
              {smsTemplates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.is_default ? " — default" : ""}
                </option>
              ))}
            </StyledSelect>
          </div>
        )}
      </div>
    </div>
  );
}
