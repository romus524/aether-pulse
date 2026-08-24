import { OperatorRole, RiskLevel } from "./agentProtocol";

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
