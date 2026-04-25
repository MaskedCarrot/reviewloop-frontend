import Link from "next/link";

const STEPS: { n: string; label: string; s: string }[] = [
  { n: "1", label: "List", s: "CSV, QR, webhook, or by hand — one list." },
  { n: "2", label: "Send", s: "Email or SMS (where we support it), on your delay." },
  { n: "3", label: "They choose", s: "Google review or a private note to you." },
];

export function HomeThreeSteps() {
  return (
    <section className="border-t border-slate-200/50 bg-slate-50/30">
      <div className="marketing-section py-6 sm:py-8 max-w-5xl">
        <h2 className="app-eyebrow">How it works</h2>
        <ol className="mt-3 grid gap-2 sm:grid-cols-3 sm:gap-3">
          {STEPS.map((st) => (
            <li
              key={st.n}
              className="rounded-2xl border border-slate-200/50 bg-white/60 px-3 py-2.5 sm:py-3"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">Step {st.n}</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{st.label}</p>
              <p className="text-xs text-slate-600 mt-1 leading-snug">{st.s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm">
          <Link href="/how-it-works" className="font-medium text-brand-600 hover:underline">
            More detail →
          </Link>
        </p>
      </div>
    </section>
  );
}
