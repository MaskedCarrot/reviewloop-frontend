"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createMyLocation,
  deleteMyLocation,
  getMyBusiness,
  listMyLocations,
  patchMyLocation,
  putMyLocationPlatformLinks,
} from "@/lib/api";
import ReviewPlatformIcon from "@/components/ReviewPlatformIcon";
import StyledSelect from "@/components/StyledSelect";
import InfoTip from "@/components/InfoTip";
import ConfirmDialog from "@/components/ConfirmDialog";
import UsageMeter from "@/components/UsageMeter";
import { ButtonSpinner } from "@/components/ToastProvider";
import { isPlatformUrlActive } from "@/lib/reviewPlatformsFromLocations";
import type { Business, BusinessLocation, PlanUsage, PublicConfig } from "@/types";

type Props = {
  publicConfig: PublicConfig;
  onBusinessRefresh?: (r: { business: Business | null }) => void;
  /**
   * Plan + usage. Free plan blocks creation past the location cap; Pro is unlimited.
   * Optional so older callers don't break, but recommended in production.
   */
  usage?: PlanUsage | null;
};

function StoreHeaderIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path d="M8 2v4m8-4v4" strokeLinecap="round" />
      <path d="M3 10a1 1 0 0 1 1-1h16a1 1 0 0 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" strokeLinejoin="round" />
      <path d="M3 20h18" strokeLinecap="round" />
    </svg>
  );
}

function RemoveIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1-2h10l1 2M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LocationSettingsBlock({ publicConfig, onBusinessRefresh, usage }: Props) {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [linkEdits, setLinkEdits] = useState<Record<string, Record<string, string>>>({});
  /** Platform ids the user has opened to add; rows with no server URL yet stay until removed or saved. */
  const [openExtraSlots, setOpenExtraSlots] = useState<Record<string, string[]>>({});
  /** True while the floating save bar is flushing pending edits across every dirty store. */
  const [savingAll, setSavingAll] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BusinessLocation | null>(null);
  const [deletingLoc, setDeletingLoc] = useState(false);

  const otherPlatforms = (publicConfig.review_platforms || []).filter((p) => p.id !== "google");
  const googlePlatform = (publicConfig.review_platforms || []).find((p) => p.id === "google");

  const reload = useCallback(() => {
    return listMyLocations()
      .then((r) => {
        setLocations(r.locations);
        setDefaultId(r.default_location_id);
        setLinkEdits({});
        setLoaded(true);
      })
      .catch((e: Error) => {
        setErr(e?.message || "Failed to load locations");
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** Edits in `loc` that differ from what's saved on the server. */
  const dirtyChangesFor = (loc: BusinessLocation): Record<string, string> => {
    const edits = linkEdits[loc.id];
    if (!edits) return {};
    const changed: Record<string, string> = {};
    for (const [pid, val] of Object.entries(edits)) {
      const saved = (loc.platform_links?.[pid] || "").trim();
      const next = (val || "").trim();
      if (next !== saved) changed[pid] = next;
    }
    return changed;
  };

  const dirtyLocations = locations.filter((l) => Object.keys(dirtyChangesFor(l)).length > 0);
  const dirtyCount = dirtyLocations.length;

  const saveAllChanges = async () => {
    if (dirtyCount === 0) return;
    setSavingAll(true);
    setErr("");
    try {
      // Sequentially flush — small N (locations are <= a handful in practice)
      // and the API isn't transactional across stores, so a serial loop with
      // a single error surface is the least surprising UX.
      for (const loc of dirtyLocations) {
        const changed = dirtyChangesFor(loc);
        if (Object.keys(changed).length) {
          await putMyLocationPlatformLinks(loc.id, changed);
        }
      }
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save links");
    } finally {
      setSavingAll(false);
    }
  };

  const discardAllChanges = () => {
    if (dirtyCount === 0) return;
    setLinkEdits({});
  };

  /** After refresh, only keep "draft" add-slots for platforms with no URL saved on the server yet. */
  useEffect(() => {
    setOpenExtraSlots((prev) => {
      const n: Record<string, string[]> = {};
      for (const loc of locations) {
        n[loc.id] = (prev[loc.id] || []).filter((pid) => {
          if (pid === "google") {
            if ((loc.platform_links?.["google"] || "").trim()) return false;
            return true;
          }
          return !(loc.platform_links?.[pid] || "").trim();
        });
      }
      return n;
    });
  }, [locations]);

  return (
    <div className="space-y-4 sm:space-y-5">
    <section
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]"
      id="store-locations"
    >
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/30">
        <div className="flex items-start justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
              <StoreHeaderIcon />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="text-base font-semibold tracking-tight text-slate-900">Store locations</h2>
                <InfoTip size="md" label="Stores and review sites">
                  <p>
                    Each store is one set of public review links: e.g. Yelp, Google, TripAdvisor, Facebook — only{" "}
                    <strong>one link per site per store</strong>. No platform is required, and the <em>default</em> store
                    is just the app fallback for contacts and flows that don&rsquo;t name a store.
                  </p>
                </InfoTip>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                Add a store with a name, then add whichever public review links you use in that store&rsquo;s block.
                Edits across every store stay local until you press <strong className="text-slate-700">Save changes</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {err && <p className="mb-3 text-sm text-red-700 rounded-xl border border-red-200/60 bg-red-50/50 px-3 py-2">{err}</p>}

        {/* Free-plan single-store meter. Pro users (limit === null) see nothing. */}
        {usage && usage.limits.locations !== null && (
          <div className="mb-4">
            <UsageMeter
              label="Stores"
              used={usage.used.locations_total}
              limit={usage.limits.locations}
              hint={`Free plan supports ${usage.limits.locations} store. Upgrade to Pro for unlimited stores.`}
              inline
            />
          </div>
        )}

        <div className="space-y-4">
        {locations.map((loc) => (
          <div key={loc.id} className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="font-semibold text-slate-800">
                {loc.name}
                {String(defaultId) === String(loc.id) && (
                  <span className="ml-2 text-xs font-medium text-emerald-700">Default</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {String(defaultId) !== String(loc.id) && (
                  <button
                    type="button"
                    className="text-xs text-slate-600 hover:text-slate-900 underline"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      setErr("");
                      try {
                        await patchMyLocation(loc.id, { is_default: true });
                        const br = await getMyBusiness();
                        onBusinessRefresh?.(br);
                        await reload();
                      } catch (e) {
                        setErr(e instanceof Error ? e.message : "Could not set default");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Set as default
                  </button>
                )}
                {locations.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-700 hover:underline"
                    disabled={busy}
                    onClick={() => setDeleteTarget(loc)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            <div className="pt-0.5 space-y-1.5">
              <h3 className="text-sm font-medium text-slate-800">Public review links</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Use whichever public pages you have for this store — not only Google. Nothing here is more &quot;default&quot;
                than the rest; add only the sites you use, in any order.
              </p>
            </div>
            <div className="pt-1.5 space-y-2">
            {(() => {
              const order = otherPlatforms.map((x) => x.id);
              const withSaved = order.filter((id) => (loc.platform_links?.[id] || "").trim() !== "");
              const open = openExtraSlots[loc.id] || [];
              const visibleNonGoogle = Array.from(new Set([...withSaved, ...open.filter((p) => p !== "google")])).sort(
                (a, b) => order.indexOf(a) - order.indexOf(b)
              );
              const visibleGoogle =
                isPlatformUrlActive("google", loc) || open.includes("google");
              const addable = otherPlatforms.filter((p) => !visibleNonGoogle.includes(p.id));
              const canAddGoogle = !visibleGoogle;
              return (
                <div className="space-y-2">
                  {visibleNonGoogle.length > 0 ? (
                    <div className="space-y-2">
                      {visibleNonGoogle.map((pid) => {
                        const p = otherPlatforms.find((x) => x.id === pid);
                        if (!p) return null;
                        const cur = linkEdits[loc.id]?.[p.id] ?? loc.platform_links?.[p.id] ?? "";
                        const isLive = isPlatformUrlActive(p.id, loc);
                        return (
                          <div
                            key={p.id}
                            className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <ReviewPlatformIcon platformId={p.id} size="md" />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-slate-800">{p.label}</div>
                                  {p.description ? (
                                    <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {isLive && (
                                  <span className="text-xs font-medium text-emerald-700">Live</span>
                                )}
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title={`Remove ${p.label}`}
                                  disabled={busy}
                                  onClick={async () => {
                                    setBusy(true);
                                    setErr("");
                                    try {
                                      if ((loc.platform_links?.[p.id] || "").trim() !== "" || isLive) {
                                        await putMyLocationPlatformLinks(loc.id, { [p.id]: "" });
                                        await reload();
                                      }
                                      setOpenExtraSlots((m) => ({
                                        ...m,
                                        [loc.id]: (m[loc.id] || []).filter((x) => x !== p.id),
                                      }));
                                      setLinkEdits((m) => {
                                        const row = { ...m[loc.id] };
                                        delete row[p.id];
                                        return { ...m, [loc.id]: row };
                                      });
                                    } catch (e2) {
                                      setErr(e2 instanceof Error ? e2.message : "Could not save");
                                    } finally {
                                      setBusy(false);
                                    }
                                  }}
                                >
                                  <span className="sr-only">Remove</span>
                                  <RemoveIcon />
                                </button>
                              </div>
                            </div>
                            <input
                              className="input text-sm w-full"
                              placeholder={`https://… (your ${p.label} review link)`}
                              value={cur}
                              onChange={(e) => {
                                setLinkEdits((m) => ({
                                  ...m,
                                  [loc.id]: { ...m[loc.id], [p.id]: e.target.value },
                                }));
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {visibleGoogle && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <ReviewPlatformIcon platformId="google" size="md" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-800">
                              {googlePlatform?.label ?? "Google"}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {googlePlatform?.description ??
                                "Maps or Business public review / profile, if you use Google for this store."}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isPlatformUrlActive("google", loc) ? (
                            <span className="text-xs font-medium text-emerald-700">Live</span>
                          ) : (
                            <span className="text-xs text-amber-800/90">Optional</span>
                          )}
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title={`Remove ${googlePlatform?.label ?? "Google"}`}
                            disabled={busy}
                            onClick={async () => {
                              setBusy(true);
                              setErr("");
                              try {
                                if (isPlatformUrlActive("google", loc)) {
                                  await putMyLocationPlatformLinks(loc.id, { google: "" });
                                  await reload();
                                }
                                setOpenExtraSlots((m) => ({
                                  ...m,
                                  [loc.id]: (m[loc.id] || []).filter((x) => x !== "google"),
                                }));
                                setLinkEdits((m) => {
                                  const row = { ...m[loc.id] };
                                  delete row.google;
                                  return { ...m, [loc.id]: row };
                                });
                              } catch (e2) {
                                setErr(e2 instanceof Error ? e2.message : "Could not save");
                              } finally {
                                setBusy(false);
                              }
                            }}
                          >
                            <span className="sr-only">Remove</span>
                            <RemoveIcon />
                          </button>
                        </div>
                      </div>
                      <input
                        className="input text-sm w-full"
                        placeholder="https://g.page/… or https://www.google.com/maps/…"
                        value={linkEdits[loc.id]?.google ?? loc.platform_links?.["google"] ?? ""}
                        onChange={(e) => {
                          setLinkEdits((m) => ({
                            ...m,
                            [loc.id]: { ...m[loc.id], google: e.target.value },
                          }));
                        }}
                      />
                    </div>
                  )}
                  {(canAddGoogle || addable.length > 0) && (
                    <div className="pt-1.5 w-full max-w-md">
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={`add-site-${loc.id}`}>
                        Add a review site
                      </label>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-sm shadow-slate-900/[0.02]">
                        <StyledSelect
                          id={`add-site-${loc.id}`}
                          className="!h-9 !min-h-0 !py-2 text-sm !border-0 !bg-white/90 !ring-0 !shadow-none"
                          value=""
                          disabled={busy}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) return;
                            if (v === "google") {
                              setOpenExtraSlots((m) => {
                                const ex = m[loc.id] || [];
                                if (ex.includes("google") || isPlatformUrlActive("google", loc)) return m;
                                return { ...m, [loc.id]: [...ex, "google"] };
                              });
                              e.target.value = "";
                              return;
                            }
                            setOpenExtraSlots((m) => {
                              const ex = m[loc.id] || [];
                              if (ex.includes(v) || withSaved.includes(v)) return m;
                              return { ...m, [loc.id]: [...ex, v] };
                            });
                            e.target.value = "";
                          }}
                        >
                          <option value="">Choose a site (Yelp, Google, …)</option>
                          {canAddGoogle && (
                            <option value="google">
                              {googlePlatform?.label ?? "Google (Maps / Business profile)"}
                            </option>
                          )}
                          {addable.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </StyledSelect>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
            </div>
            {Object.keys(dirtyChangesFor(loc)).length > 0 && (
              <p className="border-t border-slate-200 pt-2.5 -mx-1 text-[11px] font-medium text-warm-700">
                Unsaved changes — use the Save changes bar below.
              </p>
            )}
          </div>
        ))}
        {!loaded && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-5 w-40 rounded bg-slate-200/80 animate-pulse" />
            <div className="mt-3 h-9 w-full rounded bg-slate-200/60 animate-pulse" />
          </div>
        )}
      </div>

        <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="text-sm font-semibold text-slate-800">Add a store</div>
        <p className="mt-0.5 text-xs text-slate-500 mb-3 max-w-2xl">
          Enter a name and add the store, then in <strong>Public review links</strong> use <em>Add a review site</em> to
          pick Google, Yelp, or other sites — only what you add appears; nothing is pre-filled.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end max-w-2xl">
          <div className="flex-1 min-w-[12rem]">
            <label className="label" htmlFor="add-store-name">
              New store name
            </label>
            <input
              id="add-store-name"
              className="input w-full"
              placeholder="e.g. Northside"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
        {(() => {
          const locLimit = usage?.limits?.locations ?? null;
          const locUsed = usage?.used?.locations_total ?? 0;
          const atCap = locLimit !== null && locUsed >= locLimit;
          return (
            <button
              type="button"
              className="btn-primary sm:mb-0.5 h-10 min-h-10 w-full sm:w-auto px-4 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={busy || !newName.trim() || atCap}
              title={
                atCap
                  ? `Free plan supports ${locLimit} store. Upgrade to Pro for unlimited stores.`
                  : undefined
              }
              onClick={async () => {
                setBusy(true);
                setErr("");
                const name = newName.trim();
                try {
                  await createMyLocation({ name });
                  setNewName("");
                  const br = await getMyBusiness();
                  onBusinessRefresh?.(br);
                  await reload();
                } catch (e) {
                  setErr(e instanceof Error ? e.message : "Could not save");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {atCap ? "Upgrade to add more" : "Add store"}
            </button>
          );
        })()}
        </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        body={
          <p>
            Removing this store also clears its public review links. Contacts assigned to it stay in
            your list but lose the per-store routing.
          </p>
        }
        confirmLabel="Delete store"
        tone="danger"
        busy={deletingLoc}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setDeletingLoc(true);
          setErr("");
          try {
            await deleteMyLocation(deleteTarget.id);
            const br = await getMyBusiness();
            onBusinessRefresh?.(br);
            await reload();
            setDeleteTarget(null);
          } catch (e) {
            setErr(e instanceof Error ? e.message : "Could not delete");
          } finally {
            setDeletingLoc(false);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>

    {/* Floating save bar — mirrors the Profile tab's footer. Only renders when at
        least one store has unsaved link edits, so it stays out of the way otherwise. */}
    {dirtyCount > 0 && (
      <div className="sm:sticky sm:bottom-4 z-10">
        <div className="overflow-hidden rounded-2xl border border-warm-200/70 bg-white/95 shadow-card-hover backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
            <p className="min-w-0 text-sm text-slate-700">
              You have unsaved review-link changes in{" "}
              <span className="font-semibold text-slate-900">
                {dirtyCount} {dirtyCount === 1 ? "store" : "stores"}
              </span>
              . They&apos;ll save together when you press Save changes.
            </p>
            <div className="flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                className="text-sm text-slate-600 hover:text-slate-900 px-2 h-11"
                disabled={savingAll}
                onClick={discardAllChanges}
              >
                Discard
              </button>
              <button
                type="button"
                disabled={savingAll}
                onClick={() => void saveAllChanges()}
                className="btn-primary h-11 shrink-0 px-6 w-full sm:w-auto font-semibold"
              >
                {savingAll ? (
                  <>
                    <ButtonSpinner />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
