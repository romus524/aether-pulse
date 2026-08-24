export type OperatorRole =
  | "administrator"
  | "doctor"
  | "nurse"
  | "technician"
  | "analyst"
  | "ai_agent";

export type RiskLevel = "read" | "write" | "sensitive" | "critical";

export type AgentPhase =
  | "idle"
  | "thinking"
  | "planning"
  | "waiting_approval"
  | "executing"
  | "verifying"
  | "completed"
  | "failed";

export type StepStatus = "pending" | "running" | "done" | "failed" | "blocked" | "skipped";

export interface AgentStep {
  id: string;
  tool: string;
  workflow: string;
  label: string;
  risk: RiskLevel;
  params: Record<string, unknown>;
  status: StepStatus;
  result?: string;
  verified?: boolean;
  verification?: string;
  recordsAffected?: string[];
}

export interface UiCommand {
  view?: "navigator" | "inspector";
  selectRoomId?: string;
  cameraPreset?: "iso" | "front" | "side" | "top" | "bed" | "full";
  showPointCloud?: boolean;
  showWavefronts?: boolean;
  showTrajectory?: boolean;
  playback?: "live" | "play" | "pause" | "replay";
  playbackSpeed?: number;
  seekEvent?: string;
  openEmergency?: boolean;
  radarSensitivity?: string;
}

export interface AgentAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: OperatorRole;
  agent: "AetherPulse AI";
  utterance: string;
  tools: string[];
  parameters: Record<string, unknown>[];
  result: string;
  success: boolean;
  confirmation: "not_required" | "pending" | "approved" | "rejected";
  recordsAffected: string[];
  n8nNotified: boolean;
}

export interface PendingConfirmation {
  confirmationId: string;
  utterance: string;
  explanation: string;
  steps: AgentStep[];
  role: OperatorRole;
  userId: string;
  userName: string;
  expiresAt: number;
}

export interface AgentCommandRequest {
  utterance: string;
  role: OperatorRole;
  userId: string;
  userName: string;
  sessionId: string;
  confirmationId?: string;
  approved?: boolean;
  selectedRoomId?: string;
}

export interface AgentCommandResponse {
  status: "completed" | "awaiting_confirmation" | "needs_input" | "denied" | "failed";
  phase: AgentPhase;
  summary: string;
  explanation?: string;
  questions?: string[];
  confirmationId?: string;
  auditId?: string;
  steps: AgentStep[];
  uiCommands: UiCommand[];
  snapshot?: PlatformSnapshot;
  advisoryNote?: string;
}

export interface PlatformSnapshot {
  patients: import("../types").PatientRecord[];
  settings: PlatformSettings;
  alerts: PlatformAlert[];
  staff: StaffMember[];
  monitoring: Record<string, MonitoringConfig>;
  notifications: NotificationSetting;
  dashboard: DashboardConfig;
  devices: DeviceRecord[];
  audit: AgentAuditEntry[];
}

export interface PlatformSettings {
  radarSensitivity: string;
  fallVelocityThreshold: number;
  impactForceThreshold: number;
  alertEscalationEnabled: boolean;
  nurseNotificationsEnabled: boolean;
  twinReplayWindowSec: number;
  fallRiskMonitoringDefault: boolean;
}

export interface MonitoringConfig {
  patientId: string;
  csiEnabled: boolean;
  fallRiskEnabled: boolean;
  bedExitEnabled: boolean;
  respiratoryEnabled: boolean;
}

export interface PlatformAlert {
  id: string;
  patientId: string;
  roomNumber: string;
  patientName: string;
  severity: "normal" | "warning" | "critical";
  category: "fall" | "bed-exit" | "respiratory" | "movement" | "system";
  message: string;
  acknowledged: boolean;
  suppressed: boolean;
  createdAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: OperatorRole;
  wardId: string;
  notifyEnabled: boolean;
}

export interface DeviceRecord {
  id: string;
  type: string;
  location: string;
  status: "online" | "degraded" | "offline";
}

export interface NotificationSetting {
  nurseNotificationsEnabled: boolean;
  escalationEnabled: boolean;
  channels: string[];
}

export interface DashboardConfig {
  defaultView: "navigator" | "inspector";
  showPointCloud: boolean;
  showWavefronts: boolean;
}
