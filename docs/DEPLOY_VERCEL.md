# Deploy on Vercel (recommended)

Vercel is the best fit for this app: Next.js native support and **up to 300s** API timeouts on Pro (flyer generation needs 30–120s+).

## 1. Import the project

1. Sign in at [vercel.com](https://vercel.com).
2. **Add New…** → **Project**.
3. Import **GitHub** repo: [Gbemiga636/mysogi](https://github.com/Gbemiga636/mysogi).
4. Vercel auto-detects **Next.js** — leave defaults:
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build`
   - **Output:** (automatic)

5. Click **Deploy** (first deploy may fail without env vars — add them in step 2 and redeploy).

## 2. Environment variables

**Project → Settings → Environment Variables**

Add for **Production**, **Preview**, and **Development**:

| Name | Value |
|------|--------|
| `GROQ_API_KEY` | your Groq key |
| `OPENAI_API_KEY` | your OpenAI key |
| `FLYER_IMAGE_PROVIDER` | `openai` |
| `FLYER_FINISHED_DESIGN` | `true` |
| `FLYER_TEXT_MODE` | `hybrid` |
| `FLYER_PREMIUM_HYBRID` | `false` |
| `ELITE_CREATIVE_ENGINE` | `true` |

Optional:

| Name | Purpose |
|------|---------|
| `CLOUDINARY_URL` | Logo overlay + image editor |
| `REPLICATE_API_TOKEN` | Replicate image/video |
| `KV_REST_API_URL` | **Required for async jobs on Vercel** — add Redis from [Vercel Marketplace](https://vercel.com/marketplace) |
| `KV_REST_API_TOKEN` | Redis REST token (auto-set when you connect Redis) |

Copy from your local `.env.local`. Never commit secrets.

After adding variables: **Deployments → … → Redeploy**.

## 3. Plan & timeouts

| Plan | Max function duration | Flyer API |
|------|---------------------|-----------|
| Hobby | 60 seconds | Async jobs recommended — background work may still hit 60s limit for dual flyers |
| Pro | 300 seconds | Comfortable for `action: "full"` (messages + 2 flyers) |

**Async generation (default):** `POST /api/v1/generate` with `action: "flyer"` or `"full"` returns a `jobId` in under a second. Generation continues in the background; clients poll `GET /api/v1/jobs/:jobId` every few seconds. This avoids 504 gateway timeouts even when images take 60–120s.

Routes already set `maxDuration = 300` in code; `vercel.json` reinforces this for key API paths.

## 4. Your live URLs

After deploy:

| | URL |
|---|-----|
| **Studio UI** | `https://<project>.vercel.app` |
| **API** | `https://<project>.vercel.app/api/v1/generate` |
| **API docs (GET)** | `https://<project>.vercel.app/api/v1/generate` |

Custom domain: **Settings → Domains** → e.g. `ads.mysogi.com.ng`.

## 5. Test production API

**Messages only (~10s):**

```bash
curl -X POST "https://YOUR-PROJECT.vercel.app/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"messages\",\"business\":{\"businessName\":\"Mysogi Bakery\",\"tagline\":\"Fresh daily\",\"phone\":\"+2348000000000\",\"email\":\"hi@mysogi.ng\",\"website\":\"mysogi.ng\",\"location\":\"Lagos\",\"industry\":\"Food\",\"targetAudience\":\"Families\",\"campaignType\":\"grand_opening\",\"brandPrimary\":\"#0B1F3A\",\"brandSecondary\":\"#F26522\",\"brandColors\":\"#0B1F3A, #F26522\",\"callToAction\":\"Order Now\"}}"
```

**Flyer (async — poll for result):**

```bash
# 1. Start job (returns jobId immediately)
curl -X POST "https://YOUR-PROJECT.vercel.app/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"flyer\",\"format\":\"9:16\",\"campaignMessage\":\"YOUR_145_CHAR_MESSAGE...\",\"business\":{...}}"

# 2. Poll every 3s until status is succeeded
curl "https://YOUR-PROJECT.vercel.app/api/v1/jobs/JOB_ID"
```

**Full pipeline (Pro recommended):**

```bash
curl -X POST "https://YOUR-PROJECT.vercel.app/api/v1/generate" \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"full\",\"format\":\"9:16\",\"business\":{...}}"
```

## 6. Production notes

- Prefer **`imageUrl`** in API responses for external apps (CDN URL from OpenAI).
- **`localImageUrl`** works on the same Vercel host but is a short-lived cache; use for preview in your own UI only.
- **FFmpeg / video polish** still requires FFmpeg on the server — Vercel serverless does not include it. Flyer + SMS APIs work fully.
- **Ephemeral disk:** `.data/flyer-images` is not permanent; redeploys clear it.

## 7. Auto-deploy from GitHub

Every push to `main` triggers a new production deployment (default).

```bash
git push origin main
```

## 8. CLI (optional)

```bash
npm i -g vercel
vercel login
cd mysogi
vercel link
vercel env pull .env.local
vercel --prod
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on ESLint | Fix errors locally with `npm run build` |
| `504` / timeout on flyer | Use async (default) + Redis/KV; upgrade to Pro for long jobs |
| Job not found (404) on poll | Add Redis/KV env vars on Vercel |
| OpenAI errors | Check `OPENAI_API_KEY` and billing |
| Groq errors | Check `GROQ_API_KEY` |

API reference: [docs/API.md](./API.md)
