// RAG ingestion: chunk the knowledge files, embed them with OpenAI, write embeddings.json.
//
// Run with:  npm run ingest
// (which calls: node --env-file=.env.local scripts/ingest.mjs)
//
// Your OPENAI_API_KEY is read from the environment only. It is never written
// into embeddings.json or anywhere the browser can see it.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE_DIR = join(ROOT, "data", "source");
const OUT_FILE = join(ROOT, "data", "embeddings.json");

const API_KEY = process.env.OPENAI_API_KEY;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const MAX_CHARS = 1200; // ~300 tokens per chunk

if (!API_KEY) {
  console.error(
    "\n  Missing OPENAI_API_KEY.\n" +
      "  Copy .env.local.example to .env.local and add your key, then run `npm run ingest`.\n"
  );
  process.exit(1);
}

// --- Chunking -------------------------------------------------------------

function chunkMarkdown(text, source) {
  const lines = text.split("\n");
  const chunks = [];
  let headingPath = []; // [h1, h2, h3]
  let buffer = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    buffer = [];
    if (!body) return;
    const prefix = headingPath.filter(Boolean).join(" › ");
    const full = prefix ? `${prefix}\n${body}` : body;
    // Split overly long blocks on blank lines so no chunk exceeds MAX_CHARS.
    if (full.length <= MAX_CHARS) {
      chunks.push({ source, heading: prefix, text: full });
      return;
    }
    const paras = body.split(/\n\s*\n/);
    let acc = [];
    let accLen = 0;
    const emit = () => {
      const chunkBody = acc.join("\n\n").trim();
      if (chunkBody) {
        chunks.push({
          source,
          heading: prefix,
          text: prefix ? `${prefix}\n${chunkBody}` : chunkBody,
        });
      }
      acc = [];
      accLen = 0;
    };
    for (const p of paras) {
      if (accLen + p.length > MAX_CHARS && acc.length) emit();
      acc.push(p);
      accLen += p.length + 2;
    }
    emit();
  };

  for (const line of lines) {
    const m = /^(#{1,3})\s+(.*)$/.exec(line);
    if (m) {
      flush();
      const level = m[1].length;
      headingPath = headingPath.slice(0, level - 1);
      headingPath[level - 1] = m[2].trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return chunks;
}

// --- Embeddings -----------------------------------------------------------

async function embedBatch(inputs) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI embeddings failed (${res.status}): ${body}`);
  }
  const json = await res.json();
  return json.data.map((d) => d.embedding);
}

// --- Main -----------------------------------------------------------------

async function main() {
  const files = readdirSync(SOURCE_DIR).filter((f) => f.endsWith(".md"));
  if (!files.length) {
    console.error(`No .md files found in ${SOURCE_DIR}`);
    process.exit(1);
  }

  let chunks = [];
  for (const file of files) {
    const text = readFileSync(join(SOURCE_DIR, file), "utf8");
    const fileChunks = chunkMarkdown(text, basename(file, ".md"));
    chunks = chunks.concat(fileChunks);
  }

  // Skip the placeholder LinkedIn file if it hasn't been filled in yet.
  chunks = chunks.filter(
    (c) => !(c.source === "linkedin" && /placeholder — add your export/i.test(c.text))
  );

  console.log(`Chunked ${files.length} file(s) into ${chunks.length} chunks.`);

  const BATCH = 96;
  const embeddings = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    process.stdout.write(`Embedding ${i + 1}–${i + slice.length}/${chunks.length}... `);
    const vecs = await embedBatch(slice.map((c) => c.text));
    embeddings.push(...vecs);
    console.log("done");
  }

  const out = {
    model: EMBED_MODEL,
    dim: embeddings[0]?.length ?? 0,
    createdAt: new Date().toISOString(),
    chunks: chunks.map((c, i) => ({
      id: `${c.source}-${i}`,
      source: c.source,
      heading: c.heading,
      text: c.text,
      embedding: embeddings[i],
    })),
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify(out));
  console.log(`\nWrote ${out.chunks.length} embedded chunks → data/embeddings.json`);
  console.log(`Model: ${out.model}  ·  dim: ${out.dim}`);
}

main().catch((err) => {
  console.error("\nIngestion failed:", err.message);
  process.exit(1);
});
