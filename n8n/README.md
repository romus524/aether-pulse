# AetherPulse n8n modules

AetherPulse executes platform tools on its own API (`POST /api/agent/command`). n8n is the optional orchestration/notification bus.

Do **not** put database credentials in n8n. Point HTTP nodes at:

- `POST /api/agent/command`
- `GET /api/platform/snapshot`
- `GET /api/agent/audit`
- `GET /api/agent/tools`

Modular workflows in this template:

1. Patient Management
2. CSI Monitoring
3. Alert Management
4. Settings Management
5. Digital Twin
6. Notifications
7. Reporting
8. Audit Logging
