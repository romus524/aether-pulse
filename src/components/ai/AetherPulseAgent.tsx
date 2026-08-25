import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Brain, Check, ChevronDown, Send, X } from "lucide-react";
import { AetherPulseMark } from "./AetherPulseMark";
import { getN8nSessionId } from "../../lib/n8nChat";
import { runAgentCommand } from "../../lib/agentClient";
import {
  AgentCommandResponse,
  AgentPhase,
  AgentStep,
  OperatorRole,
  PlatformSnapshot,
  UiCommand,
} from "../../platform/agentProtocol";
import "./aetherAgent.css";

type ClinicalTone = "quiet" | "clinical" | "emergency";
type ChatRole = "user" | "agent";

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  at: number;
  tone: ClinicalTone;
  executing?: boolean;
  steps?: AgentStep[];
  confirmationId?: string;
  auditId?: string;
}

const PHASE_STATUS: Record<AgentPhase, string> = {
  idle: "Standing by",
  thinking: "Thinking",
  planning: "Planning",
  waiting_approval: "Waiting for approval",
  executing: "Executing",
  verifying: "Verifying",
  completed: "Completed",
  failed: "Failed",
};

interface AetherPulseAgentProps {
  role: OperatorRole;
  userId: string;
  userName: string;
  selectedRoomId?: string;
  onSnapshot?: (snapshot: PlatformSnapshot) => void;
  onUiCommands?: (commands: UiCommand[]) => void;
}

function classifyTone(text: string): ClinicalTone {
  const value = text.toLowerCase();
  if (/\b(emergency|code blue|critical fall|immediate dispatch)\b/.test(value)) return "emergency";
  if (/\b(fall[- ]?risk|bed[- ]?exit|apnea|respiratory|abnormal movement)\b/.test(value)) return "clinical";
  return "quiet";
}

function formatClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
}

function applyResult(
  data: AgentCommandResponse,
  onSnapshot?: (snapshot: PlatformSnapshot) => void,
  onUiCommands?: (commands: UiCommand[]) => void,
) {
  if (data.snapshot) onSnapshot?.(data.snapshot);
  if (data.uiCommands?.length) onUiCommands?.(data.uiCommands);
}

export function AetherPulseAgent({ role, userId, userName, selectedRoomId, onSnapshot, onUiCommands }: AetherPulseAgentProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<AgentPhase>("idle");
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [showSteps, setShowSteps] = useState(true);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "agent",
      text: "AetherPulse AI is your operational assistant. I can create patients, assign wards and beds, change supported settings, run CSI and digital-twin commands, and manage alerts — only with your permissions, confirmation for sensitive changes, and verification from the live system.",
      at: Date.now(),
      tone: "quiet",
    },
  ]);
  const threadRef = useRef<HTMLDivElement>(null);
  const sessionId = useMemo(() => getN8nSessionId(), []);
  const busy = ["thinking", "planning", "executing", "verifying"].includes(phase);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, steps, phase]);

  const pushAgent = (text: string, extra?: Partial<ChatMessage>) => {
    setMessages((prev) => prev.concat({ id: crypto.randomUUID(), role: "agent", text, at: Date.now(), tone: classifyTone(text), ...extra }));
  };

  const handleResponse = (data: AgentCommandResponse) => {
    setSteps(data.steps || []);
    if (data.status === "awaiting_confirmation") {
      setPhase("waiting_approval");
      setPendingConfirm(data.confirmationId || null);
      pushAgent(data.explanation || data.summary, { steps: data.steps, confirmationId: data.confirmationId });
      return;
    }
    if (data.status === "needs_input") {
      setPhase("idle");
      setPendingConfirm(null);
      pushAgent(data.summary + (data.questions?.length ? `\n\n${data.questions.join("\n")}` : ""), { steps: data.steps });
      return;
    }
    applyResult(data, onSnapshot, onUiCommands);
    setPendingConfirm(null);
    setPhase(data.status === "completed" ? "verifying" : data.status === "failed" ? "failed" : "completed");
    const footer = data.auditId ? `\n\nAudit ID: ${data.auditId}` : "";
    pushAgent(`${data.summary}${footer}`, { steps: data.steps, auditId: data.auditId });
    window.setTimeout(() => setPhase(data.status === "completed" ? "completed" : "idle"), 500);
    window.setTimeout(() => setPhase("idle"), 1800);
  };

  const send = async (utterance: string, confirmation?: { confirmationId: string; approved: boolean }) => {
    const text = utterance.trim();
    if (!confirmation && (!text || busy)) return;
    setInput("");
    setPhase(confirmation ? "executing" : "thinking");
    if (!confirmation) {
      setMessages((prev) =>
        prev.concat({
          id: crypto.randomUUID(),
          role: "user",
          text,
          at: Date.now(),
          tone: classifyTone(text),
        }),
      );
      window.setTimeout(() => setPhase("planning"), 220);
    }

    try {
      const data = await runAgentCommand({
        utterance: text || "confirm",
        role,
        userId,
        userName,
        sessionId,
        selectedRoomId,
        confirmationId: confirmation?.confirmationId,
        approved: confirmation?.approved,
      });
      if (!confirmation && data.status !== "awaiting_confirmation") setPhase("executing");
      handleResponse(data);
    } catch (error) {
      setPhase("failed");
      const detail = error instanceof Error ? error.message : "Unknown error";
      pushAgent(`The request could not be completed because the automation service is unavailable (${detail}). No platform change was claimed.`);
      window.setTimeout(() => setPhase("idle"), 1200);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send(input);
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
              <AetherPulseMark size="lg" active={busy || phase === "waiting_approval"} />
              <div className="ap-ai-identity">
                <h2>AetherPulse AI</h2>
                <p>Operational assistant · inherits {role} permissions</p>
                <div className="ap-ai-status">
                  <span className={`ap-ai-status-dot${busy || phase === "waiting_approval" ? " is-busy" : ""}`} />
                  {PHASE_STATUS[phase]}
                </div>
              </div>
              <button type="button" className="ap-ai-icon-btn" aria-label="Close agent" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </header>

            <div className="ap-ai-body">
              {steps.length > 0 && (
                <div className="ap-ai-exec-panel">
                  <button type="button" className="ap-ai-exec-toggle" onClick={() => setShowSteps((v) => !v)}>
                    <span>Execution</span>
                    <ChevronDown size={14} style={{ transform: showSteps ? "rotate(180deg)" : undefined }} />
                  </button>
                  {showSteps && (
                    <ul>
                      {steps.map((step) => (
                        <li key={step.id} className={`is-${step.status}`}>
                          <span>{step.status === "done" ? "✓" : step.status === "running" ? "⟳" : step.status === "blocked" ? "✕" : "·"}</span>
                          <div>
                            <strong>{step.label}</strong>
                            {step.result && <em>{step.result}</em>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

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
                    <p>{message.text}</p>
                    {message.confirmationId && pendingConfirm === message.confirmationId && (
                      <div className="ap-ai-confirm">
                        <button type="button" onClick={() => void send("approved", { confirmationId: message.confirmationId!, approved: true })}>
                          Confirm and execute
                        </button>
                        <button type="button" className="is-ghost" onClick={() => void send("rejected", { confirmationId: message.confirmationId!, approved: false })}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

            {pendingConfirm && (
              <div className="ap-ai-confirm ap-ai-confirm--bar">
                <button type="button" onClick={() => void send("approved", { confirmationId: pendingConfirm, approved: true })}>
                  Confirm and execute
                </button>
                <button type="button" className="is-ghost" onClick={() => void send("rejected", { confirmationId: pendingConfirm, approved: false })}>
                  Cancel
                </button>
              </div>
            )}

            <form className="ap-ai-composer" onSubmit={onSubmit}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="e.g. Add Jane Doe to Ward 3 and enable CSI monitoring."
                rows={1}
                disabled={busy}
              />
              <button className="ap-ai-send" type="submit" disabled={busy || !input.trim()} aria-label="Send command">
                {busy ? <Brain size={16} /> : phase === "completed" ? <Check size={16} /> : <Send size={16} />}
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
