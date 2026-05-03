import type { ReactNode } from "react";
import React from "react";
import DashboardCreditBalance from "@/components/DashboardCreditBalance";
import InfoTip from "@/components/InfoTip";

type Info = {
  label: string;
  children: ReactNode;
  size?: "sm" | "md";
};

/**
 * Shared dashboard title row: page title and {@link InfoTip} on the same line (like Credits);
 * optional eyebrow, description, and a trailing column (filters, primary actions).
 */
export default function DashboardPageHeader({
  eyebrow,
  title,
  description,
  info,
  end,
  /** Current credit balance; when set, shows the shared "Credits" chip (links to billing) next to `end`. */
  credits,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: ReactNode;
  info?: Info;
  end?: ReactNode;
  credits?: number;
}) {
  const showCreditChip = typeof credits === "number";
  const showEndColumn = showCreditChip || end != null;

  return (
    <header className="space-y-2.5">
      {eyebrow ? (
        <p className="app-eyebrow">
          <span className="h-1.5 w-1.5 rounded-full bg-warm-500" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1 relative z-10 sm:z-auto">
          <div className="flex flex-wrap items-baseline gap-1.5 min-w-0">
            <h1 className="app-title shrink-0">{title}</h1>
            {info ? (
              <InfoTip size={info.size ?? "md"} label={info.label}>
                {info.children}
              </InfoTip>
            ) : null}
          </div>
          {description ? (
            <div className="app-subtitle text-slate-600 mt-2 max-w-2xl [&>a]:text-warm-700 [&>a]:font-medium [&>a]:hover:underline [&>a]:underline-offset-2">
              {description}
            </div>
          ) : null}
        </div>
        {showEndColumn ? (
          <div className="flex w-full min-w-0 flex-col gap-2.5 sm:w-auto sm:shrink-0 sm:flex-row sm:items-end sm:justify-end sm:gap-3 sm:pt-0">
            {showCreditChip ? <DashboardCreditBalance balance={credits} /> : null}
            {end != null ? <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{end}</div> : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
