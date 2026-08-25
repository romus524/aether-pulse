import { AgentStep, OperatorRole } from "../platform/agentProtocol";
import { TOOL_BY_NAME } from "../platform/toolCatalog";
import { platformStore } from "./platformStore";

function step(tool: string, params: Record<string, unknown>, label?: string): AgentStep {
  const def = TOOL_BY_NAME[tool];
  return {
    id: `${tool}-${Math.random().toString(36).slice(2, 8)}`,
    tool,
    workflow: def?.workflow || "Workflow Management",
    label: label || def?.description || tool,
    risk: def?.risk || "read",
    params,
    status: "pending",
  };
}

function extractQuoted(text: string): string | undefined {
  const match = text.match(/[“"]([^”"]+)[”"]/);
  return match?.[1];
}

function extractPersonName(text: string): string | undefined {
  const quoted = extractQuoted(text);
  if (quoted && /[a-z]/i.test(quoted)) return quoted;
  const named = text.match(/\b(?:[Pp]atient|[Nn]amed|[Cc]alled)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/);
  if (named) return named[1];
  const add = text.match(
    /\b(?:[Aa]dd|[Aa]dmit|[Rr]egister|[Cc]reate)\s+(?:a\s+|the\s+|new\s+)*(?:patient\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  );
  if (add?.[1] && !/^ward\b/i.test(add[1])) return add[1];
  const known = platformStore.patients.find((patient) => !patient.archived && text.toLowerCase().includes(patient.name.toLowerCase()));
  return known?.name;
}

function extractRoom(text: string): string | undefined {
  const bed = text.match(/\bbed\s*(\d{2,3}(?:-[a-z])?)\b/i);
  if (bed) return bed[1];
  const room = text.match(/\broom\s*#?\s*(\d{2,3})\b/i);
  return room?.[1];
}

function extractWard(text: string): string | undefined {
  const match = text.match(/\bward\s*(\d+[a-z]?)\b/i);
  return match ? `Ward ${match[1].toUpperCase()}` : undefined;
}

function extractSeconds(text: string): number | undefined {
  const match = text.match(/(\d+)\s*(?:seconds?|secs?)\b/i);
  return match ? Number(match[1]) : undefined;
}

function patientQuery(text: string, selectedRoomId?: string): string | undefined {
  return extractPersonName(text) || extractRoom(text) || selectedRoomId;
}

export interface PlannedCommand {
  steps: AgentStep[];
  missing: string[];
  explanation: string;
  conversational: boolean;
}

export function planUtterance(utterance: string, _role: OperatorRole, selectedRoomId?: string): PlannedCommand {
  const text = utterance.trim();
  const lower = text.toLowerCase();
  const steps: AgentStep[] = [step("validatePermissions", { utterance: text }, "Validate operator permissions")];
  const missing: string[] = [];
  const bits: string[] = [];

  const wantsCreate =
    (/\b(add|admit|create|register)\b/.test(lower) && /\bpatient\b/.test(lower)) ||
    (/\badd\b/.test(lower) && Boolean(extractPersonName(text)));
  const wantsAssignWard = /\bassign\b/.test(lower) && /\bward\b/.test(lower);
  const wantsAssignBed = /\b(assign|change|move)\b/.test(lower) && /\bbed\b/.test(lower);
  const wantsTransfer = /\btransfer\b/.test(lower);
  const wantsArchive = /\b(archive|discharge|remove patient)\b/.test(lower);
  const wantsSearch = /\b(search|find|look up|list patients)\b/.test(lower);
  const wantsGetPatient = /\b(get|show|retrieve|open)\b/.test(lower) && /\b(patient|record|chart)\b/.test(lower);
  const wantsAlerts = /\balert/.test(lower);
  const wantsAck = /\b(acknowledge|ack)\b/.test(lower);
  const wantsEscalate = /\bescalat/.test(lower);
  const wantsSuppress = /\b(suppress|dismiss|silence|clear critical)\b/.test(lower);
  const wantsEnableMon = /\b(enable|start|turn on)\b/.test(lower) && /\b(monitor|csi|fall-risk|fall risk)\b/.test(lower);
  const wantsDisableMon = /\b(disable|stop|turn off)\b/.test(lower) && /\b(monitor|csi)\b/.test(lower);
  const wantsResp = /\brespirat/.test(lower);
  const wantsHighRisk = /\bhigh-risk|high risk movement|bed-exit|bed exit\b/.test(lower);
  const wantsNotify = /\bnotify\b/.test(lower) && !/\bnotification/.test(lower);
  const wantsSettings = /\b(sensitivity|threshold|preference|setting)\b/.test(lower) || /\balert sensitivity\b/.test(lower);
  const wantsNurseNotif = /\bnurse notification/.test(lower);
  const wantsReplayWindow = /\breplay window|replay to\b/.test(lower);
  const wantsTwinSelect = /\b(select|focus|open)\b/.test(lower) && /\b(twin|3d|inspector|patient)\b/.test(lower);
  const wantsCamera = /\bcamera|iso view|top view|bed view|side view\b/.test(lower);
  const wantsPlayback = /\b(pause twin|go live|jump to|playback)\b/.test(lower) || (/\breplay\b/.test(lower) && !/\breplay window\b/.test(lower));
  const wantsLayer = /\b(point cloud|wavefront|trajectory|visualization layer)\b/.test(lower);
  const wantsReport = /\b(report|summary|analytics)\b/.test(lower);
  const wantsAudit = /\baudit\b/.test(lower);
  const wantsStatus = /\b(system status|ward status|occupancy)\b/.test(lower);
  const wantsDashboard = /\bdashboard\b/.test(lower) && /\b(default|view|config)\b/.test(lower);
  const wantsPerms = /\b(permission|role)\b/.test(lower) && /\b(change|set|grant)\b/.test(lower);
  const wantsUpdate = /\b(update|change)\b/.test(lower) && /\b(age|diagnosis|physician|name)\b/.test(lower);

  if (wantsCreate) {
    const name = extractPersonName(text);
    const ward = extractWard(text);
    const bed = extractRoom(text);
    if (!name) missing.push("patient name");
    steps.push(
      step(
        "createPatient",
        { name, ward, bedNumber: bed, diagnosis: undefined },
        "Create patient record",
      ),
    );
    bits.push("create a patient record");
    if (ward) {
      steps.push(step("assignPatientWard", { name, ward }, "Assign ward"));
      bits.push(`assign ${ward}`);
    }
    if (bed && /bed/i.test(text)) {
      steps.push(step("assignPatientBed", { name, bedNumber: bed }, "Assign bed"));
    }
  }

  if (wantsTransfer) {
    const name = patientQuery(text, selectedRoomId);
    const ward = extractWard(text);
    if (!name) missing.push("which patient to transfer");
    if (!ward) missing.push("destination ward");
    steps.push(step("transferPatient", { query: name, ward }, "Transfer patient"));
    bits.push("transfer the patient");
  } else if (wantsAssignWard && !wantsCreate) {
    const name = patientQuery(text, selectedRoomId);
    const ward = extractWard(text);
    if (!name) missing.push("which patient");
    if (!ward) missing.push("which ward");
    steps.push(step("assignPatientWard", { query: name, ward }, "Assign ward"));
    bits.push("assign the ward");
  }

  if (wantsAssignBed && !wantsCreate) {
    const name = patientQuery(text, selectedRoomId);
    const bed = extractRoom(text);
    if (!name) missing.push("which patient");
    if (!bed) missing.push("which bed");
    steps.push(step("assignPatientBed", { query: name, bedNumber: bed }, "Assign bed"));
    bits.push("assign the bed");
  }

  if (wantsArchive) {
    const name = patientQuery(text, selectedRoomId);
    if (!name) missing.push("which patient to archive");
    steps.push(step("archivePatient", { query: name }, "Archive patient record"));
    bits.push("archive the patient");
  }

  if (wantsUpdate) {
    const name = patientQuery(text, selectedRoomId);
    if (!name) missing.push("which patient to update");
    const diagnosis = text.match(/diagnosis(?:\s+to)?\s+(.+)$/i)?.[1];
    steps.push(step("updatePatient", { query: name, diagnosis }, "Update patient information"));
    bits.push("update patient information");
  }

  if (wantsSearch) {
    const q = text.replace(/.*\b(?:search|find|look up|list patients)\b/i, "").trim() || text;
    steps.push(step("searchPatients", { query: q }, "Search patient records"));
    bits.push("search patient records");
  }

  if (wantsGetPatient && !wantsCreate) {
    const name = patientQuery(text, selectedRoomId);
    if (!name) missing.push("which patient");
    steps.push(step("getPatient", { query: name }, "Retrieve patient record"));
    bits.push("retrieve the patient record");
  }

  if (wantsEnableMon) {
    const query = patientQuery(text, selectedRoomId) || extractWard(text);
    const fall = /\bfall/.test(lower);
    steps.push(
      step(
        "enableMonitoring",
        { query, fallRisk: fall || undefined, ward: extractWard(text) },
        fall ? "Enable fall-risk monitoring" : "Enable CSI monitoring",
      ),
    );
    bits.push("enable monitoring");
  }

  if (wantsDisableMon) {
    const query = patientQuery(text, selectedRoomId);
    if (!query) missing.push("which patient or bed to stop monitoring");
    steps.push(step("disableMonitoring", { query }, "Disable CSI monitoring"));
    bits.push("disable monitoring");
  }

  if (wantsResp) {
    const query = patientQuery(text, selectedRoomId);
    steps.push(step("getRespiratoryStatus", { query, ward: extractWard(text) }, "Read respiratory-rate status"));
    bits.push("read respiratory status");
  }

  if (wantsHighRisk && !wantsEnableMon) {
    steps.push(step("getHighRiskEvents", { ward: extractWard(text) || "Ward 4B" }, "Check high-risk movement events"));
    bits.push("check high-risk movement events");
  }

  if (wantsSuppress) {
    const query = patientQuery(text, selectedRoomId);
    steps.push(step("suppressAlert", { query }, "Suppress critical alert"));
    bits.push("suppress an alert");
  } else if (wantsAck) {
    const query = patientQuery(text, selectedRoomId);
    steps.push(step("acknowledgeAlert", { query }, "Acknowledge alert"));
    bits.push("acknowledge the alert");
  } else if (wantsEscalate) {
    const query = patientQuery(text, selectedRoomId);
    steps.push(step("escalateAlert", { query }, "Escalate alert"));
    bits.push("escalate the alert");
  } else if (wantsAlerts) {
    steps.push(step("getAlerts", { unresolved: /unresolved|active/.test(lower) }, "Retrieve alerts"));
    bits.push("retrieve alerts");
  }

  if (wantsNotify) {
    const query = patientQuery(text, selectedRoomId);
    steps.push(
      step(
        "notifyStaff",
        { query, message: text, recipients: ["assigned-nurse"] },
        "Notify authorized staff",
      ),
    );
    bits.push("notify authorized staff");
  }

  if (wantsNurseNotif) {
    const enabled = !/\b(disable|off|stop)\b/.test(lower);
    steps.push(
      step("updateNotificationSettings", { nurseNotificationsEnabled: enabled }, "Update nurse notification settings"),
    );
    bits.push(`${enabled ? "enable" : "disable"} automatic nurse notifications`);
  }

  if (wantsSettings) {
    const ward = extractWard(text);
    let radarSensitivity: string | undefined;
    if (/ultra/.test(lower)) radarSensitivity = "Ultra High (0.1m/s)";
    else if (/standard/.test(lower)) radarSensitivity = "Standard Neuro (0.3m/s)";
    else if (/filter/.test(lower)) radarSensitivity = "Filtered (0.5m/s)";
    else if (/sensitivity/.test(lower)) radarSensitivity = "Standard Neuro (0.3m/s)";
    steps.push(step("updateSettings", { ward, radarSensitivity }, "Update system settings"));
    bits.push("change supported settings");
  }

  if (wantsReplayWindow) {
    const seconds = extractSeconds(text);
    if (!seconds) missing.push("replay window in seconds");
    steps.push(
      step(
        "setTwinReplayWindow",
        { seconds },
        "Set digital twin replay window",
      ),
    );
    bits.push("set the twin replay window");
  }

  if (wantsTwinSelect) {
    const query = patientQuery(text, selectedRoomId);
    if (!query) missing.push("which patient to focus");
    steps.push(step("selectPatientTwin", { query }, "Select patient digital twin"));
    bits.push("focus the digital twin");
  }

  if (wantsCamera) {
    const preset = /top/.test(lower)
      ? "top"
      : /side/.test(lower)
        ? "side"
        : /front/.test(lower)
          ? "front"
          : /bed/.test(lower)
            ? "bed"
            : "iso";
    steps.push(step("focusTwinCamera", { preset }, "Focus 3D camera"));
    bits.push(`move the camera to ${preset}`);
  }

  if (wantsPlayback) {
    const playback = /\bpause\b/.test(lower)
      ? "pause"
      : /\blive\b/.test(lower)
        ? "live"
        : "replay";
    const seekEvent = /bed-exit|bed exit/.test(lower)
      ? "bed-exit"
      : /fall/.test(lower)
        ? "fall"
        : undefined;
    const speed = text.match(/(\d+(?:\.\d+)?)x/)?.[1];
    steps.push(
      step("twinPlayback", { playback, seekEvent, playbackSpeed: speed ? Number(speed) : undefined }, "Control twin playback"),
    );
    bits.push("control digital twin playback");
  }

  if (wantsLayer) {
    steps.push(
      step(
        "toggleTwinLayer",
        {
          showPointCloud: /point cloud/.test(lower) ? !/off|hide/.test(lower) : undefined,
          showWavefronts: /wavefront/.test(lower) ? !/off|hide/.test(lower) : undefined,
          showTrajectory: /trajectory/.test(lower) ? !/off|hide/.test(lower) : undefined,
        },
        "Toggle visualization layer",
      ),
    );
    bits.push("toggle a visualization layer");
  }

  if (wantsReport) {
    steps.push(step("generateReport", { query: patientQuery(text, selectedRoomId), ward: extractWard(text) }, "Generate report"));
    bits.push("generate a report");
  }

  if (wantsAudit) {
    steps.push(step("getAuditLog", {}, "Retrieve AI activity log"));
    bits.push("retrieve the audit log");
  }

  if (wantsStatus) {
    steps.push(step("getSystemStatus", {}, "Get system status"));
    bits.push("read system status");
  }

  if (wantsDashboard) {
    const view = /inspector|3d/.test(lower) ? "inspector" : "navigator";
    steps.push(step("updateDashboardConfig", { defaultView: view }, "Update dashboard configuration"));
    bits.push("update dashboard configuration");
  }

  if (wantsPerms) {
    steps.push(step("updateUserPermissions", { utterance: text }, "Change user permissions"));
    bits.push("change user permissions");
  }

  const operational = steps.length > 1;
  if (!operational && /\b(help|what can you|capabilities|system status|ward status|occupancy)\b/.test(lower)) {
    steps.push(step("getSystemStatus", {}, "Read current system status"));
    bits.push("read system status");
  }

  const explanation = steps.length > 1
    ? `I will ${bits.join(", then ")}.`
    : "This looks like a question rather than a platform mutation. I will ask the automation assistant without changing records.";

  return {
    steps,
    missing,
    explanation,
    conversational: steps.length <= 1,
  };
}
