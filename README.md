# Mysogi Ad Generator

Next.js API and studio for generating campaign SMS copy and marketing flyers for [Mysogi](https://mysogi.com.ng).

## Requirements

- Node.js 20+
- API keys: `GROQ_API_KEY`, `OPENAI_API_KEY` (see `.env.example`)

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

App UI: `http://localhost:3000`

## API (integrators)

**One endpoint:** `POST /api/v1/generate`

| `action` | Purpose |
|----------|---------|
| `messages` | 3 SMS messages (145–160 chars) |
| `flyer` | 2 flyer images (needs `campaignMessage`) |
| `full` | Messages + flyer in one request |

Details: [docs/API.md](docs/API.md)

Discovery: `GET /api/v1/generate`

## Deploy (Vercel — recommended)

See **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)** — import [Gbemiga636/mysogi](https://github.com/Gbemiga636/mysogi), add env vars, deploy.

Production API: `https://<your-project>.vercel.app/api/v1/generate`

Also supported: [Netlify](docs/DEPLOY_NETLIFY.md) (shorter timeouts on free tier).

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # production server
```

## License

Proprietary — Mysogi Company Limited.
