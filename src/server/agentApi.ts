import type { Express, Request, Response } from "express";
import { AgentCommandRequest, PendingConfirmation } from "../platform/agentProtocol";
import { parseRole } from "../platform/rbac";
import { TOOL_CATALOG } from "../platform/toolCatalog";
import { planUtterance } from "./planner";
import { buildResponse, executeSteps, highestRisk } from "./executor";
import { platformStore } from "./platformStore";

const N8N_WEBHOOK =
  process.env.N8N_WEBHOOK_URL ||
  "https://romusking.app.n8n.cloud/webhook/2edb11ba-0824-48d4-a90c-c82a921444be";

async function notifyN8n(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}

function identity(request: Request, body?: Partial<AgentCommandRequest>) {
  return {
    role: parseRole(body?.role || request.header("x-aetherpulse-role")),
    userId: String(body?.userId || request.header("x-aetherpulse-user") || "op-nurse"),
    userName: String(body?.userName || request.header("x-aetherpulse-name") || "Clinical Operator"),
    sessionId: String(body?.sessionId || "local"),
  };
}

export function registerAgentRoutes(app: Express) {
  app.get("/api/platform/snapshot", (_request, response) => {
    response.json(platformStore.snapshot());
  });

  app.get("/api/agent/tools", (_request, response) => {
    response.json({ tools: TOOL_CATALOG });
  });

  app.get("/api/agent/audit", (_request, response) => {
    response.json({ audit: platformStore.audit });
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
    const body = (request.body || {}) as AgentCommandRequest;
    const { role, userId, userName, sessionId } = identity(request, body);
    const utterance = String(body.utterance || "").trim();

    if (!utterance && !body.confirmationId) {
      response.status(400).json({ error: "utterance is required" });
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
      const n8nNotified = await notifyN8n({
        action: "agentEvent",
        sessionId,
        chatInput: pending.utterance,
        event: { workflow: executed.steps.map((s) => s.workflow), tools: executed.steps.map((s) => s.tool), result: failed ? "failed" : "completed" },
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
      response.json(
        buildResponse({
          status: failed ? "failed" : "completed",
          summary: summary || "Execution finished.",
          steps: executed.steps,
          ui: executed.ui,
          role,
          userId,
          userName,
          utterance: pending.utterance,
          confirmation: "approved",
          n8nNotified,
        }),
      );
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
      });
      return;
    }

    const executed = executeSteps(plan.steps, role);
    const failed = executed.steps.some((step) => step.status === "failed" || step.status === "blocked");
    const n8nNotified = await notifyN8n({
      action: "agentEvent",
      sessionId,
      chatInput: utterance,
      event: {
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

    response.json(
      buildResponse({
        status: failed ? "failed" : "completed",
        summary: summary || "No platform change was required.",
        steps: executed.steps,
        ui: executed.ui,
        role,
        userId,
        userName,
        utterance,
        confirmation: "not_required",
        n8nNotified,
        explanation: plan.explanation,
      }),
    );
  });
}
