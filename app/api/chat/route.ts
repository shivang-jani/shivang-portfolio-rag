import { NextRequest } from "next/server";
import { embedText, chatStream, type ChatMessage } from "@/lib/openai";
import { search, buildContext, hasIndex } from "@/lib/retrieval";
import { SYSTEM_PROMPT } from "@/lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- Lightweight in-memory rate limit (per IP, per instance) --------------
// Protects the OpenAI credits from a visitor hammering the endpoint.
const WINDOW_MS = 60_000;
const MAX_REQ = 15;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > MAX_REQ;
}

const MAX_MESSAGE_CHARS = 1000;
const MAX_HISTORY = 8;

// Relevance guardrail: if the best-matching chunk scores below this, the question
// isn't about Shivang — reply with a canned message and skip the (costly) LLM call.
// Tune via RAG_MIN_SCORE; cosine scores from text-embedding-3-small typically run
// ~0.3–0.6 for on-topic questions and well under ~0.2 for unrelated ones.
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.2);
const OFF_TOPIC_REPLY =
  "I'm Shivang's assistant, so I only answer questions about Shivang — his experience, projects, skills, or how to get in touch. Try asking about his work in AI or backend systems. For anything else, email shivangjani1601@gmail.com.";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  if (rateLimited(ip)) {
    return Response.json(
      { error: "Too many requests. Please slow down a moment." },
      { status: 429 }
    );
  }

  if (!hasIndex()) {
    return Response.json(
      { error: "The knowledge index hasn't been built yet. Run `npm run ingest`." },
      { status: 503 }
    );
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const incoming = Array.isArray(body.messages) ? body.messages : [];
  const history = incoming
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return Response.json({ error: "No user message provided." }, { status: 400 });
  }

  let results: ReturnType<typeof search>;
  try {
    const queryEmbedding = await embedText(lastUser.content);
    results = search(queryEmbedding, 5);
  } catch (err) {
    console.error("Retrieval error:", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Guardrail: off-topic / random questions never reach the LLM, saving tokens.
  const topScore = results[0]?.score ?? 0;
  if (topScore < MIN_SCORE) {
    return new Response(OFF_TOPIC_REPLY, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const context = buildContext(results);

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT(context) },
    ...history,
  ];

  let upstream: Response;
  try {
    upstream = await chatStream(messages);
  } catch (err) {
    console.error("Chat error:", err);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  // Adapt OpenAI's SSE stream to a plain-text token stream for the browser.
  // Pump eagerly in start() — relying on pull() can stall under some runtimes.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = ""; // holds a partial SSE line between reads
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep the last, possibly-incomplete line
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore keep-alive / partial lines
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
