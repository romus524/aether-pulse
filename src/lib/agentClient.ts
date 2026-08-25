import {
  AgentCommandRequest,
  AgentCommandResponse,
  AgentAuditEntry,
} from "../platform/agentProtocol";
import { readJsonResponse, userFacingHttpError, StructuredHttpError, isJsonFailure } from "./httpJson";

export function apiBase(): string {
  return import.meta.env.VITE_API_URL || "";
}

export class AgentClientError extends Error {
  readonly structured?: StructuredHttpError;
  constructor(message: string, structured?: StructuredHttpError) {
    super(message);
    this.name = "AgentClientError";
    this.structured = structured;
  }
}

export async function runAgentCommand(body: AgentCommandRequest): Promise<AgentCommandResponse> {
  const requestId = crypto.randomUUID();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${apiBase()}/api/agent/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-AetherPulse-Role": body.role,
        "X-AetherPulse-User": body.userId,
        "X-AetherPulse-Name": body.userName,
        "X-Request-Id": requestId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const parsed = await readJsonResponse<AgentCommandResponse>(response, requestId);
    if (isJsonFailure(parsed)) {
      console.warn("[AetherPulse AI]", {
        endpoint: "/api/agent/command",
        request_id: requestId,
        status: parsed.error.status_code,
        content_type: parsed.error.content_type,
        error_type: parsed.error.error_type,
        preview: parsed.error.preview,
      });
      throw new AgentClientError(userFacingHttpError(parsed.error), parsed.error);
    }
    if (!parsed.data?.summary && !parsed.data?.status) {
      throw new AgentClientError("The API returned JSON that was not an agent command result. No platform change was claimed.");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof AgentClientError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AgentClientError("The automation service could not be reached in time. No platform change was claimed.");
    }
    throw new AgentClientError("The automation service could not be reached. No platform change was claimed.");
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchAgentAudit(): Promise<AgentAuditEntry[]> {
  const response = await fetch(`${apiBase()}/api/agent/audit`, { headers: { Accept: "application/json" } });
  const parsed = await readJsonResponse<{ audit?: AgentAuditEntry[] }>(response);
  if (!parsed.ok) return [];
  return parsed.data.audit || [];
}
