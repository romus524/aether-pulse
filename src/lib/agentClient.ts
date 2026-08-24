import {
  AgentCommandRequest,
  AgentCommandResponse,
  AgentAuditEntry,
  OperatorRole,
} from "../platform/agentProtocol";

export function apiBase(): string {
  return import.meta.env.VITE_API_URL || "";
}

export async function runAgentCommand(body: AgentCommandRequest): Promise<AgentCommandResponse> {
  const response = await fetch(`${apiBase()}/api/agent/command`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-AetherPulse-Role": body.role,
      "X-AetherPulse-User": body.userId,
      "X-AetherPulse-Name": body.userName,
    },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as AgentCommandResponse;
  if (!response.ok && !data?.summary) {
    throw new Error(typeof data === "object" ? JSON.stringify(data) : "Agent command failed");
  }
  return data;
}

export async function fetchAgentAudit(): Promise<AgentAuditEntry[]> {
  const response = await fetch(`${apiBase()}/api/agent/audit`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.audit || [];
}
