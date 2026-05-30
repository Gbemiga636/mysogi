# Deploy on Netlify

## 1. Connect the repo

1. Sign in at [Netlify](https://app.netlify.com).
2. **Add new site** → **Import an existing project** → **GitHub**.
3. Choose **[Gbemiga636/mysogi](https://github.com/Gbemiga636/mysogi)**.
4. Netlify should detect settings from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Plugin:** `@netlify/plugin-nextjs` (auto publish)

Do not set a manual publish directory; the Next.js plugin handles output.

## 2. Environment variables

In **Site configuration → Environment variables**, add:

| Variable | Required | Notes |
|----------|----------|--------|
| `GROQ_API_KEY` | Yes | Campaign copy + messages |
| `OPENAI_API_KEY` | Yes | Flyer images |
| `FLYER_IMAGE_PROVIDER` | Yes | `openai` |
| `FLYER_FINISHED_DESIGN` | Yes | `true` |
| `FLYER_TEXT_MODE` | Yes | `hybrid` |
| `FLYER_PREMIUM_HYBRID` | Yes | `false` |
| `ELITE_CREATIVE_ENGINE` | Yes | `true` |
| `CLOUDINARY_URL` | Optional | Logo compose / editor |
| `REPLICATE_API_TOKEN` | Optional | If using Replicate for images/video |

Copy values from your local `.env.local`. Never commit secrets to Git.

## 3. Deploy

Click **Deploy site**. First build may take 3–5 minutes.

Your URLs:

- **App UI:** `https://<site-name>.netlify.app`
- **API:** `https://<site-name>.netlify.app/api/v1/generate`

## 4. Important limits on Netlify

### Flyer API timeout

Generating flyers calls OpenAI and can run **30–120+ seconds**.

- **Free tier:** function timeout ~10s — flyer generation will often **fail**.
- **Pro:** up to **60s** with `netlify.toml` (already set). Heavy `action: "full"` may still timeout; use two calls:
  1. `{ "action": "messages" }`
  2. `{ "action": "flyer", "campaignMessage": "..." }`

For long-running production APIs, **Vercel** (300s) or a **VPS** may be a better fit than Netlify Free.

### Local image URLs

On Netlify, `localImageUrl` (`/api/flyer-image/...`) uses **ephemeral** disk and may not work after the function ends. Integrators should use **`imageUrl`** (CDN/OpenAI URL) in production.

### Video / FFmpeg

Video polish (`fluent-ffmpeg`) **does not run** on Netlify serverless (no FFmpeg binary). The **flyer + campaign message API** works; video export in the UI may fail unless you move video to an external service.

## 5. Custom domain (optional)

**Domain management** → add `ads.mysogi.com.ng` (or your subdomain) and follow DNS instructions.

## 6. Redeploy after changes

Push to `main` on GitHub; Netlify rebuilds automatically if continuous deployment is enabled.

```bash
git add .
git commit -m "Update"
git push origin main
```

## Quick test after deploy

```bash
curl https://YOUR-SITE.netlify.app/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"messages","business":{"businessName":"Test","tagline":"Hi","phone":"080","email":"a@b.com","website":"t.com","location":"Lagos","industry":"Retail","targetAudience":"All","campaignType":"promo_sale","brandPrimary":"#000","brandSecondary":"#f60","brandColors":"#000,#f60","callToAction":"Shop"}}'
```
