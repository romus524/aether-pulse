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
