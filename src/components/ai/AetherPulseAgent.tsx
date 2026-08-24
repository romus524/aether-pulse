import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, Send, X } from "lucide-react";
import { AetherPulseMark } from "./AetherPulseMark";
import { getN8nSessionId, sendN8nMessage } from "../../lib/n8nChat";
import "./aetherAgent.css";

type AgentPhase = "idle" | "thinking" | "processing" | "executing" | "completed";
type ClinicalTone = "quiet" | "clinical" | "emergency";
type Role = "user" | "agent";

interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  at: number;
  tone: ClinicalTone;
  executing?: boolean;
}

const PHASE_STATUS: Record<AgentPhase, string> = {
  idle: "Standing by",
  thinking: "Thinking",
  processing: "Processing",
  executing: "Executing",
  completed: "Completed",
};

function classifyTone(text: string): ClinicalTone {
  const value = text.toLowerCase();
  if (
    /\b(emergency|code blue|cardiac arrest|unresponsive|critical fall|immediate dispatch)\b/.test(value)
  ) {
    return "emergency";
  }
  if (
    /\b(fall[- ]?risk|fall detected|bed[- ]?exit|wandering|apnea|respiratory|abnormal movement|syncope)\b/.test(
      value,
    )
  ) {
    return "clinical";
  }
  return "quiet";
}

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AetherPulseAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "agent",
      text: "AetherPulse AI online. Ask in natural language — I can review CSI movement, bed-exit risk, respiratory signals, and ward workflow.",
      at: Date.now(),
      tone: "quiet",
    },
  ]);
  const threadRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const sessionId = useMemo(() => getN8nSessionId(), []);
  const busy = phase === "thinking" || phase === "processing" || phase === "executing";

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const schedulePhase = (next: AgentPhase, delay: number) => {
    const id = window.setTimeout(() => setPhase(next), delay);
    timers.current.push(id);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];

    const userTone = classifyTone(text);
    setInput("");
    setPhase("thinking");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text, at: Date.now(), tone: userTone },
      {
        id: "pending",
        role: "agent",
        text: "Analyzing recent CSI movement data…",
        at: Date.now(),
        tone: "quiet",
        executing: true,
      },
    ]);
    schedulePhase("processing", 420);
    schedulePhase("executing", 980);

    try {
      const reply = await sendN8nMessage(text, sessionId);
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      setPhase("executing");
      await new Promise((resolve) => window.setTimeout(resolve, 280));
      const tone = classifyTone(`${text}\n${reply}`);
      setPhase("completed");
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== "pending")
          .concat({
            id: crypto.randomUUID(),
            role: "agent",
            text: reply,
            at: Date.now(),
            tone,
          }),
      );
      schedulePhase("idle", 1600);
    } catch (error) {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
      const detail = error instanceof Error ? error.message : "Unknown error";
      setPhase("idle");
      setMessages((prev) =>
        prev
          .filter((msg) => msg.id !== "pending")
          .concat({
            id: crypto.randomUUID(),
            role: "agent",
            text: `The n8n agent could not complete that request (${detail}). The command was not executed.`,
            at: Date.now(),
            tone: "quiet",
          }),
      );
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launcher"
            type="button"
            className="ap-ai-launcher"
            aria-label="Open AetherPulse AI"
            initial={{ scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.86, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={() => setOpen(true)}
          >
            <AetherPulseMark size="lg" active />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.section
            key="shell"
            className="ap-ai-shell"
            role="dialog"
            aria-label="AetherPulse AI command interface"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <header className="ap-ai-header">
              <AetherPulseMark size="lg" active={busy || phase === "completed"} />
              <div className="ap-ai-identity">
                <h2>AetherPulse AI</h2>
                <p>Healthcare operations agent · n8n</p>
                <div className="ap-ai-status">
                  <span className={`ap-ai-status-dot${busy ? " is-busy" : ""}`} />
                  {PHASE_STATUS[phase]}
                </div>
              </div>
              <button type="button" className="ap-ai-icon-btn" aria-label="Close agent" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </header>

            <div className="ap-ai-thread" ref={threadRef}>
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`ap-ai-msg ap-ai-msg--${message.role}${
                    message.tone === "clinical" ? " is-clinical" : message.tone === "emergency" ? " is-emergency" : ""
                  }`}
                >
                  <header>
                    <span>{message.role === "user" ? "You" : "AetherPulse AI"}</span>
                    <time>{formatClock(message.at)}</time>
                  </header>
                  {message.executing ? (
                    <div className="ap-ai-exec">
                      <i />
                      <span>{message.text}</span>
                    </div>
                  ) : (
                    <p>{message.text}</p>
                  )}
                </article>
              ))}
            </div>

            <form className="ap-ai-composer" onSubmit={onSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask AetherPulse… e.g. Analyze the latest patient movement pattern."
                rows={2}
                disabled={busy}
              />
              <button className="ap-ai-send" type="submit" disabled={busy || !input.trim()} aria-label="Send command">
                {busy ? <Brain size={16} /> : <Send size={16} />}
              </button>
            </form>

          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
