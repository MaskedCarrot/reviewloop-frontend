"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import "@uiw/react-md-editor/markdown-editor.css";
import {
  getCredits,
  getMyBusiness,
  getMyCreditRates,
  getPublicConfig,
  listTemplates,
  saveTemplate,
  deleteTemplate,
} from "@/lib/api";
import { useDashboardBootstrap } from "../DashboardBootstrapProvider";
import DashboardPageHeader from "@/components/DashboardPageHeader";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import ConfirmDialog from "@/components/ConfirmDialog";
import PageLoader from "@/components/PageLoader";
import { isSmsEnabledForBusiness } from "@/lib/countryUi";
import { estimateSmsCredits, sampleRenderTemplate, templateHasBusiness, templateHasLink } from "@/lib/templateVars";
import type { Business, MyCreditRates, PublicConfig, Template } from "@/types";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

const DEFAULT_EMAIL_SUBJECT = "Quick favour from {business}?";
const DEFAULT_EMAIL_BODY =
  "Hi **{name}**,\n\n" +
  "Thanks for choosing **{business}**! If we did a good job, would you mind a quick review? " +
  "[Leave a review]({link})\n\n" +
  "— {business}";
const DEFAULT_SMS_BODY =
  "Hi {name} — {business} would love a quick review: {link} ({date}) Reply STOP to opt out.";

const PLACEHOLDER_CHIPS = ["{name}", "{business}", "{link}", "{date}", "{time}"];

const emailPreviewComponents: Partial<Components> = {
  a: ({ children, href, node: _n, ...rest }) => (
    <a {...rest} href={href} className="text-brand-600 font-medium underline decoration-brand-500/50 underline-offset-2 hover:text-brand-700" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  p: ({ children, node: _n, ...rest }) => (
    <p {...rest} className="mb-2.5 last:mb-0 text-slate-800 leading-relaxed text-[15px]">{children}</p>
  ),
  strong: ({ children, node: _n, ...rest }) => (
    <strong {...rest} className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children, node: _n, ...rest }) => (
    <em {...rest} className="italic text-slate-800">{children}</em>
  ),
  ul: ({ children, node: _n, ...rest }) => (
    <ul {...rest} className="my-2 list-disc space-y-1 pl-5 text-slate-800">{children}</ul>
  ),
  ol: ({ children, node: _n, ...rest }) => (
    <ol {...rest} className="my-2 list-decimal space-y-1 pl-5 text-slate-800">{children}</ol>
  ),
  li: ({ children, node: _n, ...rest }) => <li {...rest} className="pl-0.5">{children}</li>,
  h1: ({ children, node: _n, ...rest }) => (
    <h1 {...rest} className="text-lg font-semibold text-slate-900 first:mt-0 mt-3 mb-1.5">{children}</h1>
  ),
  h2: ({ children, node: _n, ...rest }) => (
    <h2 {...rest} className="text-base font-semibold text-slate-900 first:mt-0 mt-2.5 mb-1.5">{children}</h2>
  ),
  h3: ({ children, node: _n, ...rest }) => (
    <h3 {...rest} className="text-sm font-semibold text-slate-900 first:mt-0 mt-2 mb-1">{children}</h3>
  ),
  code: ({ className, children, node: _n, ...rest }) => {
    if (className?.includes("language-")) return <code className={className} {...rest}>{children}</code>;
    return <code className="rounded border border-slate-200 bg-slate-100/90 px-1.5 py-0.5 text-[0.9em] font-mono text-slate-800" {...rest}>{children}</code>;
  },
  pre: ({ children, node: _n, ...rest }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-snug" {...rest}>{children}</pre>
  ),
  blockquote: ({ children, node: _n, ...rest }) => (
    <blockquote className="my-2 border-l-[3px] border-slate-300 pl-3 text-slate-600 italic" {...rest}>{children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
};

type FormState = {
  name: string;
  channel: "email" | "sms";
  subject: string;
  body: string;
  is_default: boolean;
};

function blankForm(): FormState {
  return { name: "", channel: "email", subject: DEFAULT_EMAIL_SUBJECT, body: DEFAULT_EMAIL_BODY, is_default: false };
}

function templateToForm(t: Template): FormState {
  return { name: t.name, channel: t.channel, subject: t.subject || "", body: t.body, is_default: t.is_default };
}

function TemplatePreview({
  channel, body, subject, businessName, timezone, creditsPerSegment,
}: {
  channel: "email" | "sms"; body: string; subject: string;
  businessName: string; timezone: string; creditsPerSegment: number;
}) {
  const opts = { businessName, timezone };

  if (channel === "email") {
    const subjectRendered = sampleRenderTemplate(subject.trim(), opts);
    const bodyRendered = sampleRenderTemplate(body, opts);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft text-[13px] text-slate-800">
        <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
          <span className="text-xs font-medium text-slate-500 shrink-0">From</span>
          <span className="text-sm font-semibold text-slate-900 truncate">{businessName}</span>
          <span className="ml-auto text-[11px] text-slate-500 shrink-0 select-none">always included</span>
        </div>
        {subjectRendered && (
          <p className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2.5 mb-3 leading-snug">
            {subjectRendered}
          </p>
        )}
        {bodyRendered.trim() ? (
          <div className="min-h-[1.5em] max-w-prose [word-break:break-word]">
            <ReactMarkdown components={emailPreviewComponents}>{bodyRendered}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-slate-500 italic text-sm">Nothing to preview yet.</p>
        )}
      </div>
    );
  }

  const sms = estimateSmsCredits(body, opts, creditsPerSegment);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-soft">
      <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500 shrink-0">From</span>
        <span className="text-sm font-semibold text-slate-900 truncate">{businessName}</span>
        <span className="ml-auto text-[11px] text-slate-500 shrink-0 select-none">always included</span>
      </div>
      <p className="text-sm text-slate-800 font-mono leading-relaxed whitespace-pre-wrap break-words [word-break:break-word]">
        {sms.samplePlain}
      </p>
    </div>
  );
}

export default function TemplatesPage() {
  const { bootstrap } = useDashboardBootstrap();
  const toast = useAppToast();

  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [biz, setBiz] = useState<Business | null>(null);
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [myRates, setMyRates] = useState<MyCreditRates | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | undefined>(undefined);

  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const smsSupported = isSmsEnabledForBusiness(biz);
  const bizName = biz?.name || "Your business";
  const tz = biz?.timezone || "UTC";
  const perSms = myRates?.sms_credits_per_segment ?? cfg?.sms_credits ?? 5;

  const sameChannelCount = items.filter((t) => t.channel === form.channel).length;
  const editingId = selectedId !== "new" ? selectedId : null;
  const editingItem = editingId ? items.find((t) => t.id === editingId) ?? null : null;
  // The default flag must remain ON when the template is the only one for its channel.
  // Allowing it to be unticked there would silently leave the channel without a default
  // and break campaigns/CSV sends that look up "the default" by channel.
  const isOnlyForChannel =
    selectedId === "new"
      ? sameChannelCount === 0
      : editingItem !== null && sameChannelCount === 1 && editingItem.channel === form.channel;
  const defaultLocked = isOnlyForChannel;

  async function refresh(selectAfterSave?: string) {
    try {
      const [t, boot, r] = await Promise.all([
        listTemplates(),
        Promise.resolve(bootstrap),
        getMyCreditRates().catch(() => null),
      ]);
      setItems(t.templates);
      setMyRates(r);
      if (boot) {
        setBiz(boot.business);
        setCfg(boot.config);
        setCreditBalance(typeof boot.credits?.balance === "number" ? boot.credits.balance : undefined);
      } else {
        const [b, p, cr] = await Promise.all([
          getMyBusiness().catch(() => null),
          getPublicConfig().catch(() => null),
          getCredits().catch(() => null),
        ]);
        if (b?.business) setBiz(b.business);
        if (p) setCfg(p);
        setCreditBalance(typeof cr?.balance === "number" ? cr.balance : undefined);
      }
      if (selectAfterSave) setSelectedId(selectAfterSave);
    } catch (e) {
      // Without this, a failed listTemplates() left the page silently empty.
      toast.error(e instanceof Error ? e.message : "Could not load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [bootstrap]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectTemplate(t: Template) {
    setSelectedId(t.id);
    setForm(templateToForm(t));
    setError("");
    setActiveTab("edit");
  }

  function startNew() {
    setSelectedId("new");
    setForm(blankForm());
    setError("");
    setActiveTab("edit");
  }

  async function save() {
    setError("");
    if (!form.name.trim()) { setError("Template name is required."); return; }
    if (!form.body.trim()) { setError("Message body is required."); return; }
    if (!templateHasLink(form.body)) { setError("Body must include {link} so recipients can reach their review page."); return; }
    if (!templateHasBusiness(form.body)) { setError("Body must include {business} so recipients know who is contacting them."); return; }
    setSaving(true);
    try {
      const existingId = selectedId !== "new" ? selectedId : null;
      const result = await saveTemplate(existingId, {
        name: form.name.trim(),
        channel: form.channel,
        subject: form.channel === "email" ? form.subject : null,
        body: form.body,
        is_default: defaultLocked ? true : form.is_default,
      });
      toast.success("Template saved");
      await refresh(result.template.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save template");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selectedId || selectedId === "new") return;
    setDeleting(true);
    try {
      await deleteTemplate(selectedId);
      setSelectedId(null);
      await refresh();
      toast.success("Template deleted");
      setConfirmDelete(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not delete template");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  const smsEst =
    form.channel === "sms"
      ? estimateSmsCredits(form.body, { businessName: bizName, timezone: tz }, perSms)
      : null;

  return (
    <div className="flex flex-col w-full min-w-0 h-full">
      <div className="mb-4">
        <DashboardPageHeader
          eyebrow="Messaging"
          title="Templates"
          credits={creditBalance}
          description="Reusable copy for campaigns and one-off sends."
          end={
            <button
              type="button"
              onClick={startNew}
              className="btn-warm shrink-0 w-full sm:w-fit min-h-10 px-5"
            >
              New template
            </button>
          }
        />
      </div>

      {loading ? (
        <div className="app-section py-12">
          <PageLoader message="Loading templates" size="md" />
        </div>
      ) : (
        <div className="flex border border-slate-200/85 rounded-2xl overflow-hidden bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-28px_rgba(15,23,42,0.16)]" style={{ height: "calc(100svh - 14rem)", minHeight: "480px" }}>

          {/* ── Left pane: template list ── */}
          <div className="w-52 sm:w-64 shrink-0 flex flex-col border-r border-slate-200/80 overflow-hidden bg-gradient-to-b from-warm-50/40 to-slate-50/60">
            <div className="px-3 py-2.5 border-b border-slate-200/70 shrink-0 bg-white/80 backdrop-blur-sm">
              <p className="app-eyebrow-quiet">
                {items.length} template{items.length === 1 ? "" : "s"}
              </p>
            </div>

            <ul className="flex-1 overflow-y-auto py-2" role="list">
              {selectedId === "new" ? (
                <li>
                  <span className="block w-full text-left px-4 py-2.5 text-sm bg-white text-warm-800 font-semibold shadow-sm ring-1 ring-warm-200/60">
                    New template
                  </span>
                </li>
              ) : null}
              {items.length === 0 && selectedId !== "new" ? (
                <li className="px-4 py-3 text-sm text-slate-600">No templates yet.</li>
              ) : (
                items.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => selectTemplate(t)}
                      className={[
                        "w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 min-w-0",
                        selectedId === t.id
                          ? "bg-white text-slate-900 font-semibold shadow-sm"
                          : "text-slate-700 hover:bg-white",
                      ].join(" ")}
                    >
                      <span className="truncate flex-1">{t.name}</span>
                      <span className={[
                        "text-[10px] uppercase font-bold shrink-0 px-1.5 py-0.5 rounded tracking-wider",
                        t.channel === "email" ? "bg-sky-100 text-sky-800" : "bg-violet-100 text-violet-800",
                      ].join(" ")}>
                        {t.channel}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* ── Right pane ── */}
          {selectedId === null ? (
            <div className="flex-1 flex items-center justify-center px-6 text-center bg-gradient-to-br from-white to-warm-50/30">
              <div className="max-w-sm">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warm-50 text-warm-700 ring-1 ring-warm-200">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h11.25" />
                  </svg>
                </div>
                <h2 className="display-title text-xl mt-4 text-slate-900">
                  {items.length === 0 ? "Create your first template" : "Pick a template"}
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {items.length === 0
                    ? "Templates are reusable messages used by campaigns and one-off sends."
                    : "Select one on the left to edit, or create a new one."}
                </p>
                <button
                  type="button"
                  onClick={startNew}
                  className="btn-warm mt-5 h-10 px-5 text-sm"
                >
                  New template
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Tab bar */}
              <div className="border-b border-slate-200/80 px-4 flex items-center gap-1 shrink-0 bg-white">
                {(["edit", "preview"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={[
                      "px-4 py-3 text-sm font-semibold capitalize border-b-2 -mb-px transition-colors",
                      activeTab === tab
                        ? "border-warm-500 text-warm-800"
                        : "border-transparent text-slate-600 hover:text-slate-900",
                    ].join(" ")}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content (scrollable) */}
              <div className="flex-1 overflow-y-auto min-h-0">

                {/* ── Edit tab ── */}
                {activeTab === "edit" && (
                  <div className="px-5 py-4 space-y-3">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="label" htmlFor="tpl-name">Name</label>
                        <input
                          id="tpl-name"
                          className="input"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Post-visit review request"
                        />
                      </div>
                      <div>
                        <label className="label" htmlFor="tpl-channel">Channel</label>
                        <select
                          id="tpl-channel"
                          className="input"
                          value={form.channel}
                          onChange={(e) => {
                            const ch = e.target.value as "email" | "sms";
                            setForm((f) => ({
                              ...f,
                              channel: ch,
                              subject: ch === "email" ? (f.subject || DEFAULT_EMAIL_SUBJECT) : "",
                              body: selectedId === "new"
                                ? (ch === "email" ? DEFAULT_EMAIL_BODY : DEFAULT_SMS_BODY)
                                : f.body,
                            }));
                          }}
                        >
                          <option value="email">Email</option>
                          {(smsSupported || form.channel === "sms") && <option value="sms">SMS</option>}
                        </select>
                      </div>
                    </div>

                    {form.channel === "email" && (
                      <div>
                        <label className="label" htmlFor="tpl-subject">Subject</label>
                        <input
                          id="tpl-subject"
                          className="input"
                          value={form.subject}
                          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                          maxLength={200}
                        />
                      </div>
                    )}

                    <div>
                      <label className="label">{form.channel === "email" ? "Body (Markdown)" : "Body (plain text)"}</label>
                      {form.channel === "email" ? (
                        <div data-color-mode="light" className="rounded-lg overflow-hidden border border-slate-200">
                          <MDEditor
                            value={form.body}
                            onChange={(v) => setForm((f) => ({ ...f, body: v || "" }))}
                            height={220}
                            preview="edit"
                            commandsFilter={(command, isExtra) =>
                              isExtra && command.keyCommand === "preview" ? false : command
                            }
                          />
                        </div>
                      ) : (
                        <textarea
                          className="input min-h-[160px] font-mono text-sm"
                          value={form.body}
                          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                          maxLength={4000}
                        />
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                        <span className="text-xs font-medium text-slate-600">Placeholders:</span>
                        {PLACEHOLDER_CHIPS.map((v) => (
                          <code
                            key={v}
                            className="text-xs font-mono text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200 cursor-pointer select-all hover:bg-brand-100"
                            title="Click to select, then copy"
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>

                    {form.channel === "sms" && (
                      <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs text-sky-900 leading-relaxed">
                        <strong className="font-semibold">SMS compliance:</strong> Include{" "}
                        <code className="rounded bg-sky-100 px-1.5 py-0.5 font-mono">{"{business}"}</code> so recipients know who is
                        messaging them. An opt-out line is automatically appended if missing.
                      </div>
                    )}

                    {smsEst && (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-3 text-sm text-amber-950">
                        <span className="tabular-nums">~{smsEst.segments}</span> segment{smsEst.segments === 1 ? "" : "s"} →{" "}
                        <strong className="font-semibold">{smsEst.credits}</strong> credit{smsEst.credits === 1 ? "" : "s"} per send
                        {smsEst.footerAutoAppended && " (includes auto-appended opt-out footer)"}.
                      </div>
                    )}

                    <label
                      className={[
                        "flex items-center gap-2 text-sm",
                        defaultLocked ? "text-slate-500 cursor-not-allowed" : "text-slate-700",
                      ].join(" ")}
                      title={
                        defaultLocked
                          ? `This is the only ${form.channel.toUpperCase()} template, so it must remain the default.`
                          : undefined
                      }
                    >
                      <input
                        type="checkbox"
                        checked={defaultLocked ? true : form.is_default}
                        disabled={defaultLocked}
                        onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                      />
                      <span>
                        Make default for this channel
                        {defaultLocked ? (
                          <span className="ml-2 text-xs text-slate-500">
                            (only {form.channel.toUpperCase()} template — required)
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </div>
                )}

                {/* ── Preview tab ── */}
                {activeTab === "preview" && (
                  <div className="px-5 py-4">
                    <TemplatePreview
                      channel={form.channel}
                      body={form.body}
                      subject={form.subject}
                      businessName={bizName}
                      timezone={tz}
                      creditsPerSegment={perSms}
                    />
                  </div>
                )}
              </div>

              {/* Footer: error + delete + save */}
              <div className="border-t border-slate-200 bg-white px-5 py-3 flex items-center gap-3 justify-between shrink-0">
                <div className="flex-1 min-w-0">
                  {error && (
                    <p className="text-sm text-red-700 truncate" role="alert">{error}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {selectedId !== "new" && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="btn-primary h-9 px-5 text-sm inline-flex items-center gap-2"
                  >
                    {saving ? <><ButtonSpinner /> Saving…</> : "Save template"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this template?"
        body={
          <p>
            This cannot be undone. Campaigns that use this template will need to be updated to a
            different one before you can delete it.
          </p>
        }
        confirmLabel="Delete template"
        tone="danger"
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
