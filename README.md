# GoodWord frontend

Next.js 14 + Tailwind dashboard and public surfaces for GoodWord.

## Local dev

```bash
cp .env.example .env.local
# edit .env.local — set NEXT_PUBLIC_GOOGLE_CLIENT_ID (optional)
# NEXT_PUBLIC_DEV=1 is only needed for non-`next dev` local-like builds
npm install
npm run dev
# http://127.0.0.1:3001
```

The backend must be running at http://127.0.0.1:8000 (see `shared-backend/`).

## Routes

| Path | Auth? | Purpose |
| --- | --- | --- |
| `/` | – | Marketing landing |
| `/pricing` | – | Plans & top-ups |
| `/login` | – | Google OAuth (optional dev mock) |
| `/dashboard` | yes | Funnel + low-balance banner |
| `/dashboard/contacts` | yes | Manual single send + CSV bulk |
| `/dashboard/campaigns` | yes | Email/SMS template editor |
| `/dashboard/qr` | yes | QR download + webhook key management |
| `/dashboard/feedback` | yes | Internal feedback inbox |
| `/dashboard/billing` | yes | Pro subscription + top-up packs |
| `/dashboard/settings` | yes | Business profile, data export, delete |
| `/r/[token]` | – | Public mobile-first review-routing page |
| `/q/[businessId]` | – | Public QR opt-in form |
| `/privacy`, `/terms`, `/compliance` | – | Legal |

## Production deploy (Vercel)

1. Push to GitHub.
2. New Vercel project → import repo.
3. Set env vars (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_GOOGLE_CLIENT_ID).
4. Add custom domain `goodword.maskedcarrotlabs.com` and follow DNS instructions.
