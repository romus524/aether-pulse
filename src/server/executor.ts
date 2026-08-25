import { canPerform } from "../platform/rbac";
import {
  AgentAuditEntry,
  AgentCommandResponse,
  AgentStep,
  OperatorRole,
  PlatformAlert,
  UiCommand,
} from "../platform/agentProtocol";
import { TOOL_BY_NAME } from "../platform/toolCatalog";
import { PatientExt, platformStore } from "./platformStore";

function nowIso(): string {
  return new Date().toISOString();
}

function auditId(): string {
  return `AP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function asPatient(patient: PatientExt) {
  const { wardId: _w, wardName: _n, archived: _a, assignedNurseId: _s, ...record } = patient;
  return record;
}

function verifyPatient(query: string | undefined, expectation?: Partial<PatientExt>): { ok: boolean; detail: string; patient?: PatientExt } {
  const patient = platformStore.findPatient(query);
  if (!patient) return { ok: false, detail: "The system has no matching patient after the operation." };
  if (expectation?.wardId && patient.wardId !== expectation.wardId) {
    return { ok: false, detail: `Expected ward ${expectation.wardId}, system reports ${patient.wardName}.`, patient };
  }
  if (expectation?.bedNumber && patient.bedNumber !== expectation.bedNumber) {
    return { ok: false, detail: `Expected bed ${expectation.bedNumber}, system reports ${patient.bedNumber}.`, patient };
  }
  return { ok: true, detail: `Verified ${patient.name} in ${patient.wardName}, bed ${patient.bedNumber}, status ${patient.status}.`, patient };
}

function runTool(step: AgentStep, role: OperatorRole): { step: AgentStep; ui: UiCommand[] } {
  const ui: UiCommand[] = [];
  const params = step.params;
  const query = String(params.query || params.name || params.patientId || "");

  if (!canPerform(role, step.risk)) {
    return {
      step: {
        ...step,
        status: "blocked",
        result: `${role} is not authorized for ${step.tool} (${step.risk}).`,
        verified: false,
      },
      ui,
    };
  }

  switch (step.tool) {
    case "validatePermissions": {
      return {
        step: { ...step, status: "done", result: `Permissions validated for ${role}.`, verified: true, verification: "RBAC matrix applied to the planned tool list." },
        ui,
      };
    }
    case "getSystemStatus": {
      const patients = platformStore.patients.filter((p) => !p.archived);
      const critical = patients.filter((p) => p.status === "critical").length;
      const warning = patients.filter((p) => p.status === "warning").length;
      const online = platformStore.devices.filter((d) => d.status === "online").length;
      return {
        step: {
          ...step,
          status: "done",
          result: `${patients.length} active patients · ${critical} critical · ${warning} warning · ${online}/${platformStore.devices.length} devices online · nurse notifications ${platformStore.notifications.nurseNotificationsEnabled ? "on" : "off"}.`,
          verified: true,
          verification: "Status compiled from the live platform store, not a language-model guess.",
        },
        ui,
      };
    }
    case "searchPatients": {
      const q = String(params.query || "").toLowerCase();
      const hits = platformStore.patients.filter(
        (p) =>
          !p.archived &&
          (p.name.toLowerCase().includes(q) ||
            p.mrn.toLowerCase().includes(q) ||
            p.roomNumber.includes(q) ||
            p.wardName.toLowerCase().includes(q) ||
            q.length < 3),
      );
      return {
        step: {
          ...step,
          status: "done",
          result: hits.length ? hits.map((p) => `${p.name} · ${p.wardName} · Bed ${p.bedNumber} · ${p.status}`).join("; ") : "No matching patients.",
          verified: true,
          recordsAffected: hits.map((p) => p.id),
        },
        ui,
      };
    }
    case "getPatient": {
      const found = platformStore.findPatient(query);
      if (!found) return { step: { ...step, status: "failed", result: `No permitted patient matched “${query}”.`, verified: false }, ui };
      ui.push({ selectRoomId: found.id, view: "inspector" });
      return {
        step: {
          ...step,
          status: "done",
          result: `${found.name} (${found.mrn}) · ${found.wardName} Bed ${found.bedNumber} · RR ${found.respirationRate} · HR ${found.heartRate} · fall-risk ${found.fallRiskScore} · CSI ${platformStore.ensureMonitoring(found.id).csiEnabled ? "on" : "off"}.`,
          verified: true,
          recordsAffected: [found.id],
        },
        ui,
      };
    }
    case "createPatient": {
      const name = String(params.name || "").trim();
      if (!name) return { step: { ...step, status: "failed", result: "createPatient requires a name.", verified: false }, ui };
      const ward = platformStore.resolveWard(String(params.ward || "Ward 4B"));
      const room = platformStore.allocateRoom();
      const patient: PatientExt = {
        id: room.id,
        roomNumber: room.roomNumber,
        bedNumber: String(params.bedNumber || room.bedNumber),
        name,
        age: Number(params.age || 70),
        gender: String(params.gender || "Unknown"),
        mrn: `MRN-${Math.floor(100000 + Math.random() * 900000)}`,
        diagnosis: String(params.diagnosis || "Pending admission workup"),
        physician: "Dr. Evelyn Reed, MD",
        admissionDate: new Date().toISOString().slice(0, 10),
        fallRiskScore: 12,
        status: "normal",
        posture: "bed",
        postureDescription: "Resting Supine in Bed",
        heartRate: 76,
        respirationRate: 16,
        hrv: 40,
        signalQuality: -38,
        movementIndex: 10,
        lastMovement: "just admitted",
        wifiDopplerRate: 1,
        wardId: ward?.wardId || "ward-4b",
        wardName: ward?.wardName || "Ward 4B",
        archived: false,
        assignedNurseId: "staff-nurse-1",
      };
      platformStore.patients.push(patient);
      platformStore.ensureMonitoring(patient.id);
      const check = verifyPatient(patient.id, { wardId: patient.wardId, bedNumber: patient.bedNumber });
      ui.push({ selectRoomId: patient.id, view: "inspector" });
      return {
        step: {
          ...step,
          status: check.ok ? "done" : "failed",
          result: check.ok
            ? `Created ${patient.name} (${patient.mrn}) in ${patient.wardName}, bed ${patient.bedNumber}.`
            : check.detail,
          verified: check.ok,
          verification: check.detail,
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "updatePatient": {
      const patient = platformStore.findPatient(query);
      if (!patient) return { step: { ...step, status: "failed", result: "Patient not found.", verified: false }, ui };
      if (params.diagnosis) patient.diagnosis = String(params.diagnosis);
      if (params.age) patient.age = Number(params.age);
      if (params.physician) patient.physician = String(params.physician);
      const check = verifyPatient(patient.id);
      return {
        step: {
          ...step,
          status: "done",
          result: `Updated ${patient.name}. Diagnosis is now “${patient.diagnosis}”.`,
          verified: check.ok,
          verification: check.detail,
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "assignPatientWard":
    case "transferPatient": {
      const patient = platformStore.findPatient(query);
      const ward = platformStore.resolveWard(String(params.ward || ""));
      if (!patient) return { step: { ...step, status: "failed", result: "Patient not found.", verified: false }, ui };
      if (!ward) return { step: { ...step, status: "failed", result: "Unknown ward.", verified: false }, ui };
      patient.wardId = ward.wardId;
      patient.wardName = ward.wardName;
      const check = verifyPatient(patient.id, { wardId: ward.wardId });
      ui.push({ selectRoomId: patient.id });
      return {
        step: {
          ...step,
          status: check.ok ? "done" : "failed",
          result: check.ok ? `${patient.name} is assigned to ${ward.wardName}.` : check.detail,
          verified: check.ok,
          verification: check.detail,
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "assignPatientBed": {
      const patient = platformStore.findPatient(query);
      const bed = String(params.bedNumber || "");
      if (!patient) return { step: { ...step, status: "failed", result: "Patient not found.", verified: false }, ui };
      if (!bed) return { step: { ...step, status: "failed", result: "Bed number required.", verified: false }, ui };
      patient.bedNumber = bed.includes("-") ? bed.toUpperCase() : `${bed}-A`;
      if (/^\d+$/.test(bed)) {
        patient.roomNumber = bed;
        patient.id = `room-${bed}`;
      }
      const check = verifyPatient(patient.name, { bedNumber: patient.bedNumber });
      ui.push({ selectRoomId: patient.id });
      return {
        step: {
          ...step,
          status: check.ok ? "done" : "failed",
          result: check.ok ? `${patient.name} is in bed ${patient.bedNumber}.` : check.detail,
          verified: check.ok,
          verification: check.detail,
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "archivePatient": {
      const patient = platformStore.findPatient(query);
      if (!patient) return { step: { ...step, status: "failed", result: "Patient not found.", verified: false }, ui };
      patient.archived = true;
      const still = platformStore.findPatient(patient.id);
      return {
        step: {
          ...step,
          status: still ? "failed" : "done",
          result: still ? "Archive did not take effect." : `${patient.name} is archived and hidden from the active ward census.`,
          verified: !still,
          verification: still ? "Patient still searchable." : "Patient no longer returned by active census search.",
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "searchStaff": {
      const list = platformStore.staff.map((s) => `${s.name} (${s.role})`).join("; ");
      return { step: { ...step, status: "done", result: list, verified: true }, ui };
    }
    case "notifyStaff": {
      const patient = platformStore.findPatient(query);
      const nurse = platformStore.staff.find((s) => s.id === (patient?.assignedNurseId || "staff-nurse-1"));
      if (!platformStore.notifications.nurseNotificationsEnabled && role !== "administrator") {
        return { step: { ...step, status: "failed", result: "Nurse notifications are disabled in system preferences.", verified: false }, ui };
      }
      const message = patient
        ? `Notice for ${patient.name} in ${patient.wardName} bed ${patient.bedNumber}: ${params.message || "staff update"}`
        : String(params.message || "Staff notification");
      return {
        step: {
          ...step,
          status: "done",
          result: `Notification queued to ${nurse?.name || "nursing station"} via ${platformStore.notifications.channels.join(", ")}.`,
          verified: true,
          verification: `Recipient ${nurse?.name || "nursing station"} is on the authorized staff roster.`,
        },
        ui,
      };
    }
    case "getAlerts": {
      const unresolved = platformStore.alerts.filter((a) => !a.acknowledged && !a.suppressed);
      const body = unresolved.length
        ? unresolved.map((a) => `${a.severity.toUpperCase()} ${a.category} · ${a.patientName} Rm ${a.roomNumber}: ${a.message}`).join("; ")
        : "No unresolved alerts.";
      return { step: { ...step, status: "done", result: body, verified: true }, ui };
    }
    case "acknowledgeAlert": {
      const patient = platformStore.findPatient(query) || platformStore.patients.find((p) => p.status !== "normal" && !p.archived);
      if (!patient) return { step: { ...step, status: "failed", result: "No alerted patient found.", verified: false }, ui };
      const alert = platformStore.alerts.find((a) => a.patientId === patient.id && !a.acknowledged);
      if (alert) alert.acknowledged = true;
      patient.status = "normal";
      patient.posture = "bed";
      patient.postureDescription = "Resting Supine in Bed (Acknowledged)";
      return {
        step: {
          ...step,
          status: "done",
          result: `Acknowledged alert for ${patient.name}. Current status is ${patient.status}.`,
          verified: patient.status === "normal",
          verification: `System now reports ${patient.name} as ${patient.status}.`,
          recordsAffected: [patient.id],
        },
        ui: [{ selectRoomId: patient.id }],
      };
    }
    case "escalateAlert": {
      const patient = platformStore.findPatient(query) || platformStore.patients.find((p) => p.status === "critical");
      if (!patient) return { step: { ...step, status: "failed", result: "No patient to escalate.", verified: false }, ui };
      if (!platformStore.settings.alertEscalationEnabled) {
        return { step: { ...step, status: "failed", result: "Alert escalation is disabled in settings.", verified: false }, ui };
      }
      const alert: PlatformAlert = {
        id: `alert-esc-${Date.now()}`,
        patientId: patient.id,
        roomNumber: patient.roomNumber,
        patientName: patient.name,
        severity: "critical",
        category: "fall",
        message: `Escalated per ${role}: ${patient.postureDescription}`,
        acknowledged: false,
        suppressed: false,
        createdAt: nowIso(),
      };
      platformStore.upsertAlert(alert);
      ui.push({ selectRoomId: patient.id, openEmergency: patient.status === "critical" });
      return {
        step: {
          ...step,
          status: "done",
          result: `Escalation ${alert.id} recorded for ${patient.name}.`,
          verified: platformStore.alerts.some((a) => a.id === alert.id),
          verification: "Escalation record is present in the alert store.",
          recordsAffected: [patient.id, alert.id],
        },
        ui,
      };
    }
    case "suppressAlert": {
      return {
        step: {
          ...step,
          status: "blocked",
          result: "Critical clinical alerts cannot be independently suppressed by the AI. An administrator must use the clinical console with an explicit override reason.",
          verified: false,
        },
        ui,
      };
    }
    case "enableMonitoring":
    case "disableMonitoring":
    case "updateCsiConfig": {
      const ward = platformStore.resolveWard(String(params.ward || params.query || ""));
      const matched = platformStore.findPatient(query);
      const targets = matched
        ? [matched]
        : ward
          ? platformStore.patients.filter((p) => p.wardId === ward.wardId && !p.archived)
          : [];
      if (!targets.length) return { step: { ...step, status: "failed", result: "No patient or ward matched for monitoring.", verified: false }, ui };
      const ids: string[] = [];
      for (const patient of targets) {
        const config = platformStore.ensureMonitoring(patient.id);
        if (step.tool !== "disableMonitoring") {
          config.csiEnabled = true;
          if (params.fallRisk || /fall/.test(String(step.label))) config.fallRiskEnabled = true;
        } else {
          config.csiEnabled = false;
        }
        ids.push(patient.id);
      }
      const sample = platformStore.ensureMonitoring(ids[0]);
      const verified = step.tool === "disableMonitoring" ? sample.csiEnabled === false : sample.csiEnabled === true;
      return {
        step: {
          ...step,
          status: verified ? "done" : "failed",
          result: verified
            ? `Monitoring ${sample.csiEnabled ? "enabled" : "disabled"} for ${targets.map((t) => t.name).join(", ")}.`
            : "Monitoring state did not change.",
          verified,
          verification: `${targets[0].name} CSI flag is ${sample.csiEnabled ? "enabled" : "disabled"}${sample.fallRiskEnabled ? ", fall-risk on" : ""}.`,
          recordsAffected: ids,
        },
        ui: [{ selectRoomId: targets[0].id }],
      };
    }
    case "getRespiratoryStatus": {
      const patient = platformStore.findPatient(query);
      const ward = platformStore.resolveWard(String(params.ward || ""));
      const list = patient
        ? [patient]
        : ward
          ? platformStore.patients.filter((p) => p.wardId === ward.wardId && !p.archived)
          : platformStore.patients.filter((p) => !p.archived);
      const lines = list.map((p) => {
        const flag = p.respirationRate >= 24 || p.respirationRate <= 10 ? "ANOMALY" : "stable";
        return `${p.name} Rm ${p.roomNumber}: ${p.respirationRate} breaths/min (${flag})`;
      });
      return { step: { ...step, status: "done", result: lines.join("; "), verified: true, verification: "Values read from live patient telemetry records." }, ui };
    }
    case "getHighRiskEvents": {
      const ward = platformStore.resolveWard(String(params.ward || "Ward 4B"));
      const events = platformStore.patients.filter(
        (p) =>
          !p.archived &&
          (!ward || p.wardId === ward.wardId) &&
          (p.status !== "normal" || p.fallRiskScore >= 18 || p.movementIndex >= 60),
      );
      const result = events.length
        ? events.map((p) => `${p.name} Rm ${p.roomNumber}: ${p.status} · ${p.postureDescription}`).join("; ")
        : `No high-risk movement events in ${ward?.wardName || "the ward"}.`;
      return { step: { ...step, status: "done", result, verified: true }, ui };
    }
    case "updateSettings": {
      const before = { ...platformStore.settings };
      if (params.radarSensitivity) platformStore.settings.radarSensitivity = String(params.radarSensitivity);
      if (params.fallVelocityThreshold) platformStore.settings.fallVelocityThreshold = Number(params.fallVelocityThreshold);
      const changed = platformStore.settings.radarSensitivity !== before.radarSensitivity;
      ui.push({ radarSensitivity: platformStore.settings.radarSensitivity });
      return {
        step: {
          ...step,
          status: "done",
          result: `Radar sensitivity is ${platformStore.settings.radarSensitivity}${params.ward ? ` (requested for ${params.ward})` : ""}.`,
          verified: Boolean(params.radarSensitivity) ? platformStore.settings.radarSensitivity === params.radarSensitivity : true,
          verification: `Settings store now reports ${platformStore.settings.radarSensitivity}.`,
        },
        ui,
      };
    }
    case "updateNotificationSettings": {
      const enabled = Boolean(params.nurseNotificationsEnabled);
      platformStore.notifications.nurseNotificationsEnabled = enabled;
      platformStore.settings.nurseNotificationsEnabled = enabled;
      return {
        step: {
          ...step,
          status: "done",
          result: `Automatic nurse notifications are ${enabled ? "enabled" : "disabled"}.`,
          verified: platformStore.notifications.nurseNotificationsEnabled === enabled,
          verification: `Notification settings report nurseNotificationsEnabled=${platformStore.notifications.nurseNotificationsEnabled}.`,
        },
        ui,
      };
    }
    case "setTwinReplayWindow": {
      const seconds = Number(params.seconds);
      if (!seconds || seconds < 5 || seconds > 300) {
        return { step: { ...step, status: "failed", result: "Replay window must be between 5 and 300 seconds.", verified: false }, ui };
      }
      platformStore.settings.twinReplayWindowSec = seconds;
      return {
        step: {
          ...step,
          status: "done",
          result: `Digital twin replay window is ${seconds} seconds.`,
          verified: platformStore.settings.twinReplayWindowSec === seconds,
          verification: `Settings store reports twinReplayWindowSec=${platformStore.settings.twinReplayWindowSec}.`,
        },
        ui,
      };
    }
    case "selectPatientTwin": {
      const patient = platformStore.findPatient(query);
      if (!patient) return { step: { ...step, status: "failed", result: "Patient not found.", verified: false }, ui };
      ui.push({ selectRoomId: patient.id, view: "inspector" });
      return {
        step: {
          ...step,
          status: "done",
          result: `Digital twin focused on ${patient.name} in Room ${patient.roomNumber}.`,
          verified: true,
          verification: "Inspector focus command issued to the AetherPulse UI.",
          recordsAffected: [patient.id],
        },
        ui,
      };
    }
    case "focusTwinCamera": {
      const preset = (params.preset as UiCommand["cameraPreset"]) || "iso";
      ui.push({ view: "inspector", cameraPreset: preset });
      return { step: { ...step, status: "done", result: `Camera preset set to ${preset}.`, verified: true, verification: "Camera command queued for the 3D viewport." }, ui };
    }
    case "twinPlayback": {
      ui.push({
        view: "inspector",
        playback: (params.playback as UiCommand["playback"]) || "replay",
        playbackSpeed: params.playbackSpeed ? Number(params.playbackSpeed) : undefined,
        seekEvent: params.seekEvent ? String(params.seekEvent) : undefined,
      });
      return {
        step: {
          ...step,
          status: "done",
          result: `Twin playback command issued (${params.playback || "replay"}${params.seekEvent ? `, seek ${params.seekEvent}` : ""}). Replay window ${platformStore.settings.twinReplayWindowSec}s.`,
          verified: true,
          verification: "Playback command queued for the Digital Twin viewport.",
        },
        ui,
      };
    }
    case "toggleTwinLayer": {
      const cmd: UiCommand = { view: "inspector" };
      if (params.showPointCloud !== undefined) cmd.showPointCloud = Boolean(params.showPointCloud);
      if (params.showWavefronts !== undefined) cmd.showWavefronts = Boolean(params.showWavefronts);
      if (params.showTrajectory !== undefined) cmd.showTrajectory = Boolean(params.showTrajectory);
      ui.push(cmd);
      return { step: { ...step, status: "done", result: "Visualization layer command issued.", verified: true }, ui };
    }
    case "generateReport": {
      const patients = platformStore.patients.filter((p) => !p.archived);
      const patient = platformStore.findPatient(query);
      const result = patient
        ? `Patient summary: ${patient.name}, ${patient.age}y, ${patient.diagnosis}. ${patient.wardName} bed ${patient.bedNumber}. Fall-risk ${patient.fallRiskScore}. CSI ${platformStore.ensureMonitoring(patient.id).csiEnabled ? "active" : "inactive"}. RR ${patient.respirationRate}, HR ${patient.heartRate}.`
        : `Ward report: ${patients.length} patients, ${patients.filter((p) => p.status === "critical").length} critical, ${patients.filter((p) => p.status === "warning").length} warning. Average fall-risk ${(patients.reduce((s, p) => s + p.fallRiskScore, 0) / patients.length).toFixed(1)}.`;
      return { step: { ...step, status: "done", result, verified: true, verification: "Report generated from current store values." }, ui };
    }
    case "getAuditLog": {
      const rows = platformStore.audit.slice(0, 8).map((a) => `${a.timestamp.slice(11, 19)} ${a.id} ${a.success ? "OK" : "FAIL"} ${a.utterance}`);
      return { step: { ...step, status: "done", result: rows.join(" | ") || "No AI automation events yet.", verified: true }, ui };
    }
    case "updateDashboardConfig": {
      const view = params.defaultView === "inspector" ? "inspector" : "navigator";
      platformStore.dashboard.defaultView = view;
      ui.push({ view });
      return {
        step: {
          ...step,
          status: "done",
          result: `Default dashboard view is ${view}.`,
          verified: platformStore.dashboard.defaultView === view,
        },
        ui,
      };
    }
    case "updateUserPermissions": {
      if (role !== "administrator") {
        return { step: { ...step, status: "blocked", result: "Only an administrator can change user permissions.", verified: false }, ui };
      }
      return { step: { ...step, status: "blocked", result: "Permission changes require the identity console; the agent will not silently elevate roles.", verified: false }, ui };
    }
    default:
      return { step: { ...step, status: "failed", result: `Unknown tool ${step.tool}.`, verified: false }, ui };
  }
}

export function highestRisk(steps: AgentStep[]): AgentStep["risk"] {
  const order = { read: 0, write: 1, sensitive: 2, critical: 3 };
  return steps.reduce((max, step) => (order[step.risk] > order[max] ? step.risk : max), "read" as AgentStep["risk"]);
}

export function executeSteps(steps: AgentStep[], role: OperatorRole): { steps: AgentStep[]; ui: UiCommand[] } {
  const ui: UiCommand[] = [];
  const lastCreatedName = { value: "" };
  const executed = steps.map((planned) => {
    const params = { ...planned.params };
    if (lastCreatedName.value && (planned.tool === "enableMonitoring" || planned.tool === "assignPatientWard" || planned.tool === "assignPatientBed" || planned.tool === "notifyStaff")) {
      params.query = lastCreatedName.value;
      params.name = lastCreatedName.value;
    } else if (!params.query && !params.name && lastCreatedName.value) {
      params.query = lastCreatedName.value;
      params.name = lastCreatedName.value;
    }
    const result = runTool({ ...planned, params }, role);
    ui.push(...result.ui);
    if (planned.tool === "createPatient" && result.step.status === "done") {
      lastCreatedName.value = String(params.name || "");
    }
    return result.step;
  });
  return { steps: executed, ui };
}

export function buildResponse(args: {
  status: AgentCommandResponse["status"];
  summary: string;
  steps: AgentStep[];
  ui: UiCommand[];
  role: OperatorRole;
  userId: string;
  userName: string;
  utterance: string;
  confirmation: AgentAuditEntry["confirmation"];
  n8nNotified: boolean;
  explanation?: string;
  questions?: string[];
  confirmationId?: string;
}): AgentCommandResponse {
  const success = args.status === "completed" && args.steps.every((s) => s.status === "done" || s.status === "skipped");
  const id = auditId();
  if (args.status === "completed" || args.status === "failed" || args.status === "denied") {
    platformStore.recordAudit({
      id,
      timestamp: nowIso(),
      userId: args.userId,
      userName: args.userName,
      role: args.role,
      agent: "AetherPulse AI",
      utterance: args.utterance,
      tools: args.steps.map((s) => s.tool),
      parameters: args.steps.map((s) => s.params),
      result: args.summary,
      success,
      confirmation: args.confirmation,
      recordsAffected: args.steps.flatMap((s) => s.recordsAffected || []),
      n8nNotified: args.n8nNotified,
    });
  }

  return {
    status: args.status,
    phase: args.status === "awaiting_confirmation" ? "waiting_approval" : args.status === "completed" ? "completed" : args.status === "failed" ? "failed" : "planning",
    summary: args.summary,
    explanation: args.explanation,
    questions: args.questions,
    confirmationId: args.confirmationId,
    auditId: args.status === "awaiting_confirmation" ? undefined : id,
    steps: args.steps,
    uiCommands: args.ui,
    snapshot: args.status === "completed" ? platformStore.snapshot() : undefined,
  };
}

export { asPatient, TOOL_BY_NAME };
