import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "home-in": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-blob": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(3%, -3%) scale(1.03)" },
        },
        "float-blob-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-3%, 3%) scale(1.04)" },
        },
        "hero-bob": {
          "0%, 100%": { transform: "translateY(0) rotate(-1.2deg)" },
          "50%": { transform: "translateY(-9px) rotate(1.2deg)" },
        },
        "hero-bubble": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-4px) scale(1.01)" },
        },
        "send-fly": {
          "0%": { transform: "translate(-2rem, 1rem) scale(0.9)", opacity: "0" },
          "20%": { opacity: "1" },
          "60%": { transform: "translate(0.5rem, -0.6rem) scale(1)", opacity: "1" },
          "85%": { opacity: "0" },
          "100%": { transform: "translate(2rem, -1.6rem) scale(0.92)", opacity: "0" },
        },
        "stars-pop": {
          "0%": { transform: "scale(0.85)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "100%": { transform: "scale(1.65)", opacity: "0" },
        },
        "ticker-x": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "shine": {
          "0%": { transform: "translateX(-110%)" },
          "100%": { transform: "translateX(110%)" },
        },
      },
      animation: {
        "home-in": "home-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) both",
        "float-blob": "float-blob 18s ease-in-out infinite",
        "float-blob-2": "float-blob-2 22s ease-in-out 1s infinite",
        "hero-bob": "hero-bob 5.5s ease-in-out infinite",
        "hero-bubble": "hero-bubble 4s ease-in-out infinite 0.2s",
        "send-fly": "send-fly 3.6s ease-in-out infinite",
        "stars-pop": "stars-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
        "ticker-x": "ticker-x 60s linear infinite",
        "shine": "shine 2.4s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        // Display serif for marketing hero / oversized titles.
        // Wired up via the next/font Fraunces variable in app/layout.tsx.
        display: ["var(--font-display)", "Fraunces", "ui-serif", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        // Tuned for opaque cards on a slightly tinted page.
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 2px 4px -1px rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px -4px rgba(15, 23, 42, 0.08), 0 12px 32px -12px rgba(15, 23, 42, 0.10)",
        "card-hover": "0 1px 2px rgba(15, 23, 42, 0.05), 0 6px 18px -6px rgba(15, 23, 42, 0.12), 0 20px 40px -16px rgba(15, 23, 42, 0.16)",
        nav: "0 0 0 1px rgba(15, 23, 42, 0.06), 0 4px 24px -4px rgba(15, 23, 42, 0.10)",
        glow: "0 0 0 1px rgba(229, 114, 36, 0.18), 0 8px 24px -8px rgba(229, 114, 36, 0.30)",
        "ring-brand": "0 0 0 4px rgba(229, 114, 36, 0.14)",
      },
      colors: {
        // Single product accent. Both `brand` and `warm` resolve to the same warm
        // amber palette so we can phase callsites over time without breakage. Tuned
        // to read as "apricot" — cosier than orange, friendlier than amber, still
        // passes AA against white surfaces at 600+.
        brand: {
          50: "#fff8f1",
          100: "#fde8d4",
          200: "#facfa8",
          300: "#f5b074",
          400: "#ee8e44",
          500: "#e57224",
          600: "#cf5613",
          700: "#a64113",
          800: "#7d3214",
          900: "#5a2611",
          950: "#3f1a0a",
        },
        warm: {
          50: "#fff8f1",
          100: "#fde8d4",
          200: "#facfa8",
          300: "#f5b074",
          400: "#ee8e44",
          500: "#e57224",
          600: "#cf5613",
          700: "#a64113",
          800: "#7d3214",
          900: "#5a2611",
        },
        // App-wide semantic surface tokens (used by .surface utilities).
        surface: {
          page: "#f6f7fb",
          panel: "#ffffff",
          subtle: "#f8fafc",
          muted: "#f1f5f9",
        },
        ink: {
          DEFAULT: "#0f172a",
          strong: "#0b1220",
          soft: "#1e293b",
          muted: "#334155",
          subtle: "#475569",
          faint: "#64748b",
        },
      },
    },
  },
  plugins: [],
};
export default config;
