# Shivang Jani — Portfolio + RAG Chatbot

A Next.js portfolio landing page with an embedded assistant that answers questions
about Shivang using RAG (retrieval-augmented generation) over his resume and profile.

- **Landing page:** `app/page.tsx` + `app/globals.css` — a telemetry-console design.
- **Chatbot:** `components/Chat.tsx` (browser) → `app/api/chat/route.ts` (server).
- **RAG index:** `data/source/*.md` → `scripts/ingest.mjs` → `data/embeddings.json`.
- **Retrieval:** `lib/retrieval.ts` — in-memory cosine similarity (no DB needed).

## How the API key stays secret

- `OPENAI_API_KEY` lives **only** on the server: in `.env.local` locally, and as a
  Vercel environment variable in production.
- It is **never** prefixed `NEXT_PUBLIC_`, so Next.js never bundles it into browser code.
- Every OpenAI call happens in `lib/openai.ts`, imported only by the server route
  `app/api/chat/route.ts` (which also imports `server-only` as a guard).
- The browser only ever calls your own `/api/chat`. Open DevTools → Network while
  chatting: you'll see requests to `/api/chat` with no key, and OpenAI calls never
  appear there because they happen server-side.

## Setup

Requires **Node.js 20.6+** (for `--env-file`).

```bash
# 1. install
npm install

# 2. add your key
cp .env.local.example .env.local
#   then edit .env.local and paste your OpenAI key

# 3. build the embeddings index (reads your key from .env.local)
npm run ingest

# 4. run
npm run dev
# open http://localhost:3000
```

## Updating the knowledge base

Edit or add Markdown files in `data/source/` (e.g. paste your LinkedIn export into
`data/source/linkedin.md`), then re-run:

```bash
npm run ingest
```

No code changes needed — every `.md` file in `data/source/` is picked up automatically.

### Syncing GitHub

Pull your public repos + READMEs into `data/source/github.md`, then embed them:

```bash
npm run sync:github   # writes data/source/github.md from the GitHub API
npm run ingest        # embeds it alongside the resume/profile
```

Set `GITHUB_USERNAME` to change the account and `GITHUB_TOKEN` to raise the API
rate limit (neither is required for a small number of repos).

## Deploying to Vercel (free)

1. Push this repo to GitHub.
2. Import it at vercel.com → New Project.
3. Add an environment variable: `OPENAI_API_KEY` = your key.
4. Deploy. (`data/embeddings.json` is committed, so the index ships with the build.)

Re-running `npm run ingest` locally and committing the updated `data/embeddings.json`
is how you refresh the deployed bot's knowledge.

## Cost notes

- Embeddings: `text-embedding-3-small`, run once per ingest over a tiny corpus — cents.
- Chat: `gpt-4o-mini`, capped at 500 output tokens per reply, with a per-IP rate
  limit (15 req/min) in the API route to protect your credits.

## Optional: MongoDB Atlas Vector Search

For a resume-sized corpus you don't need a vector DB — the in-memory search in
`lib/retrieval.ts` is faster and free. If the corpus ever grows large, swap the
`search()` function for a MongoDB Atlas Vector Search query (free M0 tier supports
it) and change `scripts/ingest.mjs` to upsert vectors into a collection instead of
writing `embeddings.json`. Nothing else in the app changes.
