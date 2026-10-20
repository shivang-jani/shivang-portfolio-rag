// In-memory vector retrieval over the committed embeddings.json.
// For a resume-sized corpus this is faster and simpler than a vector DB and
// has nothing to leak. Swap `search()` for a MongoDB Atlas Vector Search query
// later if the corpus ever grows large — the rest of the app won't change.

import fs from "node:fs";
import path from "node:path";
import embeddingsData from "@/data/embeddings.json";

export type Chunk = {
  id: string;
  source: string;
  heading: string;
  text: string;
  embedding: number[];
};

type Store = {
  model: string;
  dim: number;
  createdAt: string | null;
  chunks: Chunk[];
};

const EMPTY: Store = { model: "", dim: 0, createdAt: null, chunks: [] };

let cached: Store | null = null;

// Prefer the bundled import (reliable on Vercel). If it's empty — e.g. the dev
// server started before `npm run ingest` ran — fall back to reading the file
// from disk so you don't have to restart dev after building the index.
function getStore(): Store {
  if (cached && cached.chunks.length) return cached;

  const bundled = embeddingsData as unknown as Store;
  if (bundled?.chunks?.length) {
    cached = bundled;
    return cached;
  }

  try {
    const p = path.join(process.cwd(), "data", "embeddings.json");
    const disk = JSON.parse(fs.readFileSync(p, "utf8")) as Store;
    if (disk?.chunks?.length) {
      cached = disk;
      return cached;
    }
  } catch {
    // fall through to empty
  }

  return bundled ?? EMPTY;
}

export function hasIndex(): boolean {
  return getStore().chunks.length > 0;
}

export function embedModel(): string {
  return getStore().model;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function search(
  queryEmbedding: number[],
  topK = 5
): Array<{ chunk: Chunk; score: number }> {
  const scored = getStore().chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, topK);
}

export function buildContext(
  results: Array<{ chunk: Chunk; score: number }>
): string {
  return results
    .map((r, i) => `[Source ${i + 1}: ${r.chunk.source}]\n${r.chunk.text}`)
    .join("\n\n---\n\n");
}
