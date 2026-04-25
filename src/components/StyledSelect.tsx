"use client";

/**
 * Native select with custom chevron — matches our inputs without default browser chrome.
 */
export default function StyledSelect({
  id,
  className = "",
  children,
  ...rest
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        id={id}
        className={`input w-full appearance-none cursor-pointer pr-10 ${className}`}
        {...rest}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="opacity-70">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    </div>
  );
}
