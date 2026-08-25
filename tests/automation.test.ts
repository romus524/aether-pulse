import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  readJsonResponse,
  userFacingHttpError,
  looksLikeHtml,
} from "../src/lib/httpJson.ts";
import { callN8nWebhook } from "../src/server/n8nClient.ts";

function jsonResponse(body: unknown, status = 200, contentType = "application/json") {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": contentType } });
}

describe("readJsonResponse", () => {
  it("parses successful JSON", async () => {
    const parsed = await readJsonResponse<{ success: boolean }>(jsonResponse({ success: true }));
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.equal(parsed.data.success, true);
  });

  it("rejects HTML as UPSTREAM_RESPONSE_NOT_JSON", async () => {
    const html = new Response("<!DOCTYPE html><html><body>Cannot POST /api/agent/command</body></html>", {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
    const parsed = await readJsonResponse(html);
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error.error_type, "UPSTREAM_RESPONSE_NOT_JSON");
      assert.equal(parsed.error.retryable, false);
      assert.equal(looksLikeHtml("<!DOCTYPE html>", "text/html"), true);
      assert.doesNotMatch(userFacingHttpError(parsed.error), /<!DOCTYPE/);
    }
  });

  it("rejects malformed JSON", async () => {
    const parsed = await readJsonResponse(
      new Response("{not-json", { status: 200, headers: { "content-type": "application/json" } }),
    );
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.error.error_type, "MALFORMED_JSON");
  });

  it("maps HTTP 401 without retry", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "nope" }, 401));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error.error_type, "UNAUTHORIZED");
      assert.equal(parsed.error.retryable, false);
    }
  });

  it("maps HTTP 403 without retry", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "nope" }, 403));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.error.error_type, "FORBIDDEN");
  });

  it("maps HTTP 404 without retry", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "missing" }, 404));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error.error_type, "NOT_FOUND");
      assert.equal(parsed.error.retryable, false);
    }
  });

  it("maps HTTP 429 as retryable", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "slow" }, 429));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) {
      assert.equal(parsed.error.error_type, "RATE_LIMITED");
      assert.equal(parsed.error.retryable, true);
    }
  });

  it("maps HTTP 500 as retryable", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "boom" }, 500));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.error.retryable, true);
  });

  it("maps HTTP 503 as retryable", async () => {
    const parsed = await readJsonResponse(jsonResponse({ error: "down" }, 503));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.error.retryable, true);
  });

  it("rejects empty 200 bodies", async () => {
    const parsed = await readJsonResponse(new Response("", { status: 200, headers: { "content-type": "application/json" } }));
    assert.equal(parsed.ok, false);
    if (!parsed.ok) assert.equal(parsed.error.error_type, "EMPTY_RESPONSE");
  });
});

describe("callN8nWebhook", () => {
  const payload = {
    request_id: "req-1",
    action: "sendMessage",
    user_message: "ping",
    session_id: "s1",
    timestamp: "2026-08-25T00:00:00.000Z",
  };

  it("confirms a chat output JSON body", async () => {
    const result = await callN8nWebhook(payload, {
      maxRetries: 0,
      fetchImpl: async () => jsonResponse({ output: "Pong from n8n" }),
    });
    assert.equal(result.confirmed, true);
    assert.equal(result.conversationalText, "Pong from n8n");
  });

  it("does not treat chat output as executeWorkflow confirmation", async () => {
    const result = await callN8nWebhook(
      { ...payload, action: "executeWorkflow" },
      {
        maxRetries: 0,
        fetchImpl: async () => jsonResponse({ output: "I received your event" }),
      },
    );
    assert.equal(result.confirmed, false);
  });

  it("confirms executeWorkflow only when success is true", async () => {
    const result = await callN8nWebhook(
      { ...payload, action: "executeWorkflow" },
      {
        maxRetries: 0,
        fetchImpl: async () => jsonResponse({ success: true, status: "completed", execution_id: "ex-1" }),
      },
    );
    assert.equal(result.confirmed, true);
    assert.equal(result.executionId, "ex-1");
  });

  it("does not retry HTML 404", async () => {
    let calls = 0;
    const result = await callN8nWebhook(payload, {
      maxRetries: 2,
      fetchImpl: async () => {
        calls += 1;
        return new Response("<!DOCTYPE html>", { status: 404, headers: { "content-type": "text/html" } });
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.confirmed, false);
    assert.equal(result.error?.error_type, "UPSTREAM_RESPONSE_NOT_JSON");
  });

  it("retries HTTP 503 then succeeds", async () => {
    let calls = 0;
    const result = await callN8nWebhook(payload, {
      maxRetries: 2,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 1) return jsonResponse({ error: "down" }, 503);
        return jsonResponse({ output: "recovered" });
      },
    });
    assert.equal(calls, 2);
    assert.equal(result.confirmed, true);
    assert.equal(result.retryCount, 1);
  });

  it("does not retry 401", async () => {
    let calls = 0;
    const result = await callN8nWebhook(payload, {
      maxRetries: 2,
      fetchImpl: async () => {
        calls += 1;
        return jsonResponse({ error: "auth" }, 401);
      },
    });
    assert.equal(calls, 1);
    assert.equal(result.confirmed, false);
  });

  it("treats success:false as a failed execution", async () => {
    const result = await callN8nWebhook(payload, {
      maxRetries: 0,
      fetchImpl: async () => jsonResponse({ success: false, status: "failed", message: "tool failed" }),
    });
    assert.equal(result.confirmed, false);
  });
});
