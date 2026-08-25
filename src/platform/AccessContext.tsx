import { createContext, useContext, useMemo, type ReactNode } from "react";
import { OperatorRole } from "./agentProtocol";
import {
  AppCapability,
  ROLE_CAPABILITIES,
  ROLE_LABELS,
  ROLE_SUMMARIES,
  hasCapability,
  redactPatient,
} from "./rbac";
import { PatientRecord } from "../types";

interface AccessValue {
  role: OperatorRole;
  label: string;
  summary: string;
  can: (capability: AppCapability) => boolean;
  displayPatient: (patient: PatientRecord) => PatientRecord;
}

const AccessContext = createContext<AccessValue | null>(null);

export function AccessProvider({ role, children }: { role: OperatorRole; children: ReactNode }) {
  const value = useMemo<AccessValue>(
    () => ({
      role,
      label: ROLE_LABELS[role],
      summary: ROLE_SUMMARIES[role],
      can: (capability) => hasCapability(role, capability),
      displayPatient: (patient) => redactPatient(patient, role),
    }),
    [role],
  );

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess(): AccessValue {
  const value = useContext(AccessContext);
  if (!value) {
    return {
      role: "nurse",
      label: ROLE_LABELS.nurse,
      summary: ROLE_SUMMARIES.nurse,
      can: (capability) => ROLE_CAPABILITIES.nurse.includes(capability),
      displayPatient: (patient) => redactPatient(patient, "nurse"),
    };
  }
  return value;
}
