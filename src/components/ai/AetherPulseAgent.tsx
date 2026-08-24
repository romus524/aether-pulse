import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Brain, Check, Cpu, Send, Sparkles, Workflow, X } from "lucide-react";
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

interface TimelineEvent {
  id: string;
  at: number;
  label: string;
}

const TOOLS = ["CSI twin", "Ward map", "Fall FSM", "n8n"];

const PHASE_COPY: Record<AgentPhase, { status: string; task: string; workflow: string }> = {
  idle: {
    status: "Standing by",
    task: "Awaiting a natural-language command",
    workflow: "Ready",
  },
  thinking: {
    status: "Thinking",
    task: "Interpreting clinical intent",
    workflow: "AI Agent",
  },
  processing: {
    status: "Processing",
    task: "Selecting connected n8n tools",
    workflow: "Tool",
  },
  executing: {
    status: "Executing",
    task: "Running the AetherPulse workflow",
    workflow: "Processing",
  },
  completed: {
    status: "Completed",
    task: "Result ready for review",
    workflow: "Result",
  },
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

const NODES = [
  { id: "agent", label: "AI Agent", icon: Bot },
  { id: "tool", label: "Tool", icon: Workflow },
  { id: "processing", label: "Processing", icon: Cpu },
  { id: "result", label: "Result", icon: Check },
] as const;

function nodeState(phase: AgentPhase, id: (typeof NODES)[number]["id"]): "idle" | "active" | "done" {
  const order = ["agent", "tool", "processing", "result"] as const;
  const index = order.indexOf(id);
  if (phase === "idle") return "idle";
  if (phase === "completed") return "done";
  const activeIndex =
    phase === "thinking" ? 0 : phase === "processing" ? 1 : phase === "executing" ? 2 : 3;
  if (index < activeIndex) return "done";
  if (index === activeIndex) return "active";
  return "idle";
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
  const [timeline, setTimeline] = useState<TimelineEvent[]>([
    { id: "boot", at: Date.now(), label: "Agent connected to n8n webhook" },
  ]);
  const [insight, setInsight] = useState(
    "No new clinical insight. Ward telemetry remains the source of truth until a command is run.",
  );
  const [alert, setAlert] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const sessionId = useMemo(() => getN8nSessionId(), []);
  const phaseMeta = PHASE_COPY[phase];
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

  const pushTimeline = (label: string) => {
    setTimeline((prev) => [{ id: crypto.randomUUID(), at: Date.now(), label }, ...prev].slice(0, 8));
  };

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
    pushTimeline("Interpreted clinician command");
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
      const tone = classifyTone(`${text}\n${reply}`);
      setPhase("completed");
      pushTimeline("n8n workflow returned a result");
      setInsight(reply.slice(0, 220));
      if (tone !== "quiet") {
        setAlert(tone === "emergency" ? "Emergency-priority language in the latest exchange." : "Clinically significant language in the latest exchange.");
      }
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
      window.setTimeout(() => setPhase("idle"), 1600);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Unknown error";
      setPhase("idle");
      pushTimeline("Workflow request failed");
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
                  {phaseMeta.status}
                </div>
              </div>
              <button type="button" className="ap-ai-icon-btn" aria-label="Close agent" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </header>

            <div className="ap-ai-meta">
              <div className="ap-ai-chip">
                <span>Current task</span>
                <strong>{phaseMeta.task}</strong>
              </div>
              <div className="ap-ai-chip">
                <span>Connected tools</span>
                <div className="ap-ai-tools">
                  {TOOLS.map((tool) => (
                    <em key={tool}>{tool}</em>
                  ))}
                </div>
              </div>
            </div>

            <div className="ap-ai-flow" data-phase={phase}>
              <div className="ap-ai-flow-head">
                <span>Workflow</span>
                <small>{phaseMeta.workflow}</small>
              </div>
              <div className="ap-ai-graph">
                <svg className="ap-ai-edges" viewBox="0 0 320 12" preserveAspectRatio="none" aria-hidden>
                  <path className="ap-ai-edges__track" d="M16 6 H304" />
                  <path className="ap-ai-edges__flow" d="M16 6 H304" />
                </svg>
                {NODES.map((node) => {
                  const Icon = node.icon;
                  const state = nodeState(phase, node.id);
                  return (
                    <div key={node.id} className={`ap-ai-node is-${state}`}>
                      <Icon />
                      <label>{node.label}</label>
                    </div>
                  );
                })}
              </div>
              <ul className="ap-ai-phases">
                {(["Thinking", "Processing", "Executing", "Completed"] as const).map((label) => {
                  const on =
                    (label === "Thinking" && (phase === "thinking" || busy || phase === "completed")) ||
                    (label === "Processing" && (phase === "processing" || phase === "executing" || phase === "completed")) ||
                    (label === "Executing" && (phase === "executing" || phase === "completed")) ||
                    (label === "Completed" && phase === "completed");
                  return (
                    <li key={label} className={on ? "is-on" : ""}>
                      {label}
                    </li>
                  );
                })}
              </ul>
              <ul className="ap-ai-timeline">
                {timeline.slice(0, 3).map((event) => (
                  <li key={event.id}>
                    <time>{formatClock(event.at)}</time>
                    {event.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ap-ai-thread" ref={threadRef}>
              {alert && (
                <div className="ap-ai-alert" role="status">
                  {alert}
                </div>
              )}
              <div className="ap-ai-insight">
                <Sparkles size={12} />
                <p>{insight}</p>
              </div>
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
