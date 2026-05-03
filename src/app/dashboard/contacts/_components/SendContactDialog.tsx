"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { sendContactReviewRequest } from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import StyledSelect from "@/components/StyledSelect";
import type { Contact, Template } from "@/types";

type Channel = "email" | "sms";

type Props = {
  open: boolean;
  contact: Contact | null;
  templates: Template[];
  /** Whether SMS is available for this business. */
  sms: boolean;
  onClose: () => void;
  onSent: () => void;
};

/**
 * Single review-request sender: picks channel + template, enqueues the message,
 * and shows a toast. Replaces the per-row Email/SMS quick-send buttons so the
 * People row has one clear "Send" action with confirmation.
 */
export default function SendContactDialog({
  open,
  contact,
  templates,
  sms,
  onClose,
  onSent,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const fid = (s: string) => `${uid}${s}`;
  const toast = useAppToast();

  const canEmail = !!contact?.email && !contact?.unsubscribed_at;
  const canSms = !!contact?.phone_e164 && sms && !contact?.unsubscribed_at;

  const [channel, setChannel] = useState<Channel>("email");
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const emailTemplates = useMemo(() => templates.filter((t) => t.channel === "email"), [templates]);
  const smsTemplates = useMemo(() => templates.filter((t) => t.channel === "sms"), [templates]);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !contact) return;
    const initial: Channel = canEmail ? "email" : canSms ? "sms" : "email";
    setChannel(initial);
    setError("");
    const list = initial === "email" ? emailTemplates : smsTemplates;
    const def = list.find((t) => t.is_default) ?? list[0];
    setTemplateId(def?.id ?? "");
  }, [open, contact, canEmail, canSms, emailTemplates, smsTemplates]);

  useEffect(() => {
    const list = channel === "email" ? emailTemplates : smsTemplates;
    const def = list.find((t) => t.is_default) ?? list[0];
    setTemplateId(def?.id ?? "");
  }, [channel, emailTemplates, smsTemplates]);

  if (!contact) return null;

  const display =
    contact.name || contact.email || contact.phone_e164 || "this contact";
  const channelOptions: Channel[] = [];
  if (canEmail) channelOptions.push("email");
  if (canSms) channelOptions.push("sms");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    if (channel === "email" && !canEmail) {
      setError("This contact doesn't have an email on file.");
      return;
    }
    if (channel === "sms" && !canSms) {
      setError(sms ? "This contact doesn't have a phone on file." : "SMS isn't enabled for your account.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await sendContactReviewRequest(contact.id, {
        channel,
        templateId: templateId || undefined,
      });
      toast.success("Message queued");
      onSent();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send.");
    } finally {
      setBusy(false);
    }
  }

  const noChannel = channelOptions.length === 0;

  return (
    <dialog
      ref={dlg}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-modal="true"
      aria-labelledby="send-contact-title"
      className="w-[min(96vw,28rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between gap-3">
        <h2 id="send-contact-title" className="text-base font-semibold text-slate-900">
          Send review request
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Close"
        >
          <span aria-hidden className="text-lg leading-none">×</span>
        </button>
      </div>

      <form onSubmit={submit} className="px-5 py-5 space-y-4">
        <p className="text-sm text-slate-700">
          Sending to <strong className="font-semibold text-slate-900">{display}</strong>.
        </p>

        {noChannel ? (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            We can't reach this contact right now — they're either opted out, missing both email and
            phone, or SMS isn't enabled.
          </p>
        ) : (
          <>
            {channelOptions.length > 1 && (
              <fieldset className="space-y-2">
                <legend className="label mb-0">Channel</legend>
                <div className="flex gap-2">
                  {channelOptions.map((c) => {
                    const active = channel === c;
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setChannel(c)}
                        aria-pressed={active}
                        className={[
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                          active
                            ? "border-warm-400 bg-warm-50 text-warm-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                        ].join(" ")}
                      >
                        {c === "email" ? "Email" : "SMS"}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div>
              <label className="label" htmlFor={fid("tpl")}>
                Template
              </label>
              {(channel === "email" ? emailTemplates : smsTemplates).length === 0 ? (
                <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No {channel.toUpperCase()} templates yet —{" "}
                  <Link
                    href="/dashboard/templates"
                    className="font-semibold underline"
                  >
                    create one
                  </Link>{" "}
                  first.
                </p>
              ) : (
                <StyledSelect
                  id={fid("tpl")}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                >
                  <option value="">Use channel default</option>
                  {(channel === "email" ? emailTemplates : smsTemplates).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.is_default ? " — default" : ""}
                    </option>
                  ))}
                </StyledSelect>
              )}
            </div>
          </>
        )}

        {error && (
          <p
            className="text-sm text-red-700 px-3 py-2 rounded-lg bg-red-50 border border-red-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 -mx-5 px-5 pt-3 mt-4">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary h-10 px-5 inline-flex items-center gap-2"
            disabled={busy || noChannel}
          >
            {busy ? (
              <>
                <ButtonSpinner /> Sending…
              </>
            ) : (
              "Send"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
