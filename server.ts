import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { registerAgentRoutes } from "./src/server/agentApi";

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "dist");
const indexHtmlPath = path.join(distPath, "index.html");

app.use(express.json({ limit: "1mb" }));
app.use((_request, response, next) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  response.header(
    "Access-Control-Allow-Headers",
    "Content-Type, X-AetherPulse-Role, X-AetherPulse-User, X-AetherPulse-Name, X-Request-Id",
  );
  if (_request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

registerAgentRoutes(app);

app.post("/api/alerts/escalate", (request, response) => {
  const { roomId, patientName, severity, message } = request.body ?? {};

  if (!roomId || !patientName || !severity || !message) {
    response.status(400).json({
      success: false,
      error: true,
      error_type: "BAD_REQUEST",
      message: "roomId, patientName, severity, and message are required",
    });
    return;
  }

  const alertId = `alert-${Date.now()}`;
  const receivedAt = new Date().toISOString();
  console.log(`[ALERT ${alertId}] ${severity.toUpperCase()} escalation for Room ${roomId}: ${message}`);

  response.status(202).json({
    accepted: true,
    alertId,
    receivedAt,
    roomId,
    patientName,
    severity,
    message,
  });
});

app.get("/api/screen-share/sessions", (_request, response) => {
  response.status(405).json({
    error: "method-not-allowed",
    message: "Use POST /api/screen-share/sessions to create a Daily room.",
  });
});

app.post("/api/screen-share/sessions", (request, response) => {
  const { roomId, patientName, requestedBy } = request.body ?? {};
  const rand = Math.random().toString(36).slice(2, 10);
  const roomName = `aether-${roomId || "room"}-${Date.now()}-${rand}`;

  return response.status(201).json({
    sessionId: roomName,
    status: "created",
    roomId: roomId || null,
    patientName: patientName || null,
    requestedBy: requestedBy || null,
    roomName,
    domain: "meet.jit.si",
    shareUrl: `https://meet.jit.si/${roomName}`,
  });
});

app.post("/api/notifications/staff", (request, response) => {
  const { roomId, patientName, sessionId, message, recipients } = request.body ?? {};

  if (!message) {
    response.status(400).json({ success: false, error: true, error_type: "BAD_REQUEST", message: "message is required" });
    return;
  }

  const notificationId = `notification-${Date.now()}`;
  const sentAt = new Date().toISOString();
  console.log(`[NOTIFICATION ${notificationId}] Staff notification: ${message}`);

  response.status(202).json({
    accepted: true,
    notificationId,
    sentAt,
    roomId: roomId || null,
    patientName: patientName || null,
    sessionId: sessionId || null,
    recipients: recipients || [],
    message,
  });
});

app.post("/api/incidents", (request, response) => {
  const { roomId, patientName, incidentType, severity, description, occurredAt } = request.body ?? {};

  if (!roomId || !patientName || !incidentType || !description) {
    response.status(400).json({
      success: false,
      error: true,
      error_type: "BAD_REQUEST",
      message: "roomId, patientName, incidentType, and description are required",
    });
    return;
  }

  const incidentId = `incident-${Date.now()}`;
  const createdAt = new Date().toISOString();
  console.log(`[INCIDENT ${incidentId}] ${incidentType} recorded for Room ${roomId}`);

  response.status(201).json({
    incidentId,
    status: "recorded",
    roomId,
    patientName,
    incidentType,
    severity: severity || "unknown",
    description,
    occurredAt: occurredAt || createdAt,
    createdAt,
  });
});

app.use("/api", (request, response) => {
  response.status(404).json({
    success: false,
    error: true,
    error_type: "NOT_FOUND",
    status_code: 404,
    content_type: "application/json",
    message: `No API route ${request.method} ${request.path}.`,
    retryable: false,
  });
});

app.use(express.static(distPath));

app.get("/", (_request, response) => {
  if (existsSync(indexHtmlPath)) {
    response.sendFile(indexHtmlPath);
    return;
  }

  response.json({
    name: "AetherPulse API",
    status: "ok",
    endpoints: [
      "/api/health",
      "/api/agent/command",
      "/api/agent/audit",
      "/api/agent/tools",
      "/api/platform/snapshot",
      "/api/alerts/escalate",
      "/api/screen-share/sessions",
      "/api/notifications/staff",
      "/api/settings",
    ],
  });
});

app.get("*", (request, response) => {
  if (existsSync(indexHtmlPath)) {
    response.sendFile(indexHtmlPath);
    return;
  }
  response.status(404).json({ error: "not found", path: request.path });
});

app.listen(port, () => {
  console.log(`AetherPulse API listening at http://localhost:${port}`);
});
