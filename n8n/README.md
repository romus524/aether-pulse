# AetherPulse n8n modules

AetherPulse runs platform tools on its own API (`POST /api/agent/command`). n8n is the orchestration bus.

## Production webhook

Set **server-side** `N8N_WEBHOOK_URL` to the **production** webhook (`/webhook/...`), never:

- the n8n editor URL
- `/webhook-test/...` (only lives for one canvas execution)

The frontend never calls n8n. Secrets stay in the API process.

## Import

Import `aetherpulse-agent-orchestration.json`, activate the workflow, then copy the production webhook URL into `N8N_WEBHOOK_URL`.

The workflow must **Respond to Webhook** with JSON:

```json
{
  "success": true,
  "status": "completed",
  "action": "sendMessage",
  "message": "Human-readable confirmation",
  "data": {},
  "execution_id": "..."
}
```

Never return an HTML error page to the app.

## Request body

```json
{
  "request_id": "unique-request-id",
  "action": "sendMessage",
  "user_message": "user request",
  "session_id": "session identifier",
  "timestamp": "ISO timestamp",
  "metadata": {}
}
```

Use `request_id` to skip duplicate execution.

Do **not** put database credentials in n8n. Point HTTP nodes at AetherPulse:

- `POST /api/agent/command`
- `GET /api/platform/snapshot`
- `GET /api/agent/audit`
- `GET /api/agent/tools`
