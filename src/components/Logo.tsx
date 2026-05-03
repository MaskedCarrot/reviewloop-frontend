import Link from "next/link";

export default function Logo({
  size = "md",
  iconOnly = false,
  href = "/dashboard",
}: {
  size?: "sm" | "md" | "lg";
  iconOnly?: boolean;
  href?: string;
}) {
  const dim = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const ico = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";
  const mark = (
    <span
      className={`inline-flex items-center justify-center ${dim} rounded-lg text-white shadow-sm bg-gradient-to-br from-warm-500 to-warm-600`}
    >
      <svg viewBox="0 0 24 24" className={ico} fill="currentColor" aria-hidden>
        <path d="M12 2l2.39 6.95H22l-6.18 4.49L18.21 21 12 16.27 5.79 21l2.39-7.56L2 8.95h7.61L12 2z" />
      </svg>
    </span>
  );
  if (iconOnly) return mark;
  return (
    <Link href={href} className="flex items-center gap-2.5">
      {mark}
      <span className={`font-semibold tracking-tight text-slate-900 ${text}`}>GoodWord</span>
    </Link>
  );
}
