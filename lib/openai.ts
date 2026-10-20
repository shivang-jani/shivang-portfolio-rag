// Server-only OpenAI helpers. This module must never be imported by a client
// component. The API key is read from process.env and never returned to callers.

import "server-only";

const API_KEY = process.env.OPENAI_API_KEY;
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

function requireKey(): string {
  if (!API_KEY) {
    throw new Error("OPENAI_API_KEY is not set on the server.");
  }
  return API_KEY;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireKey()}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!res.ok) {
    throw new Error(`Embedding request failed: ${res.status}`);
  }
  const json = await res.json();
  return json.data[0].embedding as number[];
}

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// Returns the raw streaming Response from OpenAI (SSE). The route adapts it to
// a plain-text stream for the browser.
export async function chatStream(messages: ChatMessage[]): Promise<Response> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireKey()}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      stream: true,
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Chat request failed: ${res.status} ${detail}`);
  }
  return res;
}
