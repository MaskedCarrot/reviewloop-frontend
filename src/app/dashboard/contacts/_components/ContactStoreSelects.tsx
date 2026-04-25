"use client";

import StyledSelect from "@/components/StyledSelect";
import type { BusinessLocation } from "@/types";

/** For People / enroll list filters: all stores, unassigned, or a specific store. */
export function ContactListStoreFilter({
  id,
  locations,
  value,
  onChange,
  className = "",
  disabled = false,
}: {
  id: string;
  locations: BusinessLocation[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Store
      </label>
      <StyledSelect
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-0.5 w-full h-9 text-sm"
        disabled={disabled}
      >
        <option value="">All stores</option>
        <option value="unassigned">Unassigned (no store)</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </StyledSelect>
    </div>
  );
}

/** For manual add and CSV: pin contact to a store, or use default at send time. */
export function ContactAssignStoreField({
  id,
  locations,
  defaultLocationId,
  value,
  onChange,
  disabled = false,
  compact = false,
}: {
  id: string;
  locations: BusinessLocation[];
  defaultLocationId: string | null;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  /** Tighter copy for the Add people dialog. */
  compact?: boolean;
}) {
  if (locations.length === 0) {
    return null;
  }
  const def = defaultLocationId ? locations.find((l) => l.id === defaultLocationId) : null;
  return (
    <div>
      <label className="label" htmlFor={id}>
        Store
      </label>
      <StyledSelect id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full" disabled={disabled}>
        <option value="">
          {def ? `Default (${def.name})` : "Default (from Settings at send time)"}
        </option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </StyledSelect>
      <p className={compact ? "text-[11px] text-slate-500 mt-1.5" : "text-sm text-slate-600 leading-relaxed"}>
        Review links in messages use this store when set; otherwise your default store from Settings.
      </p>
    </div>
  );
}
