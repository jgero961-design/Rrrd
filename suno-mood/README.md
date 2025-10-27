# Suno Mood Generator

A minimal web app to generate AI music by mood via a secure backend proxy to Suno API. Frontend supports mood selection and crossfade transitions.

## Setup

1. Node 18+ recommended
2. Copy `.env` and set `SUNO_API_KEY`
3. Install and run

```bash
npm i
node server/index.js
```

Then open http://localhost:3000

## Notes
- API key is only used on server.
- Endpoints:
  - `POST /api/generate` body: `{ mood?: 'happy'|'sad'|'energetic'|'calm'|'dark', prompt?: string }` -> `{ taskId }`
  - `GET /api/status/:taskId` -> relays Suno task status until `audioUrl` is available.
- Frontend crossfades between tracks when mood changes.