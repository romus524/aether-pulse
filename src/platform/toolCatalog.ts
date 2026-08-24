import { RiskLevel } from "./agentProtocol";

export interface ToolDef {
  name: string;
  workflow: string;
  risk: RiskLevel;
  description: string;
}

export const TOOL_CATALOG: ToolDef[] = [
  { name: "validatePermissions", workflow: "Audit Logging", risk: "read", description: "Confirm the operator may run the planned tools." },
  { name: "getSystemStatus", workflow: "Reporting", risk: "read", description: "Ward occupancy, alerts, and CSI node health." },
  { name: "searchPatients", workflow: "Patient Management", risk: "read", description: "Search patients by name, MRN, room, or ward." },
  { name: "getPatient", workflow: "Patient Management", risk: "read", description: "Retrieve one permitted patient record." },
  { name: "createPatient", workflow: "Patient Management", risk: "write", description: "Create a patient record with validation." },
  { name: "updatePatient", workflow: "Patient Management", risk: "write", description: "Update non-destructive patient fields." },
  { name: "assignPatientWard", workflow: "Hospital Management", risk: "write", description: "Assign a patient to a ward." },
  { name: "assignPatientBed", workflow: "Bed Management", risk: "write", description: "Assign or change a bed." },
  { name: "transferPatient", workflow: "Patient Management", risk: "sensitive", description: "Transfer a patient between wards." },
  { name: "archivePatient", workflow: "Patient Management", risk: "critical", description: "Archive a patient record." },
  { name: "searchStaff", workflow: "Staff Management", risk: "read", description: "List or search staff." },
  { name: "notifyStaff", workflow: "Notifications", risk: "sensitive", description: "Notify authorized staff." },
  { name: "getAlerts", workflow: "Alert Management", risk: "read", description: "Retrieve active and historical alerts." },
  { name: "acknowledgeAlert", workflow: "Alert Management", risk: "sensitive", description: "Acknowledge an alert when authorized." },
  { name: "escalateAlert", workflow: "Alert Management", risk: "sensitive", description: "Escalate an alert using predefined rules." },
  { name: "suppressAlert", workflow: "Alert Management", risk: "critical", description: "Suppress a critical alert. Requires extra authorization." },
  { name: "enableMonitoring", workflow: "CSI Monitoring", risk: "write", description: "Enable CSI monitoring for a patient or bed." },
  { name: "disableMonitoring", workflow: "CSI Monitoring", risk: "sensitive", description: "Disable CSI monitoring." },
  { name: "updateCsiConfig", workflow: "CSI Monitoring", risk: "sensitive", description: "Change CSI / fall-risk / respiratory monitoring flags." },
  { name: "getRespiratoryStatus", workflow: "CSI Monitoring", risk: "read", description: "Read current respiratory-rate status." },
  { name: "getHighRiskEvents", workflow: "CSI Monitoring", risk: "read", description: "List high-risk movement events for a ward." },
  { name: "updateSettings", workflow: "Settings Management", risk: "sensitive", description: "Change supported system settings." },
  { name: "updateNotificationSettings", workflow: "Notifications", risk: "sensitive", description: "Change notification preferences." },
  { name: "setTwinReplayWindow", workflow: "Digital Twin", risk: "sensitive", description: "Set digital twin replay window seconds." },
  { name: "selectPatientTwin", workflow: "Digital Twin", risk: "write", description: "Focus the inspector and 3D twin on a patient." },
  { name: "focusTwinCamera", workflow: "Digital Twin", risk: "write", description: "Move the 3D camera preset." },
  { name: "twinPlayback", workflow: "Digital Twin", risk: "write", description: "Start, stop, replay, or seek twin playback." },
  { name: "toggleTwinLayer", workflow: "Digital Twin", risk: "write", description: "Toggle supported visualization layers." },
  { name: "generateReport", workflow: "Reporting", risk: "read", description: "Generate a ward or patient summary report." },
  { name: "getAuditLog", workflow: "Audit Logging", risk: "read", description: "Retrieve AI automation audit entries." },
  { name: "updateDashboardConfig", workflow: "Dashboard Configuration", risk: "write", description: "Change default dashboard view and layers." },
  { name: "updateUserPermissions", workflow: "User Permissions", risk: "critical", description: "Change a user's role. Administrator only." },
];

export const TOOL_BY_NAME = Object.fromEntries(TOOL_CATALOG.map((tool) => [tool.name, tool]));
