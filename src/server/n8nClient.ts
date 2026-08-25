import {
  isRetryableStatus,
  readJsonResponse,
  StructuredHttpError,
  isJsonFailure,
} from "../lib/httpJson";

export interface N8nSuccessContract {
  success?: boolean;
  status?: string;
  action?: string;
  message?: string;
  output?: string;
  data?: Record<string, unknown>;
  execution_id?: string;
  error?: { type?: string; retryable?: boolean };
}

export interface N8nCallResult {
  attempted: boolean;
  confirmed: boolean;
  conversationalText?: string;
  executionId?: string;
  statusCode?: number;
  retryCount: number;
  durationMs: number;
  error?: StructuredHttpError;
}

export interface N8nPayload {
  request_id: string;
  action: string;
  user_message: string;
  session_id: string;
  timestamp: string;
  chatInput?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

const DEFAULT_URL =
  process.env.N8N_WEBHOOK_URL ||
  "https://romusking.app.n8n.cloud/webhook/2edb11ba-0824-48d4-a90c-c82a921444be";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function interpret(
  data: N8nSuccessContract,
  action: string,
): { confirmed: boolean; conversationalText?: string; executionId?: string } {
  const text = typeof data.output === "string" ? data.output.trim() : typeof data.message === "string" ? data.message.trim() : "";
  if (data.success === false || data.status === "failed") {
    return { confirmed: false, conversationalText: text || undefined, executionId: data.execution_id };
  }
  if (data.success === true || data.status === "completed" || data.status === "processing") {
    return { confirmed: true, conversationalText: text || undefined, executionId: data.execution_id };
  }
  if (action === "sendMessage" && text) {
    return { confirmed: true, conversationalText: text, executionId: data.execution_id };
  }
  return { confirmed: false, conversationalText: text || undefined, executionId: data.execution_id };
}

export async function callN8nWebhook(
  payload: N8nPayload,
  options?: { timeoutMs?: number; maxRetries?: number; fetchImpl?: typeof fetch },
): Promise<N8nCallResult> {
  const timeoutMs = options?.timeoutMs ?? 12000;
  const maxRetries = options?.maxRetries ?? 2;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const started = Date.now();
  let retryCount = 0;
  let lastError: StructuredHttpError | undefined;
  let lastStatus: number | undefined;

  if (!DEFAULT_URL || DEFAULT_URL.includes("webhook-test/")) {
    return {
      attempted: false,
      confirmed: false,
      retryCount: 0,
      durationMs: 0,
      error: {
        success: false,
        error: true,
        error_type: "BAD_REQUEST",
        status_code: 0,
        content_type: "",
        message: "N8N_WEBHOOK_URL is missing or points at a test webhook.",
        retryable: false,
        request_id: payload.request_id,
      },
    };
  }

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(DEFAULT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...payload,
          chatInput: payload.chatInput ?? payload.user_message,
          sessionId: payload.sessionId ?? payload.session_id,
        }),
        signal: controller.signal,
      });
      lastStatus = response.status;
      const parsed = await readJsonResponse<N8nSuccessContract>(response, payload.request_id);
      if (!isJsonFailure(parsed)) {
        const meaning = interpret(parsed.data, payload.action);
        return {
          attempted: true,
          confirmed: meaning.confirmed,
          conversationalText: meaning.conversationalText,
          executionId: meaning.executionId,
          statusCode: parsed.status,
          retryCount,
          durationMs: Date.now() - started,
        };
      }
      lastError = parsed.error;
      const canRetry = parsed.error.retryable && isRetryableStatus(parsed.error.status_code) && attempt < maxRetries;
      if (!canRetry) {
        return {
          attempted: true,
          confirmed: false,
          statusCode: parsed.error.status_code,
          retryCount,
          durationMs: Date.now() - started,
          error: parsed.error,
        };
      }
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      lastError = {
        success: false,
        error: true,
        error_type: aborted ? "TIMEOUT" : "NETWORK",
        status_code: aborted ? 408 : 0,
        content_type: "",
        message: aborted ? "Automation service timed out." : "Automation service could not be reached.",
        retryable: true,
        request_id: payload.request_id,
      };
      if (attempt >= maxRetries) {
        return {
          attempted: true,
          confirmed: false,
          retryCount,
          durationMs: Date.now() - started,
          error: lastError,
        };
      }
    } finally {
      clearTimeout(timer);
    }
    retryCount += 1;
    await sleep(400 * 2 ** attempt);
  }

  return {
    attempted: true,
    confirmed: false,
    statusCode: lastStatus,
    retryCount,
    durationMs: Date.now() - started,
    error: lastError,
  };
}

export function n8nWebhookConfigured(): boolean {
  return Boolean(DEFAULT_URL) && !DEFAULT_URL.includes("webhook-test/");
}
