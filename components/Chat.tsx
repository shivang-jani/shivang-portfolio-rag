"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hi — I'm Shivang's assistant. Ask me about his experience, the systems he's built, his stack, or how to get in touch.";

const SUGGESTIONS = [
  "What does Shivang do?",
  "Tell me about the voice AI platform",
  "What's his strongest stack?",
  "Is he open to opportunities?",
];

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);

    // Placeholder assistant message we stream into.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Request failed.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `${message} You can always reach Shivang at shivangjani1601@gmail.com.`,
        };
        return copy;
      });
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="terminal">
      <div className="terminal__bar">
        <div className="terminal__dots">
          <i />
          <i />
          <i />
        </div>
        <span className="terminal__path">ask@shivang-jani:~$ chat</span>
      </div>

      <div className="terminal__log" ref={logRef} aria-live="polite" data-lenis-prevent>
        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          return (
            <div key={i} className={`msg msg--${m.role === "user" ? "user" : "bot"}`}>
              <span className="msg__who mono">
                {m.role === "user" ? "you ›" : "shivang ›"}
              </span>
              <span className="msg__text">
                {m.content}
                {m.role === "assistant" && isLast && busy && (
                  <span className="caret" aria-hidden="true" />
                )}
              </span>
            </div>
          );
        })}
      </div>

      {messages.length <= 1 && (
        <div className="suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} disabled={busy}>
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="terminal__form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <span className="terminal__prompt" aria-hidden="true">
          ›
        </span>
        <input
          ref={inputRef}
          className="terminal__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Shivang's work…"
          maxLength={1000}
          aria-label="Ask about Shivang"
          disabled={busy}
        />
        <button className="terminal__send" type="submit" disabled={busy || !input.trim()}>
          {busy ? "…" : "send"}
        </button>
      </form>
    </div>
  );
}
