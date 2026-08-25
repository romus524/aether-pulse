import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { planUtterance } from "../src/server/planner.ts";

describe("planUtterance", () => {
  it("treats a greeting as conversational and does not invent a mutation", () => {
    const plan = planUtterance("hello there", "nurse");
    assert.equal(plan.conversational, true);
    assert.equal(plan.steps.length, 1);
    assert.equal(plan.steps[0].tool, "validatePermissions");
  });

  it("requires a patient name before create", () => {
    const plan = planUtterance("add a new patient and enable CSI monitoring", "nurse");
    assert.ok(plan.missing.includes("patient name"));
  });

  it("plans create + ward + monitoring from a natural command", () => {
    const plan = planUtterance("Add Jane Doe to Ward 3 and enable CSI monitoring", "nurse");
    assert.equal(plan.conversational, false);
    const tools = plan.steps.map((step) => step.tool);
    assert.ok(tools.includes("createPatient"));
    assert.ok(tools.includes("assignPatientWard") || tools.includes("enableMonitoring"));
  });
});
