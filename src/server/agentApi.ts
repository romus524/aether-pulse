import type { Express, Request, Response } from "express";
import { AgentCommandRequest, PendingConfirmation } from "../platform/agentProtocol";
import { parseRole } from "../platform/rbac";
import { TOOL_CATALOG } from "../platform/toolCatalog";
import { planUtterance } from "./planner";
import { buildResponse, executeSteps, highestRisk } from "./executor";
import { platformStore } from "./platformStore";
import { callN8nWebhook, n8nWebhookConfigured } from "./n8nClient";
import { userFacingHttpError } from "../lib/httpJson";

function newRequestId(): string {
  return crypto.randomUUID();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function identity(request: Request, body?: Partial<AgentCommandRequest>) {
  return {
    role: parseRole(body?.role || request.header("x-aetherpulse-role")),
    userId: String(body?.userId || request.header("x-aetherpulse-user") || "op-nurse"),
    userName: String(body?.userName || request.header("x-aetherpulse-name") || "Clinical Operator"),
    sessionId: String(body?.sessionId || "local"),
  };
}

function validateCommandBody(body: unknown): { ok: true; data: AgentCommandRequest } | { ok: false; message: string } {
  if (!isPlainObject(body)) return { ok: false, message: "Request body must be a JSON object." };
  if (body.utterance !== undefined && typeof body.utterance !== "string") {
    return { ok: false, message: "utterance must be a string." };
  }
  if (typeof body.utterance === "string" && /<!doctype html/i.test(body.utterance)) {
    return { ok: false, message: "utterance cannot contain HTML documents." };
  }
  if (body.sessionId !== undefined && typeof body.sessionId !== "string") {
    return { ok: false, message: "session_id must be a string." };
  }
  if (body.confirmationId !== undefined && typeof body.confirmationId !== "string") {
    return { ok: false, message: "confirmationId must be a string." };
  }
  if (body.approved !== undefined && typeof body.approved !== "boolean") {
    return { ok: false, message: "approved must be a boolean." };
  }
  return { ok: true, data: body as unknown as AgentCommandRequest };
}

async function orchestrateN8n(args: {
  requestId: string;
  action: string;
  utterance: string;
  sessionId: string;
  metadata: Record<string, unknown>;
}) {
  const started = new Date().toISOString();
  const result = await callN8nWebhook({
    request_id: args.requestId,
    action: args.action,
    user_message: args.utterance,
    session_id: args.sessionId,
    timestamp: started,
    metadata: args.metadata,
  });
  platformStore.recordAutomation({
    request_id: args.requestId,
    session_id: args.sessionId,
    workflow: "AetherPulse Agent Orchestration",
    action: args.action,
    started_at: started,
    completed_at: new Date().toISOString(),
    status: result.confirmed ? "completed" : result.error ? "failed" : "unknown",
    http_status: result.statusCode,
    retry_count: result.retryCount,
    error_type: result.error?.error_type,
    execution_id: result.executionId,
  });
  return result;
}

export function registerAgentRoutes(app: Express) {
  app.get("/api/platform/snapshot", (_request, response) => {
    response.json(platformStore.snapshot());
  });

  app.get("/api/agent/tools", (_request, response) => {
    response.json({ tools: TOOL_CATALOG });
  });

  app.get("/api/agent/audit", (_request, response) => {
    response.json({ audit: platformStore.audit, automation: platformStore.automationLog });
  });

  app.get("/api/agent/diagnostics", (_request, response) => {
    response.json({
      api: "ok",
      n8n_webhook_configured: n8nWebhookConfigured(),
      n8n_uses_production_path: n8nWebhookConfigured(),
    });
  });

  app.get("/api/patients", (_request, response) => {
    response.json({ patients: platformStore.snapshot().patients });
  });

  app.get("/api/settings", (_request, response) => {
    response.json({ settings: platformStore.settings });
  });

  app.patch("/api/settings", (request, response) => {
    Object.assign(platformStore.settings, request.body || {});
    response.json({ updated: true, settings: platformStore.settings });
  });

  app.post("/api/agent/command", async (request: Request, response: Response) => {
    const requestId = String(request.header("x-request-id") || newRequestId());
    response.setHeader("X-Request-Id", requestId);

    const checked = validateCommandBody(request.body);
    if (checked.ok === false) {
      response.status(400).json({
        success: false,
        error: true,
        error_type: "BAD_REQUEST",
        status: "failed",
        summary: checked.message,
        message: checked.message,
        request_id: requestId,
        steps: [],
        uiCommands: [],
        phase: "failed",
      });
      return;
    }

    const body = checked.data;
    const { role, userId, userName, sessionId } = identity(request, body);
    const utterance = String(body.utterance || "").trim();

    if (!utterance && !body.confirmationId) {
      response.status(400).json({
        success: false,
        error: true,
        error_type: "BAD_REQUEST",
        status: "failed",
        summary: "utterance is required",
        message: "utterance is required",
        request_id: requestId,
        steps: [],
        uiCommands: [],
        phase: "failed",
      });
      return;
    }

    if (body.confirmationId) {
      const pending = platformStore.pending.get(body.confirmationId);
      if (!pending || pending.expiresAt < Date.now()) {
        response.status(410).json(
          buildResponse({
            status: "failed",
            summary: "The confirmation expired. Re-issue the request.",
            steps: [],
            ui: [],
            role,
            userId,
            userName,
            utterance: pending?.utterance || utterance,
            confirmation: "rejected",
            n8nNotified: false,
          }),
        );
        return;
      }
      if (body.approved !== true) {
        platformStore.pending.delete(body.confirmationId);
        response.json(
          buildResponse({
            status: "denied",
            summary: "The operator declined the proposed change. No records were modified.",
            steps: pending.steps.map((step) => ({ ...step, status: "skipped" })),
            ui: [],
            role,
            userId,
            userName,
            utterance: pending.utterance,
            confirmation: "rejected",
            n8nNotified: false,
          }),
        );
        return;
      }
      platformStore.pending.delete(body.confirmationId);
      const executed = executeSteps(pending.steps, role);
      const failed = executed.steps.some((step) => step.status === "failed" || step.status === "blocked");
      const n8n = failed
        ? { attempted: false, confirmed: false, retryCount: 0, durationMs: 0 }
        : await orchestrateN8n({
            requestId,
            action: "executeWorkflow",
            utterance: pending.utterance,
            sessionId,
            metadata: {
              tools: executed.steps.map((s) => s.tool),
              workflows: executed.steps.map((s) => s.workflow),
              result: "completed",
            },
          });
      const summary = failed
        ? executed.steps
            .filter((s) => s.status !== "done")
            .map((s) => s.result)
            .join(" ")
        : executed.steps
            .filter((s) => s.tool !== "validatePermissions")
            .map((s) => s.verification || s.result)
            .join(" ");
      const n8nNote = failed
        ? ""
        : n8n.confirmed
          ? " Orchestration webhook confirmed the event."
          : " Local execution was verified; the orchestration webhook did not confirm a separate workflow result.";
      response.json({
        ...buildResponse({
          status: failed ? "failed" : "completed",
          summary: `${summary || "Execution finished."}${n8nNote}`,
          steps: executed.steps,
          ui: executed.ui,
          role,
          userId,
          userName,
          utterance: pending.utterance,
          confirmation: "approved",
          n8nNotified: n8n.confirmed,
        }),
        request_id: requestId,
        automation: {
          automation_requested: !failed,
          automation_name: "executeWorkflow",
          execution_started: n8n.attempted,
          execution_success: n8n.confirmed,
          result: n8n.confirmed ? { execution_id: n8n.executionId } : null,
          error: n8n.error || null,
        },
      });
      return;
    }

    const plan = planUtterance(utterance, role, body.selectedRoomId);
    if (plan.missing.length) {
      response.json(
        buildResponse({
          status: "needs_input",
          summary: `I need more information before executing: ${plan.missing.join(", ")}.`,
          steps: plan.steps,
          ui: [],
          role,
          userId,
          userName,
          utterance,
          confirmation: "not_required",
          n8nNotified: false,
          questions: plan.missing.map((item) => `Please provide ${item}.`),
          explanation: plan.explanation,
        }),
      );
      return;
    }

    if (plan.conversational) {
      const n8n = await orchestrateN8n({
        requestId,
        action: "sendMessage",
        utterance,
        sessionId,
        metadata: { intent: "information", role, userId },
      });
      if (n8n.confirmed && n8n.conversationalText) {
        const steps = plan.steps.map((step) =>
          step.tool === "validatePermissions"
            ? { ...step, status: "done" as const, result: `Permissions validated for ${role}.`, verified: true }
            : step,
        );
        response.json({
          ...buildResponse({
            status: "completed",
            summary: n8n.conversationalText,
            steps,
            ui: [],
            role,
            userId,
            userName,
            utterance,
            confirmation: "not_required",
            n8nNotified: true,
            explanation: plan.explanation,
          }),
          request_id: requestId,
          automation: {
            automation_requested: true,
            automation_name: "sendMessage",
            execution_started: true,
            execution_success: true,
            result: { execution_id: n8n.executionId },
            error: null,
          },
        });
        return;
      }
      const message = n8n.error
        ? userFacingHttpError(n8n.error)
        : "The automation assistant replied, but the result was ambiguous. I will not claim the request completed.";
      response.json({
        ...buildResponse({
          status: "failed",
          summary: message,
          steps: plan.steps.map((step) => ({ ...step, status: "failed", result: message })),
          ui: [],
          role,
          userId,
          userName,
          utterance,
          confirmation: "not_required",
          n8nNotified: false,
          explanation: plan.explanation,
        }),
        request_id: requestId,
        automation: {
          automation_requested: true,
          automation_name: "sendMessage",
          execution_started: n8n.attempted,
          execution_success: false,
          result: null,
          error: n8n.error || { type: "AUTOMATION_UNAVAILABLE", message, retryable: true },
        },
      });
      return;
    }

    const risk = highestRisk(plan.steps);
    if (risk === "sensitive" || risk === "critical") {
      const confirmationId = `cfm-${Date.now().toString(36)}`;
      const pending: PendingConfirmation = {
        confirmationId,
        utterance,
        explanation: plan.explanation,
        steps: plan.steps,
        role,
        userId,
        userName,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
      platformStore.pending.set(confirmationId, pending);
      response.json({
        ...buildResponse({
          status: "awaiting_confirmation",
          summary: plan.explanation,
          steps: plan.steps,
          ui: [],
          role,
          userId,
          userName,
          utterance,
          confirmation: "pending",
          n8nNotified: false,
          explanation: `${plan.explanation} This is a ${risk} change and will not run until you confirm.`,
          confirmationId,
        }),
        confirmationId,
        request_id: requestId,
      });
      return;
    }

    const executed = executeSteps(plan.steps, role);
    const failed = executed.steps.some((step) => step.status === "failed" || step.status === "blocked");
    const n8n = failed
      ? { attempted: false, confirmed: false, retryCount: 0, durationMs: 0 }
      : await orchestrateN8n({
          requestId,
          action: "executeWorkflow",
          utterance,
          sessionId,
          metadata: {
            type: "platform-automation",
            tools: executed.steps.map((s) => s.tool),
            workflows: executed.steps.map((s) => s.workflow),
          },
        });
    const summary = failed
      ? `The request could not be completed. ${executed.steps.filter((s) => s.status !== "done").map((s) => s.result).join(" ")}`
      : executed.steps
          .filter((s) => s.tool !== "validatePermissions")
          .map((s) => s.verification || s.result)
          .filter(Boolean)
          .join(" ");
    const n8nNote = failed
      ? ""
      : n8n.confirmed
        ? ""
        : "error" in n8n && n8n.error
          ? ` ${userFacingHttpError(n8n.error)} Local platform verification still stands for completed tools.`
          : "";

    response.json({
      ...buildResponse({
        status: failed ? "failed" : "completed",
        summary: `${summary || "No platform change was required."}${n8nNote}`,
        steps: executed.steps,
        ui: executed.ui,
        role,
        userId,
        userName,
        utterance,
        confirmation: "not_required",
        n8nNotified: n8n.confirmed,
        explanation: plan.explanation,
      }),
      request_id: requestId,
      automation: {
        automation_requested: !failed,
        automation_name: "executeWorkflow",
        execution_started: Boolean(n8n.attempted),
        execution_success: Boolean(n8n.confirmed),
        result: n8n.confirmed ? { execution_id: n8n.executionId } : null,
        error: "error" in n8n ? n8n.error || null : null,
      },
    });
  });
}
