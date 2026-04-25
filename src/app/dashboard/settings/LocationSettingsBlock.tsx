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
import { isPlatformUrlActive } from "@/lib/reviewPlatformsFromLocations";
import type { Business, BusinessLocation, PublicConfig } from "@/types";

type Props = {
  publicConfig: PublicConfig;
  onBusinessRefresh?: (r: { business: Business | null }) => void;
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

export default function LocationSettingsBlock({ publicConfig, onBusinessRefresh }: Props) {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [defaultId, setDefaultId] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [linkEdits, setLinkEdits] = useState<Record<string, Record<string, string>>>({});
  /** Platform ids the user has opened to add; rows with no server URL yet stay until removed or saved. */
  const [openExtraSlots, setOpenExtraSlots] = useState<Record<string, string[]>>({});

  const otherPlatforms = (publicConfig.review_platforms || []).filter((p) => p.id !== "google");
  const googlePlatform = (publicConfig.review_platforms || []).find((p) => p.id === "google");

  const reload = useCallback(() => {
    return listMyLocations()
      .then((r) => {
        setLocations(r.locations);
        setDefaultId(r.default_location_id);
        setLinkEdits({});
      })
      .catch((e: Error) => setErr(e?.message || "Failed to load locations"));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  /** After refresh, only keep "draft" add-slots for platforms with no URL saved on the server yet. */
  useEffect(() => {
    setOpenExtraSlots((prev) => {
      const n: Record<string, string[]> = {};
      for (const loc of locations) {
        n[loc.id] = (prev[loc.id] || []).filter((pid) => {
          if (pid === "google") {
            if ((loc.gmb_review_url || "").trim()) return false;
            return true;
          }
          return !(loc.platform_links?.[pid] || "").trim();
        });
      }
      return n;
    });
  }, [locations]);

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]"
      id="store-locations"
    >
      <div className="border-b border-slate-100/90 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/30">
        <div className="flex items-start justify-between gap-2 px-4 py-3.5 sm:px-6 sm:py-4">
          <div className="flex min-w-0 flex-1 gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200/60 bg-slate-50/80 text-slate-600">
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
                Add a store with a name, then add whichever public review links you use in that store&rsquo;s block —
                same for new or existing stores; each field saves when you leave it.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">
        {err && <p className="mb-3 text-sm text-red-700 rounded-xl border border-red-200/60 bg-red-50/50 px-3 py-2">{err}</p>}

        <div className="space-y-4">
        {locations.map((loc) => (
          <div key={loc.id} className="space-y-2 rounded-2xl border border-slate-200/60 bg-slate-50/30 p-4">
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
                    onClick={async () => {
                      if (!confirm(`Delete "${loc.name}"?`)) return;
                      setBusy(true);
                      setErr("");
                      try {
                        await deleteMyLocation(loc.id);
                        const br = await getMyBusiness();
                        onBusinessRefresh?.(br);
                        await reload();
                      } catch (e) {
                        setErr(e instanceof Error ? e.message : "Could not delete");
                      } finally {
                        setBusy(false);
                      }
                    }}
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
                            className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-2.5 space-y-1.5"
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
                              onBlur={async (e) => {
                                const v = e.target.value.trim();
                                if (v === (loc.platform_links?.[p.id] || "")) return;
                                setBusy(true);
                                setErr("");
                                try {
                                  await putMyLocationPlatformLinks(loc.id, { [p.id]: v || "" });
                                  await reload();
                                } catch (err2) {
                                  setErr(err2 instanceof Error ? err2.message : "Could not save link");
                                } finally {
                                  setBusy(false);
                                }
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {visibleGoogle && (
                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-2.5 space-y-1.5">
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
                                if ((loc.gmb_review_url || "").trim() !== "" || isPlatformUrlActive("google", loc)) {
                                  await patchMyLocation(loc.id, { gmb_review_url: "" });
                                  await reload();
                                }
                                setOpenExtraSlots((m) => ({
                                  ...m,
                                  [loc.id]: (m[loc.id] || []).filter((x) => x !== "google"),
                                }));
                                setLinkEdits((m) => {
                                  const row = { ...m[loc.id] };
                                  delete row.gmb;
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
                        value={linkEdits[loc.id]?.gmb ?? loc.gmb_review_url ?? ""}
                        onChange={(e) => {
                          setLinkEdits((m) => ({
                            ...m,
                            [loc.id]: { ...m[loc.id], gmb: e.target.value },
                          }));
                        }}
                        onBlur={async (e) => {
                          const v = e.target.value.trim();
                          if (v === (loc.gmb_review_url || "")) return;
                          setBusy(true);
                          setErr("");
                          try {
                            await patchMyLocation(loc.id, { gmb_review_url: v });
                            const br = await getMyBusiness();
                            onBusinessRefresh?.(br);
                            await reload();
                          } catch (err2) {
                            setErr(err2 instanceof Error ? err2.message : "Could not save");
                          } finally {
                            setBusy(false);
                          }
                        }}
                      />
                    </div>
                  )}
                  {(canAddGoogle || addable.length > 0) && (
                    <div className="pt-1.5 w-full max-w-md">
                      <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor={`add-site-${loc.id}`}>
                        Add a review site
                      </label>
                      <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-1.5 shadow-sm shadow-slate-900/[0.02]">
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
                                if ((loc.gmb_review_url || "").trim() || ex.includes("google")) return m;
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
          </div>
        ))}
      </div>

        <div className="mt-6 border-t border-slate-200/80 pt-5">
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
        <button
          type="button"
          className="btn-primary sm:mb-0.5 h-10 min-h-10 w-full sm:w-auto px-4 shrink-0"
          disabled={busy || !newName.trim()}
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
          Add store
        </button>
        </div>
        </div>
      </div>
    </section>
  );
}
