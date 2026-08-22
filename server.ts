import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { INITIAL_PATIENTS } from './src/data/mockData';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distPath, 'index.html');
const settings = {
  radarSensitivity: 'Ultra High (0.1m/s)',
  fallVelocityThreshold: 2.4,
  impactForceThreshold: 3.8,
  alertEscalationEnabled: true,
};

app.use(express.json());
app.use(express.static(distPath));
app.use((_request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/', (_request, response) => {
  if (existsSync(indexHtmlPath)) {
    response.sendFile(indexHtmlPath);
    return;
  }

  response.json({
    name: 'AetherPulse API',
    status: 'ok',
    endpoints: [
      '/api/health',
      '/api/patients',
      '/api/incidents',
      '/api/alerts/escalate',
      '/api/screen-share/sessions',
      '/api/notifications/staff',
      '/api/settings',
    ],
  });
});

app.get('*', (request, response, next) => {
  if (request.path.startsWith('/api')) {
    next();
    return;
  }

  if (existsSync(indexHtmlPath)) {
    response.sendFile(indexHtmlPath);
    return;
  }

  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/patients', (_request, response) => {
  response.json({ patients: INITIAL_PATIENTS });
});

app.get('/api/settings', (_request, response) => {
  response.json({ settings });
});

app.patch('/api/settings', (request, response) => {
  const allowedKeys = Object.keys(settings) as Array<keyof typeof settings>;
  const updates = Object.fromEntries(
    allowedKeys
      .filter((key) => request.body?.[key] !== undefined)
      .map((key) => [key, request.body[key]])
  );

  Object.assign(settings, updates);

  response.json({ updated: true, settings });
});

app.post('/api/alerts/escalate', (request, response) => {
  const { roomId, patientName, severity, message } = request.body ?? {};

  if (!roomId || !patientName || !severity || !message) {
    response.status(400).json({
      error: 'roomId, patientName, severity, and message are required',
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

app.get('/api/screen-share/sessions', (_request, response) => {
  response.status(405).json({
    error: 'method-not-allowed',
    message: 'Use POST /api/screen-share/sessions to create a Daily room.',
  });
});

app.post('/api/screen-share/sessions', (request, response) => {
  const { roomId, patientName, requestedBy } = request.body ?? {};
  const rand = Math.random().toString(36).slice(2, 10);
  const roomName = `aether-${roomId || 'room'}-${Date.now()}-${rand}`;

  return response.status(201).json({
    sessionId: roomName,
    status: 'created',
    roomId: roomId || null,
    patientName: patientName || null,
    requestedBy: requestedBy || null,
    roomName,
    domain: 'meet.jit.si',
    shareUrl: `https://meet.jit.si/${roomName}`,
  });
});

app.post('/api/notifications/staff', (request, response) => {
  const { roomId, patientName, sessionId, message, recipients } = request.body ?? {};

  if (!message) {
    response.status(400).json({ error: 'message is required' });
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

app.post('/api/incidents', (request, response) => {
  const { roomId, patientName, incidentType, severity, description, occurredAt } = request.body ?? {};

  if (!roomId || !patientName || !incidentType || !description) {
    response.status(400).json({
      error: 'roomId, patientName, incidentType, and description are required',
    });
    return;
  }

  const incidentId = `incident-${Date.now()}`;
  const createdAt = new Date().toISOString();

  console.log(`[INCIDENT ${incidentId}] ${incidentType} recorded for Room ${roomId}`);

  response.status(201).json({
    incidentId,
    status: 'recorded',
    roomId,
    patientName,
    incidentType,
    severity: severity || 'unknown',
    description,
    occurredAt: occurredAt || createdAt,
    createdAt,
  });
});

app.listen(port, () => {
  console.log(`AetherPulse API listening at http://localhost:${port}`);
});
