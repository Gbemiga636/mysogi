# API Reference

**Base URL:** `https://your-host.com` (local: `http://localhost:3000`)

**Endpoint:** `POST /api/v1/generate`  
**Headers:** `Content-Type: application/json`

---

## Actions

### `messages`

Generate three campaign SMS lines.

```json
{
  "action": "messages",
  "business": { "businessName": "...", "phone": "...", "email": "...", "...": "..." }
}
```

Response includes `messages` (array of 3 strings), `minLength` (145), `maxLength` (160), `campaignType`.

---

### `flyer`

Generate two flyer variants. Requires a message from step 1 or your own copy.

```json
{
  "action": "flyer",
  "business": { "...": "..." },
  "campaignMessage": "Your 145–160 character campaign text...",
  "format": "9:16",
  "logoDataUrl": "data:image/png;base64,...",
  "userPrompt": "optional"
}
```

`format`: `9:16` (default) | `4:5` | `1:1` | `16:9`

Response includes `variants` (2 items with `imageUrl`, `localImageUrl`, etc.), `copy`, `campaignType`, `layoutBalance`.

Timeout: up to ~5 minutes.

---

### `full`

Runs `messages` then `flyer` using one chosen message (default: first).

```json
{
  "action": "full",
  "business": { "...": "..." },
  "format": "9:16",
  "messageIndex": 0,
  "logoDataUrl": "optional"
}
```

Returns `messages`, `campaignMessage`, and full flyer payload.

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
| `FLYER_IMAGE_PROVIDER` | `openai` |

---

## Examples

```bash
# Messages only
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"messages","business":{"businessName":"Acme","tagline":"Quality","phone":"080","email":"a@b.com","website":"acme.com","location":"Lagos","industry":"Retail","targetAudience":"All","campaignType":"promo_sale","brandPrimary":"#000","brandSecondary":"#f60","brandColors":"#000,#f60","callToAction":"Shop"}}'

# Flyer
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"flyer","business":{...},"campaignMessage":"...145+ chars...","format":"9:16"}'

# Full pipeline
curl -X POST http://localhost:3000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"full","business":{...},"format":"9:16"}'
```

Legacy paths `/api/v1/campaign-messages` and `/api/v1/flyer` redirect to the same handler.
