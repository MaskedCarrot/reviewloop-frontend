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
      },
      animation: {
        "home-in": "home-in 0.65s cubic-bezier(0.22, 1, 0.36, 1) both",
        "float-blob": "float-blob 18s ease-in-out infinite",
        "float-blob-2": "float-blob-2 22s ease-in-out 1s infinite",
        "hero-bob": "hero-bob 5.5s ease-in-out infinite",
        "hero-bubble": "hero-bubble 4s ease-in-out infinite 0.2s",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        soft: "0 1px 0 rgba(15, 23, 42, 0.04), 0 2px 8px -2px rgba(15, 23, 42, 0.06), 0 8px 32px -8px rgba(15, 23, 42, 0.1)",
        card: "0 1px 0 rgba(15, 23, 42, 0.05), 0 4px 16px -4px rgba(15, 23, 42, 0.08), 0 12px 40px -12px rgba(15, 23, 42, 0.12)",
        nav: "0 0 0 1px rgba(15, 23, 42, 0.06), 0 4px 24px -4px rgba(15, 23, 42, 0.12)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12), 0 8px 32px -8px rgba(37, 99, 235, 0.2)",
      },
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
export default config;
