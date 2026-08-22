import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { INITIAL_PATIENTS } from './src/data/mockData';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8787);
const DAILY_API_KEY = process.env.DAILY_API_KEY;
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

const getDailyBaseUrl = () => process.env.DAILY_BASE_URL || 'https://api.daily.co';

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

app.post('/api/screen-share/sessions', async (request, response) => {
  const { roomId, patientName, requestedBy } = request.body ?? {};

  if (!DAILY_API_KEY) {
    response.status(501).json({
      error: 'Daily.co not configured',
      message: 'Set DAILY_API_KEY in the Render environment variables to enable real screen sharing.',
    });
    return;
  }

  const roomName = `aether-${String(roomId || 'room').replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`;

  try {
    const dailyResponse = await fetch(`${getDailyBaseUrl()}/v1/rooms`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!dailyResponse.ok) {
      const text = await dailyResponse.text();
      response.status(502).json({
        error: 'daily-api-error',
        detail: text,
      });
      return;
    }

    const room = (await dailyResponse.json()) as {
      name?: string;
      url?: string;
      id?: string;
    };

    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const shareUrl = room.url || `https://${room.name || roomName}.daily.co`;

    response.status(201).json({
      sessionId: room.id || room.name || roomName,
      roomId: roomId || null,
      patientName: patientName || null,
      requestedBy: requestedBy || null,
      status: 'created',
      shareUrl,
      createdAt,
      expiresAt,
    });
  } catch (error) {
    response.status(500).json({
      error: 'screen-share-creation-failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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
