"use client";

import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { createContact } from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import StyledSelect from "@/components/StyledSelect";
import type { BusinessLocation, Template } from "@/types";
import { ContactAssignStoreField } from "./ContactStoreSelects";

export default function SingleContactForm({
  onCreated,
  sms,
  templates,
  locations = [],
  defaultLocationId = null,
  variant = "standout",
}: {
  onCreated: () => void;
  sms: boolean;
  /** Used when "Send a message" is enabled to pick which template (or default). */
  templates: Template[];
  /** When non-empty, user can tag the contact to a store for review links. */
  locations?: BusinessLocation[];
  defaultLocationId?: string | null;
  /** `dialog` = compact, no page heading (used in Add people modal). */
  variant?: "standout" | "dialog";
}) {
  const fieldId = useId();
  const f = (name: string) => `${fieldId}${name}`;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    consent: false,
    channel: "auto" as "auto" | "email" | "sms",
    send_now: false,
  });
  /** `""` = use default for channel on Message page; else specific template id. */
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [assignStoreId, setAssignStoreId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: ReactNode } | null>(null);
  const toast = useAppToast();

  useEffect(() => {
    if (!sms && form.channel === "sms") {
      setForm((prev) => ({ ...prev, channel: "auto" }));
    }
  }, [sms, form.channel]);

  useEffect(() => {
    if (!form.send_now) {
      setSendTemplateId("");
    }
  }, [form.send_now]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const emailTrimmed = form.email.trim();
    const phoneTrimmed = form.phone.trim();

    if (!emailTrimmed && !phoneTrimmed) {
      setMsg({ kind: "err", text: "Provide at least an email address or phone number." });
      return;
    }
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      setMsg({ kind: "err", text: "Enter a valid email address (e.g. sam@example.com)." });
      return;
    }
    if (phoneTrimmed && !/^\+[1-9]\d{6,14}$/.test(phoneTrimmed)) {
      setMsg({ kind: "err", text: "Enter phone in E.164 format starting with + and country code (e.g. +447700900123)." });
      return;
    }
    if (!form.consent) {
      setMsg({ kind: "err", text: "Consent is required before contacting this person." });
      return;
    }

    setBusy(true);
    try {
      const chosen =
        form.send_now && sendTemplateId ? templates.find((c) => c.id === sendTemplateId) : undefined;

      const body: {
        name?: string;
        email?: string;
        phone?: string;
        consent: boolean;
        send_now: boolean;
        channel?: "email" | "sms";
        email_template_id?: string;
        sms_template_id?: string;
        location_id?: string;
      } = {
        name: form.name.trim() || undefined,
        email: emailTrimmed || undefined,
        phone: phoneTrimmed || undefined,
        consent: form.consent,
        send_now: form.send_now,
      };

      if (assignStoreId.trim()) {
        body.location_id = assignStoreId.trim();
      }

      if (form.send_now) {
        if (chosen) {
          if (chosen.channel === "email") {
            body.channel = "email";
            body.email_template_id = chosen.id;
          } else {
            body.channel = "sms";
            body.sms_template_id = chosen.id;
          }
        } else {
          if (form.channel && form.channel !== "auto") {
            body.channel = form.channel;
          }
        }
      }

      const res = await createContact(body);
      setForm({ name: "", email: "", phone: "", consent: false, channel: "auto", send_now: false });
      setSendTemplateId("");
      setAssignStoreId("");
      const merged = !!res.matched_existing;
      const successText: ReactNode = form.send_now ? (
        <>
          {merged
            ? "We already had this customer — updated their details and queued the request. "
            : "Review request queued. "}
          <Link href="/dashboard/templates" className="font-medium text-emerald-950/90 hover:underline">
            Templates
          </Link>
          .
        </>
      ) : merged ? (
        "We already had this customer — updated their details (no duplicate created)."
      ) : (
        "Contact added (no message queued)."
      );
      setMsg({ kind: "ok", text: successText });
      onCreated();
      toast.success(
        merged
          ? form.send_now
            ? "Updated · message queued"
            : "Updated existing contact"
          : form.send_now
            ? "Message queued"
            : "Contact added",
      );
    } catch (e: unknown) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  const formClass =
    variant === "dialog" ? "space-y-3" : "card p-6 space-y-4";
  const helpClass = variant === "dialog" ? "text-sm text-slate-600" : "text-sm text-slate-600 leading-relaxed";
  const showChannel = form.send_now && !sendTemplateId;
  const emailTemplates = templates.filter((c) => c.channel === "email");
  const smsTemplates = templates.filter((c) => c.channel === "sms");

  const inner = (
    <>
      <p className={helpClass}>
        We only add them to your list until you turn on a send. Consent is required to contact them.
      </p>
      <div>
        <label className="label" htmlFor={f("c-name")}>
          Name (optional)
        </label>
        <input
          id={f("c-name")}
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Sam"
          autoComplete="name"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor={f("c-email")}>
            Email
          </label>
          <input
            id={f("c-email")}
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="sam@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor={f("c-phone")}>
            Phone (E.164)
          </label>
          <input
            id={f("c-phone")}
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+447700900123"
            autoComplete="tel"
          />
        </div>
      </div>
      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm({ ...form, consent: e.target.checked })}
          className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          required
        />
        <span>This person agreed to receive a review request from my business (required).</span>
      </label>

      {locations.length > 0 && (
        <ContactAssignStoreField
          id={f("c-store")}
          locations={locations}
          defaultLocationId={defaultLocationId}
          value={assignStoreId}
          onChange={setAssignStoreId}
          compact={variant === "dialog"}
        />
      )}

      <label className="flex items-center gap-2.5 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.send_now}
          onChange={(e) => setForm({ ...form, send_now: e.target.checked })}
          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        <span>Send a review request after adding (uses your default send delay unless the message has its own)</span>
      </label>

      {form.send_now && (
        <div>
          <label className="label" htmlFor={f("c-msg-tpl")}>
            Message
          </label>
          <StyledSelect
            id={f("c-msg-tpl")}
            value={sendTemplateId}
            onChange={(e) => setSendTemplateId(e.target.value)}
            className="w-full"
          >
            <option value="">Default (per Message page)</option>
            {emailTemplates.map((c) => (
              <option key={c.id} value={c.id}>
                Email: {c.name}
                {c.is_default ? " (default)" : ""}
              </option>
            ))}
            {sms &&
              smsTemplates.map((c) => (
                <option key={c.id} value={c.id}>
                  SMS: {c.name}
                  {c.is_default ? " (default)" : ""}
                </option>
              ))}
          </StyledSelect>
          {sendTemplateId && (
            <p className="text-xs text-slate-600 mt-1.5">
              Picks <strong>email or SMS</strong> from that message.{" "}
              <Link href="/dashboard/templates" className="text-brand-600 font-medium hover:underline">
                Edit templates
              </Link>
            </p>
          )}
        </div>
      )}

      {showChannel && (
        <div>
          <label className="label" htmlFor={f("c-channel")}>
            If using default, send via
          </label>
          <StyledSelect
            id={f("c-channel")}
            value={form.channel}
            onChange={(e) => setForm({ ...form, channel: e.target.value as "auto" | "email" | "sms" })}
          >
            <option value="auto">Auto (prefer email if present)</option>
            <option value="email">Email only</option>
            {sms && <option value="sms">SMS only</option>}
          </StyledSelect>
        </div>
      )}

      {msg && (
        <div
          className={`text-sm px-3.5 py-2.5 rounded-xl border ${
            msg.kind === "ok" ? "bg-emerald-50 text-emerald-900 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !form.consent}
        className={
          variant === "dialog"
            ? "btn-primary w-full h-11 text-sm font-semibold inline-flex items-center justify-center gap-2"
            : "btn-primary w-full h-12 text-base font-semibold inline-flex items-center justify-center gap-2"
        }
      >
        {busy ? (
          <>
            <ButtonSpinner />
            Working…
          </>
        ) : form.send_now ? (
          "Add and queue message"
        ) : (
          "Add to list only"
        )}
      </button>
    </>
  );

  if (variant === "dialog") {
    return <form onSubmit={submit} className={formClass}>{inner}</form>;
  }
  return (
    <section className="max-w-2xl">
      <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3">Send a review request</h2>
      <form onSubmit={submit} className={formClass}>
        {inner}
      </form>
    </section>
  );
}
