import express from 'express';
import { INITIAL_PATIENTS } from './src/data/mockData';

const app = express();
const port = Number(process.env.PORT || process.env.API_PORT || 8787);

app.use(express.json());
app.use((_request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.get('/api/patients', (_request, response) => {
  response.json({ patients: INITIAL_PATIENTS });
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

app.post('/api/screen-share/sessions', (request, response) => {
  const { roomId, patientName } = request.body ?? {};
  const sessionId = `screen-${Date.now()}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000);

  response.status(201).json({
    sessionId,
    status: 'created',
    roomId: roomId || null,
    patientName: patientName || null,
    shareUrl: `http://localhost:8787/screen-share/${sessionId}`,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
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
