"use client";

import { useEffect, useId, useRef, useState } from "react";
import { updateContact } from "@/lib/api";
import { ButtonSpinner, useAppToast } from "@/components/ToastProvider";
import type { BusinessLocation, Contact } from "@/types";
import { ContactAssignStoreField } from "./ContactStoreSelects";

type Props = {
  open: boolean;
  contact: Contact | null;
  locations: BusinessLocation[];
  defaultLocationId: string | null;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Edit name / email / phone / store for an existing contact. Uniqueness on email and
 * phone is checked server-side; this form trusts the API for the final answer and
 * just surfaces validation errors.
 */
export default function EditContactDialog({
  open,
  contact,
  locations,
  defaultLocationId,
  onClose,
  onSaved,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const fid = (s: string) => `${uid}${s}`;
  const toast = useAppToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [storeId, setStoreId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setName(contact.name || "");
    setEmail(contact.email || "");
    setPhone(contact.phone_e164 || "");
    setStoreId(contact.location_id || "");
    setError("");
  }, [open, contact]);

  if (!contact) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) return;
    setError("");
    const emailTrimmed = email.trim();
    const phoneTrimmed = phone.trim();
    if (!emailTrimmed && !phoneTrimmed) {
      setError("A contact needs at least one of email or phone.");
      return;
    }
    if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailTrimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    if (phoneTrimmed && !/^\+[1-9]\d{6,14}$/.test(phoneTrimmed)) {
      setError("Phone must be in E.164 format starting with + (e.g. +447700900123).");
      return;
    }
    setBusy(true);
    try {
      await updateContact(contact.id, {
        name: name.trim() || null,
        email: emailTrimmed || null,
        phone: phoneTrimmed || null,
        location_id: storeId.trim() || null,
      });
      toast.success("Contact updated");
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dlg}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      aria-modal="true"
      aria-labelledby="edit-contact-title"
      className="w-[min(96vw,32rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="border-b border-slate-100 px-5 py-3.5 flex items-center justify-between gap-3">
        <h2 id="edit-contact-title" className="text-base font-semibold text-slate-900">
          Edit contact
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

      <form onSubmit={submit} className="px-5 py-5 space-y-3">
        <div>
          <label className="label" htmlFor={fid("name")}>
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id={fid("name")}
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label" htmlFor={fid("email")}>
            Email
          </label>
          <input
            id={fid("email")}
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="sam@example.com"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor={fid("phone")}>
            Phone <span className="font-normal text-slate-500">(E.164)</span>
          </label>
          <input
            id={fid("phone")}
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+447700900123"
            autoComplete="tel"
          />
        </div>

        {locations.length > 0 && (
          <ContactAssignStoreField
            id={fid("store")}
            locations={locations}
            defaultLocationId={defaultLocationId}
            value={storeId}
            onChange={setStoreId}
            compact
          />
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
            disabled={busy}
          >
            {busy ? (
              <>
                <ButtonSpinner /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
