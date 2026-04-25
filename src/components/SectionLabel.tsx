import type { ReactNode } from "react";

/** Uppercase label — same pattern as the Credits (billing) page. */
export default function SectionLabel({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return (
    <h2
      id={id}
      className={["text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400", className].filter(Boolean).join(" ")}
    >
      {children}
    </h2>
  );
}
