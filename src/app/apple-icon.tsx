import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon. Mirrors the warm-gradient star used in `Logo.tsx` and
 * `icon.svg`. Next.js renders this at build time via `@vercel/og`. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f59e0b 0%, #e57224 100%)",
          borderRadius: 36,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={120}
          height={120}
          fill="#ffffff"
        >
          <path d="M12 2l2.39 6.95H22l-6.18 4.49L18.21 21 12 16.27 5.79 21l2.39-7.56L2 8.95h7.61L12 2z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
