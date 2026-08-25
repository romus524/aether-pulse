import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasCapability, redactPatient, parseRole } from "../src/platform/rbac.ts";
import { INITIAL_PATIENTS } from "../src/data/mockData.ts";

describe("role access", () => {
  it("parses known roles", () => {
    assert.equal(parseRole("Doctor"), "doctor");
    assert.equal(parseRole("nope"), "nurse");
  });

  it("lets nurses dispatch but not simulate", () => {
    assert.equal(hasCapability("nurse", "dispatch"), true);
    assert.equal(hasCapability("nurse", "simulateEvent"), false);
    assert.equal(hasCapability("nurse", "changeRadar"), false);
  });

  it("lets technicians simulate and change radar but not dispatch", () => {
    assert.equal(hasCapability("technician", "simulateEvent"), true);
    assert.equal(hasCapability("technician", "changeRadar"), true);
    assert.equal(hasCapability("technician", "dispatch"), false);
    assert.equal(hasCapability("technician", "viewPhi"), false);
  });

  it("keeps analysts read-only", () => {
    assert.equal(hasCapability("analyst", "dispatch"), false);
    assert.equal(hasCapability("analyst", "acknowledge"), false);
    assert.equal(hasCapability("analyst", "simulateEvent"), false);
    assert.equal(hasCapability("analyst", "viewAuditLog"), true);
  });

  it("redacts PHI for technician views", () => {
    const source = INITIAL_PATIENTS[0];
    const redacted = redactPatient(source, "technician");
    assert.equal(redacted.mrn, "REDACTED");
    assert.notEqual(redacted.name, source.name);
    assert.equal(redactPatient(source, "doctor").mrn, source.mrn);
  });

  it("hides hardware and predictive panels from nurses", () => {
    assert.equal(hasCapability("nurse", "viewHardware"), false);
    assert.equal(hasCapability("nurse", "viewPredictive"), false);
    assert.equal(hasCapability("doctor", "viewPredictive"), true);
    assert.equal(hasCapability("administrator", "simulateEvent"), true);
  });
});
