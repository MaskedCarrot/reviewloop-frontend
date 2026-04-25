/**
 * Step illustrations for /how-it-works (decorative, aria-hidden in parents).
 */
export function VisCollect() {
  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[4/3] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-4 shadow-sm"
      aria-hidden
    >
      <div className="flex h-5 items-center justify-between text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">
        <span>Sources</span>
        <span>Synced</span>
      </div>
      <div className="mt-2 space-y-2">
        {[
          { l: "CSV", c: "bg-emerald-100 text-emerald-800" },
          { l: "QR", c: "bg-sky-100 text-sky-800" },
          { l: "Zap", c: "bg-violet-100 text-violet-800" },
        ].map((x) => (
          <div key={x.l} className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 ring-1 ring-slate-200/80">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`grid h-6 w-6 place-items-center rounded text-[0.6rem] font-bold ${x.c}`}>{x.l}</span>
              <div className="h-1.5 w-20 min-w-0 overflow-hidden rounded-full bg-slate-100" />
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[0.65rem] font-medium text-slate-500">One list</p>
    </div>
  );
}

export function VisTemplate() {
  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[4/3] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-3 shadow-sm"
      aria-hidden
    >
      <div className="rounded-lg bg-white p-2.5 ring-1 ring-slate-200/80">
        <p className="text-[0.55rem] font-bold uppercase text-slate-400">Template</p>
        <p className="mt-0.5 text-[0.7rem] leading-relaxed text-slate-800">
          Hey — had a good visit? We&apos;d love a <span className="font-semibold">quick review</span> (or tell us what we could improve).
        </p>
        <div className="mt-2 h-1.5 w-20 rounded-full bg-slate-200" />
      </div>
      <div className="mt-2 flex justify-end gap-1 text-[0.6rem] text-slate-500">
        <span>1 cr / send</span>
      </div>
    </div>
  );
}

export function VisCustomer() {
  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[4/3] rounded-2xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm"
      aria-hidden
    >
      <div className="mx-auto max-w-[12rem] rounded-[1.2rem] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="h-1 w-8 rounded bg-slate-200 mx-auto mb-1.5" />
        <p className="text-center text-[0.65rem] font-semibold text-slate-800">Leave a review</p>
        <div className="mt-1.5 flex justify-center gap-0.5 text-amber-400">
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} className="text-[0.6rem]">★</span>
          ))}
        </div>
        <div className="mt-1.5 rounded-lg bg-slate-50 p-1.5 text-center">
          <p className="text-[0.55rem] text-slate-500">Or private feedback</p>
        </div>
      </div>
    </div>
  );
}

export function VisDashboard() {
  return (
    <div
      className="relative w-full max-w-sm mx-auto aspect-[4/3] rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/80 to-white p-3 shadow-sm"
      aria-hidden
    >
      <p className="text-[0.6rem] font-bold uppercase text-slate-500">30 days</p>
      <div className="mt-1 flex h-24 items-end gap-1.5">
        {[16, 28, 14, 36, 22, 44, 30, 34].map((h, i) => (
          <div
            key={i}
            className="flex-1 min-w-0 rounded-t-sm bg-slate-300/60"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[0.6rem] text-slate-600">
        <span>Opens & taps</span>
        <span className="font-medium text-slate-800">↗</span>
      </div>
    </div>
  );
}

export function HowItWorksHeroImage() {
  return (
    <div className="relative w-full max-w-lg mx-auto select-none" aria-hidden>
      <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-tr from-amber-100/30 via-white to-sky-100/30 blur-2xl" />
      <div className="relative grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="h-1.5 w-10 rounded bg-slate-200 mb-1" />
          <p className="text-[0.7rem] text-slate-600">Sends on your schedule, quiet hours respected.</p>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/90 p-3 shadow-sm">
          <p className="text-[0.6rem] font-semibold text-slate-500 uppercase">Inbox</p>
          <p className="text-[0.7rem] text-slate-700">"Dinner was slow — not the usual."</p>
        </div>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-100/80 p-3 flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <p className="text-[0.7rem] font-medium text-slate-800">Message delivered</p>
        </div>
      </div>
    </div>
  );
}
