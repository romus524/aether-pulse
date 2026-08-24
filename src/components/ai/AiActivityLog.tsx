import { AgentAuditEntry } from "../../platform/agentProtocol";

interface AiActivityLogProps {
  entries: AgentAuditEntry[];
  onClose: () => void;
}

export function AiActivityLog({ entries, onClose }: AiActivityLogProps) {
  return (
    <section className="ap-ai-log-panel" aria-label="AI Activity Log">
      <header>
        <div>
          <p>AI Activity Log</p>
          <small>Every automation event is recorded with operator, tools, and verification.</small>
        </div>
        <button type="button" onClick={onClose} aria-label="Close activity log">
          Close
        </button>
      </header>
      <ol>
        {entries.length === 0 && <li className="is-empty">No AI automation events yet.</li>}
        {entries.map((entry) => (
          <li key={entry.id}>
            <time>{entry.timestamp.slice(11, 19)}</time>
            <div>
              <strong>
                {entry.userName} ({entry.role})
              </strong>
              <p>“{entry.utterance}”</p>
              <p>
                Tools: {entry.tools.filter((t) => t !== "validatePermissions").join(", ") || "none"} ·{" "}
                {entry.success ? "Verified" : "Failed"} · Audit {entry.id}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
