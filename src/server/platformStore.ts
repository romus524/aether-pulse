import { INITIAL_PATIENTS, MOCK_EDGE_NODES } from "../data/mockData";
import { PatientRecord } from "../types";
import {
  AgentAuditEntry,
  DashboardConfig,
  DeviceRecord,
  MonitoringConfig,
  NotificationSetting,
  OperatorRole,
  PendingConfirmation,
  PlatformAlert,
  PlatformSettings,
  PlatformSnapshot,
  StaffMember,
} from "../platform/agentProtocol";

export interface PatientExt extends PatientRecord {
  wardId: string;
  wardName: string;
  archived: boolean;
  assignedNurseId: string | null;
}

const WARD_NAMES: Record<string, string> = {
  "ward-2": "Ward 2",
  "ward-3": "Ward 3",
  "ward-4": "Ward 4",
  "ward-4b": "Ward 4B",
};

function clonePatients(): PatientExt[] {
  return structuredClone(INITIAL_PATIENTS).map((patient) => ({
    ...patient,
    wardId: "ward-4b",
    wardName: "Ward 4B",
    archived: false,
    assignedNurseId: "staff-nurse-1",
  }));
}

function alertsFromPatients(patients: PatientExt[]): PlatformAlert[] {
  return patients
    .filter((patient) => patient.status === "warning" || patient.status === "critical")
    .map((patient) => ({
      id: `alert-${patient.id}`,
      patientId: patient.id,
      roomNumber: patient.roomNumber,
      patientName: patient.name,
      severity: patient.status === "critical" ? "critical" : "warning",
      category:
        patient.posture === "fallen"
          ? "fall"
          : patient.posture === "sitting"
            ? "bed-exit"
            : patient.respirationRate > 24
              ? "respiratory"
              : "movement",
      message: patient.postureDescription,
      acknowledged: false,
      suppressed: false,
      createdAt: new Date().toISOString(),
    }));
}

class PlatformStore {
  patients: PatientExt[] = clonePatients();
  settings: PlatformSettings = {
    radarSensitivity: "Ultra High (0.1m/s)",
    fallVelocityThreshold: 2.4,
    impactForceThreshold: 3.8,
    alertEscalationEnabled: true,
    nurseNotificationsEnabled: true,
    twinReplayWindowSec: 30,
    fallRiskMonitoringDefault: true,
  };
  alerts: PlatformAlert[] = alertsFromPatients(this.patients);
  staff: StaffMember[] = [
    { id: "staff-admin-1", name: "Alex Rivera", role: "administrator", wardId: "ward-4b", notifyEnabled: true },
    { id: "staff-doc-1", name: "Dr. Evelyn Reed, MD", role: "doctor", wardId: "ward-4b", notifyEnabled: true },
    { id: "staff-nurse-1", name: "Jordan Hale, RN", role: "nurse", wardId: "ward-4b", notifyEnabled: true },
    { id: "staff-tech-1", name: "Sam Okonkwo", role: "technician", wardId: "ward-4b", notifyEnabled: true },
    { id: "staff-analyst-1", name: "Priya Shah", role: "analyst", wardId: "ward-4b", notifyEnabled: false },
  ];
  monitoring: Record<string, MonitoringConfig> = Object.fromEntries(
    this.patients.map((patient) => [
      patient.id,
      {
        patientId: patient.id,
        csiEnabled: true,
        fallRiskEnabled: patient.fallRiskScore >= 15,
        bedExitEnabled: patient.status !== "normal",
        respiratoryEnabled: true,
      },
    ]),
  );
  notifications: NotificationSetting = {
    nurseNotificationsEnabled: true,
    escalationEnabled: true,
    channels: ["nursing-station", "on-call"],
  };
  dashboard: DashboardConfig = {
    defaultView: "navigator",
    showPointCloud: true,
    showWavefronts: true,
  };
  devices: DeviceRecord[] = MOCK_EDGE_NODES.map((node) => ({
    id: node.id,
    type: node.type,
    location: node.location,
    status: node.status,
  }));
  roles: Record<string, OperatorRole> = {
    "op-admin": "administrator",
    "op-doctor": "doctor",
    "op-nurse": "nurse",
    "op-tech": "technician",
    "op-analyst": "analyst",
  };
  audit: AgentAuditEntry[] = [];
  pending = new Map<string, PendingConfirmation>();
  nextRoom = 106;

  snapshot(): PlatformSnapshot {
    return structuredClone({
      patients: this.patients.filter((patient) => !patient.archived),
      settings: this.settings,
      alerts: this.alerts,
      staff: this.staff,
      monitoring: this.monitoring,
      notifications: this.notifications,
      dashboard: this.dashboard,
      devices: this.devices,
      audit: this.audit.slice(0, 40),
    });
  }

  findPatient(query: string | undefined): PatientExt | undefined {
    if (!query) return undefined;
    const q = query.toLowerCase().trim();
    return this.patients.find((patient) => {
      if (patient.archived) return false;
      return (
        patient.id === q ||
        patient.id === `room-${q}` ||
        patient.roomNumber === q ||
        patient.bedNumber.toLowerCase() === q ||
        patient.name.toLowerCase() === q ||
        patient.name.toLowerCase().includes(q) ||
        patient.mrn.toLowerCase() === q
      );
    });
  }

  resolveWard(raw: string | undefined): { wardId: string; wardName: string } | undefined {
    if (!raw) return undefined;
    const compact = raw.toLowerCase().replace(/\s+/g, "");
    const match = compact.match(/ward[- ]?(\d+[a-z]?)/i) || compact.match(/^(\d+[a-z]?)$/i);
    const key = match ? `ward-${match[1].toLowerCase()}` : compact;
    const alias: Record<string, string> = {
      "ward-4b": "ward-4b",
      "ward-2": "ward-2",
      "ward-3": "ward-3",
      "ward-4": "ward-4",
    };
    const wardId = alias[key];
    if (!wardId) return undefined;
    return { wardId, wardName: WARD_NAMES[wardId] };
  }

  ensureMonitoring(patientId: string): MonitoringConfig {
    if (!this.monitoring[patientId]) {
      this.monitoring[patientId] = {
        patientId,
        csiEnabled: false,
        fallRiskEnabled: false,
        bedExitEnabled: false,
        respiratoryEnabled: false,
      };
    }
    return this.monitoring[patientId];
  }

  upsertAlert(alert: PlatformAlert) {
    const existing = this.alerts.findIndex((item) => item.id === alert.id || (item.patientId === alert.patientId && !item.acknowledged));
    if (existing >= 0) this.alerts[existing] = alert;
    else this.alerts.unshift(alert);
  }

  allocateRoom(): { id: string; roomNumber: string; bedNumber: string } {
    const roomNumber = String(this.nextRoom++);
    return { id: `room-${roomNumber}`, roomNumber, bedNumber: `${roomNumber}-A` };
  }

  recordAudit(entry: AgentAuditEntry) {
    this.audit.unshift(entry);
    this.audit = this.audit.slice(0, 200);
  }
}

export const platformStore = new PlatformStore();
export { WARD_NAMES };
