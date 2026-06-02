# API Reference

**Base URL:** `https://your-host.com` (local: `http://localhost:3000`)

**Endpoint:** `POST /api/v1/generate`  
**Headers:** `Content-Type: application/json`

---

## Actions

### `messages`

Generate three campaign messages within a character limit.

```json
{
  "action": "messages",
  "business": { "businessName": "...", "phone": "...", "email": "...", "...": "..." },
  "maxLength": 160,
  "userPrompt": "optional creative hint"
}
```

`maxLength` is optional (40–500, default **160**). `minLength` is optional; if omitted, the server derives a minimum from `maxLength` (e.g. 145 when max is 160).

Response includes `messages` (array of 3 strings), `minLength`, `maxLength`, `campaignType`.

---

### `POST /api/v1/ad-brain`

Run the **Ad Brain** only (no image generation): viral angle, 4-line Instagram copy, creative direction, and `image_prompt`.

```json
{
  "business": { "businessName": "...", "industry": "real estate", "...": "..." },
  "format": "9:16",
  "userPrompt": "house for rent in lekki",
  "campaignMessage": "optional SMS line"
}
```

Response: `{ "ok": true, "adBrain": { "business_understanding", "viral_angle", "copy": ["","","",""], "creative_direction", "image_prompt" } }`

Flyer jobs (`action: "flyer"`) run Ad Brain automatically per variant when `FLYER_AD_BRAIN=true` (default). Each variant in the job result may include an `adBrain` object.

---

### `flyer`

Generate two flyer variants. Requires a message from step 1 or your own copy.

**Async by default** — the API returns immediately with a `jobId`. Poll until done (see [Async jobs](#async-jobs)). Pass `"async": false` only if you want a blocking response (may timeout after 60s on Hobby).

```json
{
  "action": "flyer",
  "business": { "...": "..." },
  "campaignMessage": "Your campaign text (length should match the limit you used in messages step)...",
  "format": "9:16",
  "logoDataUrl": "data:image/png;base64,...",
  "userPrompt": "optional"
}
```

Immediate response:

```json
{
  "ok": true,
  "async": true,
  "jobId": "uuid",
  "status": "queued",
  "pollUrl": "/api/v1/jobs/uuid",
  "pollIntervalMs": 3000
}
```

When finished, `GET pollUrl` returns `status: "succeeded"` and `result` with `variants`, `copy`, `campaignType`, etc.

`format`: `9:16` (default) | `4:5` | `1:1` | `16:9`

---

### `full`

Runs `messages` then `flyer` using one chosen message (default: first). **Async by default** — same job + poll flow as `flyer`.

```json
{
  "action": "full",
  "business": { "...": "..." },
  "format": "9:16",
  "messageIndex": 0,
  "logoDataUrl": "optional"
}
```

Poll `GET /api/v1/jobs/:jobId` until `status` is `succeeded`. The `result` includes `messages`, `campaignMessage`, and the full flyer payload.

---

## Async jobs

Flyer generation takes 30–120+ seconds. To avoid HTTP timeouts, **`flyer` and `full` return immediately** and run in the background.

1. **Start:** `POST /api/v1/generate` with `action: "flyer"` or `"full"` (async is default).
2. **Poll:** `GET /api/v1/jobs/:jobId` every 2–4 seconds.

| `status` | Meaning |
|----------|---------|
| `queued` | Job accepted |
| `running` | In progress — check `progress`: `messages`, `copy`, `variants`, `compose` |
| `succeeded` | Done — read `result` |
| `failed` | Error in `error` |

**Blocking mode:** pass `"async": false` to wait for the full response in one request (not recommended for production).

**Vercel production:** add Redis/KV (`KV_REST_API_URL`, `KV_REST_API_TOKEN`) so job state is shared across serverless instances. Without it, polling may return 404 if a different instance handles the poll request.

---

## Business profile fields

| Field | Required |
|-------|----------|
| `businessName` | yes |
| `tagline`, `phone`, `email`, `website`, `location` | recommended |
| `industry`, `targetAudience`, `callToAction` | recommended |
| `campaignType` | `grand_opening`, `promo_sale`, `product_launch`, `event`, `seasonal_offer`, `limited_time`, `general_brand` |
| `brandPrimary`, `brandSecondary`, `brandColors` | recommended |
| `imageProps`, `adStylePreset` | optional |

---

## Errors

```json
{ "ok": false, "error": "description" }
```

---

## Environment (server)

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Copy generation |
| `OPENAI_API_KEY` | Flyer images |
| `FLYER_FINISHED_DESIGN` | `true` — type in image |
| `FLYER_AD_BRAIN` | `true` (default) — full Ad Brain: viral angle, Instagram copy, creative direction, image prompt |
| `FLYER_WORLD_CLASS` | `true` — used when `FLYER_AD_BRAIN=false` |
| `FLYER_IMAGE_PROVIDER` | `openai` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Async job storage on Vercel (Redis from Marketplace) |

---

## Examples

```bash
# Messages only
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"messages","business":{"businessName":"Acme","tagline":"Quality","phone":"080","email":"a@b.com","website":"acme.com","location":"Lagos","industry":"Retail","targetAudience":"All","campaignType":"promo_sale","brandPrimary":"#000","brandSecondary":"#f60","brandColors":"#000,#f60","callToAction":"Shop"}}'

# Flyer (async — returns jobId immediately)
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"flyer","business":{...},"campaignMessage":"...145+ chars...","format":"9:16"}'

# Poll until succeeded
curl http://localhost:3000/api/v1/jobs/JOB_ID

# Full pipeline (async)
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"full","business":{...},"format":"9:16"}'
```

Legacy paths `/api/v1/campaign-messages` and `/api/v1/flyer` redirect to the same handler.
