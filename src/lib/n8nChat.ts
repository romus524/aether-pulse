const N8N_WEBHOOK_URL =
  "https://romusking.app.n8n.cloud/webhook/2edb11ba-0824-48d4-a90c-c82a921444be";

const SESSION_KEY = "n8n-chat/sessionId";

function newSessionId(): string {
  return crypto.randomUUID();
}

export function getN8nSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = newSessionId();
    localStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return newSessionId();
  }
}

function extractText(value: unknown, depth = 0): string {
  if (depth > 6 || value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => extractText(item, depth + 1))
      .filter(Boolean)
      .join("\n\n");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["output", "text", "message", "response", "content", "answer"]) {
      const nested = extractText(record[key], depth + 1);
      if (nested) return nested;
    }
    if (typeof record.json === "object") return extractText(record.json, depth + 1);
    if (Array.isArray(record.data)) return extractText(record.data, depth + 1);
  }
  return "";
}

export async function sendN8nMessage(chatInput: string, sessionId: string): Promise<string> {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "sendMessage",
      sessionId,
      chatInput,
    }),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`Agent webhook ${response.status}`);
  }

  if (!raw.trim()) {
    return "AetherPulse received the command, but the workflow returned an empty reply.";
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const text = extractText(parsed);
    return text || raw.trim();
  } catch {
    return raw.trim();
  }
}
