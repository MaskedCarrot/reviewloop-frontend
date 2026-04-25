/**
 * Decorative "product" illustration: phone + message + stars (SVG, no external assets).
 */
export function HeroProductVisual() {
  return (
    <div
      className="relative mx-auto w-full max-w-[min(100%,22rem)] select-none animate-hero-bob"
      aria-hidden
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-amber-100/50 via-white/40 to-sky-100/45 blur-2xl" />
      <div className="absolute -right-6 top-1/4 h-32 w-32 rounded-3xl bg-gradient-to-br from-slate-200/25 to-amber-100/30" />

      <div className="relative">
        <div className="absolute -left-2 top-4 z-10 w-[9.5rem] rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
          <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-400">Private note</p>
          <p className="mt-0.5 text-xs font-medium text-slate-700 leading-snug">"Crew was great — we'll be back."</p>
        </div>

        <div className="relative z-[1] mx-auto mt-6 max-w-[15rem] rounded-[2.15rem] border border-slate-300/80 bg-slate-900 p-[0.45rem] shadow-md">
          <div
            className="overflow-hidden rounded-[1.8rem] bg-gradient-to-b from-slate-100 to-slate-200/90"
            style={{ minHeight: "16.5rem" }}
          >
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/80 px-3 py-2">
              <div className="h-1.5 w-8 rounded-full bg-slate-200" />
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="p-3 space-y-2">
              <div className="flex justify-end">
                <div className="max-w-[92%] rounded-2xl rounded-tr-md bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/80">
                  <p className="text-[0.7rem] font-medium text-slate-800 leading-relaxed">Thanks for coming in — mind a quick review?</p>
                  <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200/50">
                    <div className="h-full w-1/2 rounded-full bg-slate-300/50" />
                  </div>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-end gap-0.5 pr-0.5 text-amber-400">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="inline-block text-amber-400">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2l2.4 6.2H21l-5 3.8 1.9 6L12 15.8 5.1 18l1.9-6-5-3.8h6.6L12 2z" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -right-1 bottom-6 z-10 flex items-center gap-2 rounded-full border border-slate-200/90 bg-white py-1.5 pl-2 pr-2.5 shadow-sm">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[0.6rem] font-bold text-slate-600">G</div>
          <div className="text-left">
            <p className="text-[0.55rem] font-bold uppercase leading-none text-slate-500">Open</p>
            <p className="text-[0.7rem] font-semibold text-slate-800 leading-tight">Leave a review</p>
          </div>
        </div>
      </div>
    </div>
  );
}
