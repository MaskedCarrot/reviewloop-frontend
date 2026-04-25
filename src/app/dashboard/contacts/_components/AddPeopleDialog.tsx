"use client";

import { useEffect, useRef } from "react";
import InfoTip from "@/components/InfoTip";
import type { BusinessLocation, Campaign } from "@/types";
import CsvUploadForm from "./CsvUploadForm";
import MessageTemplatePickers from "./MessageTemplatePickers";
import SingleContactForm from "./SingleContactForm";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaigns: Campaign[];
  emailTemplateId: string;
  smsTemplateId: string;
  onEmailTemplateChange: (id: string) => void;
  onSmsTemplateChange: (id: string) => void;
  sms: boolean;
  defaultSendDelayMinutes: number;
  onRefresh: () => void;
  /** Store list from Settings; when empty, store field is hidden. */
  locations: BusinessLocation[];
  defaultLocationId: string | null;
};

/**
 * Add one contact or import CSV. Template selection is shared with the list (same state in parent).
 */
export default function AddPeopleDialog({
  open,
  onOpenChange,
  campaigns,
  emailTemplateId,
  smsTemplateId,
  onEmailTemplateChange,
  onSmsTemplateChange,
  sms,
  defaultSendDelayMinutes,
  onRefresh,
  locations,
  defaultLocationId,
}: Props) {
  const dlg = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dlg.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dlg}
      aria-modal="true"
      aria-labelledby="add-people-title"
      onClose={() => onOpenChange(false)}
      className="w-[min(100%,36rem)] max-h-[min(100vh,900px)] overflow-visible rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      {/*
        Header must stack above the scrollable body: the help popover is absolutely positioned
        and extends over the form below; otherwise the next sibling paints on top and hides it.
      */}
      <div className="relative z-20 border-b border-slate-100 bg-white px-5 py-3.5 flex items-start justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 pr-2 min-w-0">
            <h2 id="add-people-title" className="text-base font-semibold text-slate-900">
              Add people
            </h2>
            <InfoTip size="md" label="Add one contact or import CSV">
              <p>
                You can queue a first send when you add someone or import a file — pick the email or SMS template like on
                the list. CSV can schedule the same for every row in one import.
              </p>
            </InfoTip>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 pr-2">Add one, or import CSV. Sending is optional.</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="shrink-0 rounded-md p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          aria-label="Close"
        >
          <span aria-hidden className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>

      <div className="relative z-0 px-4 py-4 sm:px-5 overflow-y-auto max-h-[min(80vh,720px)] space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add one</h3>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
            <SingleContactForm
              variant="dialog"
              sms={sms}
              defaultSendDelayMinutes={defaultSendDelayMinutes}
              campaigns={campaigns}
              locations={locations}
              defaultLocationId={defaultLocationId}
              onCreated={() => {
                onRefresh();
                onOpenChange(false);
              }}
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Import CSV</h3>
          <p className="text-xs text-slate-500 mb-2.5">When you schedule messages on import, use this template choice:</p>
          <div className="mb-3">
            <MessageTemplatePickers
              idPrefix="add"
              campaigns={campaigns}
              emailTemplateId={emailTemplateId}
              smsTemplateId={smsTemplateId}
              onEmailChange={onEmailTemplateChange}
              onSmsChange={onSmsTemplateChange}
              showSms={sms}
            />
          </div>
          <CsvUploadForm
            variant="dialog"
            sms={sms}
            defaultSendDelayMinutes={defaultSendDelayMinutes}
            onCompleted={onRefresh}
            emailCampaignId={emailTemplateId}
            smsCampaignId={smsTemplateId}
            locations={locations}
            defaultLocationId={defaultLocationId}
          />
        </div>
      </div>
    </dialog>
  );
}
