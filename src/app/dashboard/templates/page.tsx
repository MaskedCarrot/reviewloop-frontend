"use client";

import dynamic from "next/dynamic";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import "@uiw/react-md-editor/markdown-editor.css";
import {
  getCredits,
  getMyBusiness,
  getMyCreditRates,
  getPublicConfig,
  listCampaigns,
  listMyLocations,
  saveCampaign,
  deleteCampaign,
} from "@/lib/api";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";
import ActiveReviewPlatformsStrip from "@/components/ActiveReviewPlatformsStrip";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import InfoTip from "@/components/InfoTip";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import PageLoader from "@/components/PageLoader";
import { countrySupportsSms, getSmsSupportedList } from "@/lib/countryUi";
import { activePlatformChips } from "@/lib/reviewPlatformsFromLocations";
import { estimateSmsCredits, sampleRenderTemplate, templateHasLink } from "@/lib/templateVars";
import type { Business, BusinessLocation, Campaign, MyCreditRates, PublicConfig } from "@/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const TEMPLATE_VARIABLES: { code: string; description: string }[] = [
  { code: "{name}", description: 'Contact\'s name, or "there" if not set' },
  { code: "{business}", description: "Your business name" },
  { code: "{link}", description: "Personalized review page URL (required in the message body)" },
  { code: "{date}", description: "Date of send, in your business timezone" },
  { code: "{time}", description: "Time of send, in your business timezone" },
];

const DEFAULT_EMAIL_SUBJECT = "Quick favour from {business}?";
const DEFAULT_EMAIL_BODY =
  "Hi **{name}**,\n\n" +
  "Thanks for choosing **{business}**! If we did a good job, would you mind a quick review? " +
  "[Leave a review]({link})\n\n" +
  "— {business}";

const DEFAULT_SMS_BODY =
  "Hi {name} — thanks! Review: {link} ({date}) Reply STOP to opt out.";

/** Renders sample body like customers will see in email (HTML email clients show Markdown as formatted). */
const emailSamplePreviewComponents: Partial<Components> = {
  a: ({ children, href, node: _n, ...rest }) => (
    <a
      {...rest}
      href={href}
      className="text-brand-600 font-medium underline decoration-brand-500/50 underline-offset-2 hover:text-brand-700"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  p: ({ children, node: _n, ...rest }) => (
    <p {...rest} className="mb-2.5 last:mb-0 text-slate-800 leading-relaxed text-[15px]">
      {children}
    </p>
  ),
  strong: ({ children, node: _n, ...rest }) => (
    <strong {...rest} className="font-semibold text-slate-900">
      {children}
    </strong>
  ),
  em: ({ children, node: _n, ...rest }) => (
    <em {...rest} className="italic text-slate-800">
      {children}
    </em>
  ),
  ul: ({ children, node: _n, ...rest }) => (
    <ul {...rest} className="my-2 list-disc space-y-1 pl-5 text-slate-800">
      {children}
    </ul>
  ),
  ol: ({ children, node: _n, ...rest }) => (
    <ol {...rest} className="my-2 list-decimal space-y-1 pl-5 text-slate-800">
      {children}
    </ol>
  ),
  li: ({ children, node: _n, ...rest }) => (
    <li {...rest} className="pl-0.5">
      {children}
    </li>
  ),
  h1: ({ children, node: _n, ...rest }) => (
    <h1 {...rest} className="text-lg font-semibold text-slate-900 first:mt-0 mt-3 mb-1.5">
      {children}
    </h1>
  ),
  h2: ({ children, node: _n, ...rest }) => (
    <h2 {...rest} className="text-base font-semibold text-slate-900 first:mt-0 mt-2.5 mb-1.5">
      {children}
    </h2>
  ),
  h3: ({ children, node: _n, ...rest }) => (
    <h3 {...rest} className="text-sm font-semibold text-slate-900 first:mt-0 mt-2 mb-1">
      {children}
    </h3>
  ),
  code: ({ className, children, node: _n, ...rest }) => {
    const block = Boolean(className?.includes("language-"));
    if (block) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded border border-slate-200/80 bg-slate-100/90 px-1.5 py-0.5 text-[0.9em] font-mono text-slate-800"
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ children, node: _n, ...rest }) => (
    <pre
      className="my-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-snug"
      {...rest}
    >
      {children}
    </pre>
  ),
  blockquote: ({ children, node: _n, ...rest }) => (
    <blockquote
      className="my-2 border-l-[3px] border-slate-300 pl-3 text-slate-600 italic"
      {...rest}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
};

type SamplePreviewProps = {
  channel: "email" | "sms";
  templateBody: string;
  /** Email only; placeholders replaced with the same sample data as the body. */
  templateSubject: string | null | undefined;
  businessName: string;
  timezone: string;
  creditsPerSegment: number;
  /** e.g. "How it will look in the inbox (sample data)". */
  label?: string;
  className?: string;
};

/**
 * Customer-facing look with sample substitutions — same as real sends, for previewing templates
 * in the list view and in the editor.
 */
function MessageTemplateSamplePreview({
  channel,
  templateBody,
  templateSubject,
  businessName,
  timezone,
  creditsPerSegment,
  label,
  className = "",
}: SamplePreviewProps) {
  const opts = { businessName, timezone };

  if (channel === "email") {
    const subject = (templateSubject || "").trim()
      ? sampleRenderTemplate((templateSubject || "").trim(), opts)
      : "";
    const body = sampleRenderTemplate(templateBody, opts);

    return (
      <div className={className}>
        {label && <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/80 p-4 sm:p-5 shadow-sm text-[13px] text-slate-800">
          {subject ? (
            <p className="text-sm font-semibold text-slate-900 border-b border-slate-200/90 pb-2.5 mb-3 leading-snug">
              {subject}
            </p>
          ) : null}
          {body.trim() ? (
            <div className="min-h-[1.5em] max-w-prose [word-break:break-word]">
              <ReactMarkdown components={emailSamplePreviewComponents}>{body}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-slate-500 italic">Nothing to preview yet.</p>
          )}
        </div>
      </div>
    );
  }

  const sms = estimateSmsCredits(templateBody, opts, creditsPerSegment);
  return (
    <div className={className}>
      {label && <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>}
      <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 sm:p-5 shadow-sm">
        <p className="text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap break-words [word-break:break-word]">
          {sms.samplePlain}
        </p>
      </div>
    </div>
  );
}

function TemplateVariablesList({ idPrefix = "message" }: { idPrefix?: string }) {
  const headingId = `${idPrefix}-variables-heading`;
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-slate-900" id={headingId}>
        Placeholders you can use
      </h2>
      <p className="text-xs text-slate-600 mt-1 mb-3">Use the placeholders below in curly braces exactly as written.</p>
      <ul
        className="divide-y divide-slate-200/80 border border-slate-200/80 rounded-lg overflow-hidden bg-white"
        aria-labelledby={headingId}
      >
        {TEMPLATE_VARIABLES.map((row) => (
          <li key={row.code} className="px-3 py-2.5 sm:grid sm:grid-cols-[minmax(0,9rem)_1fr] sm:gap-3 sm:items-start">
            <code className="text-xs font-mono text-brand-800 bg-brand-50/80 px-1.5 py-0.5 rounded shrink-0 block w-fit max-w-full break-all">
              {row.code}
            </code>
            <span className="text-sm text-slate-700 mt-1 sm:mt-0 block">{row.description}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-3">
        In email, the body uses Markdown: bold, links, lists, etc. Subject and body can all use the placeholders above.
      </p>
    </div>
  );
}

export default function CampaignsPage() {
  const { bootstrap } = useDashboardBootstrap();
  const [items, setItems] = useState<Campaign[]>([]);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [myRates, setMyRates] = useState<MyCreditRates | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  /** Bumps so each "New template" open gets a fresh form instance. */
  const [newFormKey, setNewFormKey] = useState(0);

  const platformChips = useMemo(() => activePlatformChips(locations, cfg), [locations, cfg]);

  const sms = !!biz && countrySupportsSms(biz.country_code, getSmsSupportedList(cfg));
  const sampleBizName = biz?.name || "Your business";
  const sampleTz = biz?.timezone || "UTC";
  const perSmsForPreview = myRates?.sms_credits_per_segment ?? cfg?.sms_credits ?? 5;

  async function refresh() {
    setLoading(true);
    try {
      const [c, boot, r] = await Promise.all([
        listCampaigns(),
        Promise.resolve(bootstrap),
        getMyCreditRates().catch(() => null),
      ]);
      setItems(c.campaigns);
      setMyRates(r);
      if (boot) {
        setBiz(boot.business);
        setCfg(boot.config);
        setCreditBalance(typeof boot.credits?.balance === "number" ? boot.credits.balance : undefined);
        setLocations(boot.locations?.locations ?? []);
      } else {
        const [b, p, cr, locs] = await Promise.all([
          getMyBusiness().catch(() => null),
          getPublicConfig().catch(() => null),
          getCredits().catch(() => null),
          listMyLocations().catch(() => ({ locations: [] as BusinessLocation[], default_location_id: null as string | null })),
        ]);
        if (b?.business) setBiz(b.business);
        if (p) setCfg(p);
        setCreditBalance(typeof cr?.balance === "number" ? cr.balance : undefined);
        setLocations(locs.locations);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [bootstrap]);

  useLayoutEffect(() => {
    const elId = creating
      ? "create-campaign-form"
      : editing
        ? `edit-campaign-wrap-${editing.id}`
        : null;
    if (!elId) return;
    requestAnimationFrame(() => {
      document.getElementById(elId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [creating, editing?.id, newFormKey]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Messaging"
        title="Message templates"
        credits={creditBalance}
        description={
          <div>
            <p className="line-clamp-2 max-w-prose text-slate-600">
              Reusable copy; include <code className="text-xs px-1 py-0.5 rounded bg-slate-100">{"{link}"}</code> once
              in each body.
            </p>
            {myRates && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap text-xs text-slate-600 rounded-2xl border border-slate-200/50 bg-slate-50/80 px-2.5 py-1.5 w-fit max-w-full">
                <span>
                  <span className="font-medium text-slate-800">Rates</span>
                  {myRates.country_code ? <span> ({myRates.country_code})</span> : null}: {myRates.email_credits} cr
                  /email, {myRates.sms_credits_per_segment} cr/segment
                </span>
                {myRates.notes ? (
                  <InfoTip size="md" label="Note on your send rates">
                    <p>{myRates.notes}</p>
                  </InfoTip>
                ) : null}
              </div>
            )}
          </div>
        }
        info={{
          label: "Message templates and placeholders",
          size: "md",
          children: (
            <p>
              Reusable <strong>email</strong> and <strong>SMS</strong> copy for one-off sends and{" "}
              <a className="font-medium text-brand-600 hover:underline" href="/dashboard/campaigns">
                campaigns
              </a>
              . Use <code>{"{placeholders}"}</code> in curly braces; we fill them when we send. Include the review link
              <strong> once </strong> with <code>{"{link}"}</code> in the body.
            </p>
          ),
        }}
        end={
          <button
            onClick={() => {
              setNewFormKey((k) => k + 1);
              setCreating(true);
              setEditing(null);
            }}
            className="btn-primary shrink-0 w-full sm:w-fit min-h-10"
          >
            New template
          </button>
        }
      />

      {cfg && <ActiveReviewPlatformsStrip platforms={platformChips} className="max-w-3xl" />}

      <TemplateVariablesList idPrefix="message" />

      {loading ? (
        <div className="card p-12">
          <PageLoader message="Loading templates" size="md" />
        </div>
      ) : (
        <div className="space-y-3">
          {creating && (
            <div id="create-campaign-form" className="scroll-mt-8">
              <CampaignForm
                key={`new-${newFormKey}`}
                initial={null}
                creating
                sms={sms}
                business={biz}
                locations={locations}
                publicConfig={cfg}
                myCreditRates={myRates}
                onCancel={() => {
                  setCreating(false);
                  setEditing(null);
                }}
                onSaved={() => {
                  setCreating(false);
                  setEditing(null);
                  refresh();
                }}
              />
            </div>
          )}

          {items.length === 0 && !creating && (
            <div className="card p-8 text-center text-sm text-slate-500">No templates yet.</div>
          )}

          {items.map((c) => (
            <div key={c.id} id={editing?.id === c.id ? `edit-campaign-wrap-${c.id}` : undefined} className="scroll-mt-8">
              {editing?.id === c.id ? (
                <CampaignForm
                  key={c.id}
                  initial={c}
                  creating={false}
                  sms={sms}
                  business={biz}
                  locations={locations}
                  publicConfig={cfg}
                  myCreditRates={myRates}
                  onCancel={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                  onSaved={() => {
                    setCreating(false);
                    setEditing(null);
                    refresh();
                  }}
                />
              ) : (
                <div className="card p-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {c.name}
                        <span className="pill bg-slate-100 text-slate-700 capitalize">{c.channel}</span>
                        {c.is_default && <span className="pill bg-brand-100 text-brand-800">default</span>}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Delay: {c.delay_minutes} min</div>
                      {c.location_id && (
                        <div className="text-xs text-slate-600 mt-0.5">
                          Review link store:{" "}
                          <span className="font-medium text-slate-800">
                            {locations.find((l) => l.id === c.location_id)?.name || "Store"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(c);
                          setCreating(false);
                        }}
                        className="btn-ghost text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete template?")) return;
                          await deleteCampaign(c.id);
                          refresh();
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <MessageTemplateSamplePreview
                    channel={c.channel}
                    templateBody={c.template_body}
                    templateSubject={c.template_subject}
                    businessName={sampleBizName}
                    timezone={sampleTz}
                    creditsPerSegment={perSmsForPreview}
                    label="Preview (sample name, date, link — what recipients see)"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignForm({
  initial,
  creating,
  sms,
  business,
  locations,
  publicConfig,
  myCreditRates,
  onCancel,
  onSaved,
}: {
  initial: Campaign | null;
  creating: boolean;
  sms: boolean;
  business: Business | null;
  /** Stores for the "which review links / store" control; empty = hide control. */
  locations: BusinessLocation[];
  publicConfig: PublicConfig | null;
  myCreditRates: MyCreditRates | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || (creating ? "New template" : "Default"),
    channel: initial?.channel || ("email" as "email" | "sms"),
    template_subject: initial?.template_subject || DEFAULT_EMAIL_SUBJECT,
    template_body: initial?.template_body || (initial?.channel === "sms" ? DEFAULT_SMS_BODY : DEFAULT_EMAIL_BODY),
    delay_minutes: initial?.delay_minutes ?? 60,
    is_default: initial?.is_default ?? false,
    location_id: initial?.location_id ? String(initial.location_id) : "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toast = useAppToast();

  const perSms = myCreditRates?.sms_credits_per_segment ?? publicConfig?.sms_credits ?? 5;
  const perEmail = myCreditRates?.email_credits ?? publicConfig?.email_credits ?? 1;
  const bizName = business?.name || "Your business";
  const tz = business?.timezone || "UTC";

  const smsEst =
    form.channel === "sms"
      ? estimateSmsCredits(form.template_body, { businessName: bizName, timezone: tz }, perSms)
      : null;
  useEffect(() => {
    if (!sms && form.channel === "sms") {
      setForm((f) => ({ ...f, channel: "email" }));
    }
  }, [sms, form.channel]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!form.template_body.trim()) {
      setError("Message body is required.");
      return;
    }
    if (!templateHasLink(form.template_body)) {
      setError("Message body must include {link} so recipients can access their review page.");
      return;
    }
    if (form.delay_minutes < 0 || form.delay_minutes > 10080) {
      setError("Delay must be between 0 and 10080 minutes (one week).");
      return;
    }
    setBusy(true);
    try {
      await saveCampaign(initial?.id || null, {
        name: form.name.trim(),
        channel: form.channel,
        template_subject: form.channel === "email" ? form.template_subject : null,
        template_body: form.template_body,
        delay_minutes: form.delay_minutes,
        is_default: form.is_default,
        location_id: form.location_id.trim() ? form.location_id.trim() : null,
      });
      onSaved();
      toast.success("Template saved");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save template");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card p-5 space-y-3">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="label">Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Channel</label>
          <select
            className="input"
            value={form.channel}
            onChange={(e) => {
              const ch = e.target.value as "email" | "sms";
              setForm((f) => {
                if (f.channel === ch) return f;
                if (!initial && creating) {
                  return {
                    ...f,
                    channel: ch,
                    template_subject: ch === "email" ? DEFAULT_EMAIL_SUBJECT : "",
                    template_body: ch === "email" ? DEFAULT_EMAIL_BODY : DEFAULT_SMS_BODY,
                  };
                }
                return {
                  ...f,
                  channel: ch,
                  template_subject: ch === "email" ? f.template_subject || DEFAULT_EMAIL_SUBJECT : "",
                };
              });
            }}
          >
            <option value="email">Email</option>
            {sms && <option value="sms">SMS</option>}
          </select>
        </div>
      </div>
      {locations.length > 0 && (
        <div>
          <label className="label" htmlFor="template-review-store">
            Store for the {`{link}`} page
          </label>
          <select
            id="template-review-store"
            className="input"
            value={form.location_id}
            onChange={(e) => setForm({ ...form, location_id: e.target.value })}
          >
            <option value="">
              {locations.length > 1
                ? "Not pinned (contact's store, or business default)"
                : "Not pinned (business default store)"}
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Recipients see that store's public review links (one per review site, per store). Pinned on the message
            template, so it's consistent for this send.
          </p>
        </div>
      )}
      {form.channel === "email" && (
        <div>
          <label className="label">Subject</label>
          <input
            className="input"
            value={form.template_subject}
            onChange={(e) => setForm({ ...form, template_subject: e.target.value })}
            maxLength={200}
          />
          <p className="text-xs text-slate-500 mt-1">
            Same placeholders as in the list above (e.g. {`{business}`}, {`{name}`}).
          </p>
        </div>
      )}
      <div>
        <label className="label">{form.channel === "email" ? "Body (Markdown)" : "Body (plain + variables)"}</label>
        {form.channel === "email" ? (
          <div data-color-mode="light" className="rounded-lg overflow-hidden border border-slate-200">
            <MDEditor
              value={form.template_body}
              onChange={(v) => setForm({ ...form, template_body: v || "" })}
              height={280}
              preview="edit"
              commandsFilter={(command, isExtra) =>
                isExtra && command.keyCommand === "preview" ? false : command
              }
            />
          </div>
        ) : (
          <textarea
            className="input min-h-[200px] font-mono text-sm"
            value={form.template_body}
            onChange={(e) => setForm({ ...form, template_body: e.target.value })}
            required
            maxLength={4000}
          />
        )}
        <p className="text-xs text-slate-500 mt-1">Use any row from the "Placeholders" list on this page.</p>
        {form.channel === "email" && (
          <>
            <p className="text-xs text-slate-500 mt-2">
              One email send costs <strong className="text-slate-700">{perEmail}</strong> credit
              {perEmail === 1 ? "" : "s"} (set by the server for your country).
            </p>
            <MessageTemplateSamplePreview
              channel="email"
              templateBody={form.template_body}
              templateSubject={form.template_subject}
              businessName={bizName}
              timezone={tz}
              creditsPerSegment={perSms}
              label="Preview (sample data — like the sent email, including subject line)"
              className="mt-3"
            />
          </>
        )}
        {form.channel === "sms" && (
          <MessageTemplateSamplePreview
            channel="sms"
            templateBody={form.template_body}
            templateSubject={null}
            businessName={bizName}
            timezone={tz}
            creditsPerSegment={perSms}
            label="Preview (sample data — like the sent text)"
            className="mt-3"
          />
        )}
        {form.channel === "sms" && smsEst && (
          <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950">
            <p>
              <strong>SMS is billed by segment</strong> (credits are set on the server for your country). Longer
              messages use more segments, and each segment costs {perSms} credit{perSms === 1 ? "" : "s"}. Estimates
              use your business name, timezone, and a sample name — actual length can vary slightly per contact.
            </p>
            <p className="text-amber-900/90">
              ~{smsEst.segments} segment{smsEst.segments === 1 ? "" : "s"} → about{" "}
              <strong>{smsEst.credits}</strong> credit{smsEst.credits === 1 ? "" : "s"} for this template.
            </p>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Delay (minutes)</label>
          <input
            className="input"
            type="number"
            min={0}
            max={10080}
            value={form.delay_minutes}
            onChange={(e) => setForm({ ...form, delay_minutes: Number(e.target.value) })}
          />
        </div>
        <label className="flex items-center gap-2 mt-7 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.is_default}
            onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
          />
          Make default for this channel
        </label>
      </div>
      {error && <div className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary inline-flex items-center justify-center gap-2">
          {busy ? (
            <>
              <ButtonSpinner />
              Saving…
            </>
          ) : (
            "Save template"
          )}
        </button>
      </div>
    </form>
  );
}
