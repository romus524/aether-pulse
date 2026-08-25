import { OperatorRole, RiskLevel } from "./agentProtocol";
import { FacilityRoom, PatientRecord } from "../types";

const MATRIX: Record<OperatorRole, RiskLevel[]> = {
  administrator: ["read", "write", "sensitive", "critical"],
  doctor: ["read", "write", "sensitive"],
  nurse: ["read", "write", "sensitive"],
  technician: ["read", "write"],
  analyst: ["read"],
  ai_agent: ["read"],
};

export const ROLE_LABELS: Record<OperatorRole, string> = {
  administrator: "Administrator",
  doctor: "Doctor",
  nurse: "Nurse",
  technician: "Technician",
  analyst: "Analyst",
  ai_agent: "AI Agent",
};

export function canPerform(role: OperatorRole, risk: RiskLevel): boolean {
  return MATRIX[role].includes(risk);
}

export function parseRole(value: unknown): OperatorRole {
  const raw = String(value || "nurse").toLowerCase().replace(/\s+/g, "_");
  if (raw in MATRIX) return raw as OperatorRole;
  return "nurse";
}

export type AppCapability =
  | "viewNavigator"
  | "viewInspector"
  | "viewTelemetry"
  | "viewPhi"
  | "viewHardware"
  | "viewPredictive"
  | "viewFsm"
  | "dispatch"
  | "acknowledge"
  | "intercom"
  | "screenShare"
  | "simulateEvent"
  | "changeRadar"
  | "togglePointCloud"
  | "twinPlayback"
  | "useAiAgent"
  | "viewAuditLog"
  | "overrideAlert";

const ALL: AppCapability[] = [
  "viewNavigator",
  "viewInspector",
  "viewTelemetry",
  "viewPhi",
  "viewHardware",
  "viewPredictive",
  "viewFsm",
  "dispatch",
  "acknowledge",
  "intercom",
  "screenShare",
  "simulateEvent",
  "changeRadar",
  "togglePointCloud",
  "twinPlayback",
  "useAiAgent",
  "viewAuditLog",
  "overrideAlert",
];

export const ROLE_CAPABILITIES: Record<OperatorRole, AppCapability[]> = {
  administrator: ALL,
  doctor: [
    "viewNavigator",
    "viewInspector",
    "viewTelemetry",
    "viewPhi",
    "viewPredictive",
    "viewFsm",
    "dispatch",
    "acknowledge",
    "intercom",
    "screenShare",
    "togglePointCloud",
    "twinPlayback",
    "useAiAgent",
    "overrideAlert",
  ],
  nurse: [
    "viewNavigator",
    "viewInspector",
    "viewTelemetry",
    "viewPhi",
    "viewFsm",
    "dispatch",
    "acknowledge",
    "intercom",
    "screenShare",
    "twinPlayback",
    "useAiAgent",
  ],
  technician: [
    "viewNavigator",
    "viewInspector",
    "viewTelemetry",
    "viewHardware",
    "simulateEvent",
    "changeRadar",
    "togglePointCloud",
    "twinPlayback",
    "useAiAgent",
  ],
  analyst: [
    "viewNavigator",
    "viewInspector",
    "viewTelemetry",
    "viewPredictive",
    "viewFsm",
    "twinPlayback",
    "useAiAgent",
    "viewAuditLog",
  ],
  ai_agent: [
    "viewNavigator",
    "viewInspector",
    "viewTelemetry",
    "twinPlayback",
    "useAiAgent",
    "viewAuditLog",
  ],
};

export const ROLE_SUMMARIES: Record<OperatorRole, string> = {
  administrator: "Full clinical, hardware, and simulation control",
  doctor: "Clinical care, dispatch, and twin review — no hardware simulation",
  nurse: "Bedside response, dispatch, and monitoring — no radar or sim controls",
  technician: "Radar, twin, and incident simulation — no clinical dispatch",
  analyst: "Read-only dashboards and audit — no mutations",
  ai_agent: "Read-only automation operator — no bedside actions",
};

export function hasCapability(role: OperatorRole, capability: AppCapability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function redactPatient(patient: PatientRecord, role: OperatorRole): PatientRecord {
  if (hasCapability(role, "viewPhi")) return patient;
  return {
    ...patient,
    name: `Occupant RM ${patient.roomNumber}`,
    mrn: "REDACTED",
    diagnosis: "Restricted clinical detail",
    physician: "Restricted",
  };
}

export function redactFacilityRoom(room: FacilityRoom, role: OperatorRole): FacilityRoom {
  if (hasCapability(role, "viewPhi")) return room;
  return {
    ...room,
    patient: {
      ...room.patient,
      name: `Occupant RM ${room.roomNumber}`,
      mrn: "REDACTED",
      diagnosis: "Restricted clinical detail",
      physician: "Restricted",
    },
  };
}
