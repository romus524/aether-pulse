export type HttpErrorType =
  | "UPSTREAM_RESPONSE_NOT_JSON"
  | "MALFORMED_JSON"
  | "EMPTY_RESPONSE"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "NETWORK"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "BAD_REQUEST";

export interface StructuredHttpError {
  success: false;
  error: true;
  error_type: HttpErrorType;
  status_code: number;
  content_type: string;
  message: string;
  retryable: boolean;
  preview?: string;
  request_id?: string;
}

export interface JsonSuccess<T> {
  ok: true;
  status: number;
  contentType: string;
  data: T;
}

export interface JsonFailure {
  ok: false;
  error: StructuredHttpError;
}

export function isJsonFailure(value: JsonSuccess<unknown> | JsonFailure): value is JsonFailure {
  return value.ok === false;
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS.has(status);
}

export function errorTypeForStatus(status: number): HttpErrorType {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 408) return "TIMEOUT";
  if (status === 429) return "RATE_LIMITED";
  return "HTTP_ERROR";
}

export function sanitizePreview(raw: string, max = 180): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, max);
}

export function looksLikeHtml(raw: string, contentType: string): boolean {
  if (contentType.includes("text/html")) return true;
  return /^\s*</.test(raw);
}

export function looksLikeJson(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
}

export function userFacingHttpError(error: StructuredHttpError): string {
  if (error.error_type === "UPSTREAM_RESPONSE_NOT_JSON" || error.error_type === "MALFORMED_JSON") {
    return "I couldn't complete that automation because the automation service returned an invalid response. The request itself was received, but the action was not confirmed as completed.";
  }
  if (error.error_type === "TIMEOUT" || error.error_type === "NETWORK") {
    return "The automation service could not be reached in time. No platform change was claimed.";
  }
  if (error.error_type === "UNAUTHORIZED" || error.error_type === "FORBIDDEN") {
    return "The automation service rejected this request (authorization). No platform change was claimed.";
  }
  if (error.error_type === "NOT_FOUND") {
    return "The automation endpoint was not found. No platform change was claimed.";
  }
  if (error.error_type === "RATE_LIMITED") {
    return "The automation service is rate-limiting requests. Please wait and try again. No platform change was claimed.";
  }
  return "Automation service temporarily unavailable. Please try again.";
}

export async function readJsonResponse<T>(response: Response, requestId?: string): Promise<JsonSuccess<T> | JsonFailure> {
  const contentType = response.headers.get("content-type") || "";
  const status = response.status;
  const raw = await response.text();
  const preview = sanitizePreview(raw);

  if (!raw.trim()) {
    if (!response.ok) {
      return {
        ok: false,
        error: {
          success: false,
          error: true,
          error_type: errorTypeForStatus(status),
          status_code: status,
          content_type: contentType,
          message: "Automation service returned an empty error body.",
          retryable: isRetryableStatus(status),
          preview,
          request_id: requestId,
        },
      };
    }
    return {
      ok: false,
      error: {
        success: false,
        error: true,
        error_type: "EMPTY_RESPONSE",
        status_code: status,
        content_type: contentType,
        message: "Automation service returned an empty body.",
        retryable: true,
        preview,
        request_id: requestId,
      },
    };
  }

  if (looksLikeHtml(raw, contentType) || (!contentType.includes("json") && !looksLikeJson(raw))) {
    return {
      ok: false,
      error: {
        success: false,
        error: true,
        error_type: "UPSTREAM_RESPONSE_NOT_JSON",
        status_code: status,
        content_type: contentType || "unknown",
        message: "Automation service returned a non-JSON response.",
        retryable: isRetryableStatus(status) || status >= 500,
        preview,
        request_id: requestId,
      },
    };
  }

  try {
    const data = JSON.parse(raw) as T;
    if (!response.ok) {
      return {
        ok: false,
        error: {
          success: false,
          error: true,
          error_type: errorTypeForStatus(status),
          status_code: status,
          content_type: contentType,
          message: "Automation service returned an HTTP error.",
          retryable: isRetryableStatus(status),
          preview,
          request_id: requestId,
        },
      };
    }
    return { ok: true, status, contentType, data };
  } catch {
    return {
      ok: false,
      error: {
        success: false,
        error: true,
        error_type: "MALFORMED_JSON",
        status_code: status,
        content_type: contentType,
        message: "Automation service returned malformed JSON.",
        retryable: false,
        preview,
        request_id: requestId,
      },
    };
  }
}
