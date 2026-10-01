import { describe, it, expect } from "vitest";
import { 
  URGENCY_MAP, 
  REQUEST_STATUS_MAP, 
  ALLOWED_TRANSITIONS, 
  RequestStatus, 
  UrgencyLevel 
} from "./status";

describe("Status and Urgency mappings", () => {
  it("should have all 4 urgency levels properly configured with labels and badges", () => {
    const urgencies: UrgencyLevel[] = ["low", "medium", "high", "critical"];
    urgencies.forEach((u) => {
      expect(URGENCY_MAP[u]).toBeDefined();
      expect(URGENCY_MAP[u].label).toBeTruthy();
      expect(URGENCY_MAP[u].badge).toBeTruthy();
    });
    expect(URGENCY_MAP.critical.pulse).toBe(true);
  });

  it("should have all standard request statuses defined with sequential step indices", () => {
    const statuses: RequestStatus[] = [
      "submitted",
      "verified",
      "prioritized",
      "assigned",
      "accepted",
      "en_route",
      "on_site",
      "completed",
      "cancelled",
    ];

    statuses.forEach((s) => {
      expect(REQUEST_STATUS_MAP[s]).toBeDefined();
      expect(REQUEST_STATUS_MAP[s].label).toBeTruthy();
      expect(REQUEST_STATUS_MAP[s].badgeClass).toBeTruthy();
    });

    expect(REQUEST_STATUS_MAP.submitted.stepIndex).toBe(1);
    expect(REQUEST_STATUS_MAP.completed.stepIndex).toBe(7);
  });

  it("should enforce valid state machine transitions", () => {
    // submitted can move to verified, prioritized, cancelled
    expect(ALLOWED_TRANSITIONS.submitted).toContain("verified");
    expect(ALLOWED_TRANSITIONS.submitted).toContain("cancelled");

    // accepted can only move to en_route or cancelled
    expect(ALLOWED_TRANSITIONS.accepted).toContain("en_route");
    expect(ALLOWED_TRANSITIONS.accepted).toContain("cancelled");
    expect(ALLOWED_TRANSITIONS.accepted).not.toContain("submitted");

    // completed is a terminal state with no outgoing transitions
    expect(ALLOWED_TRANSITIONS.completed).toEqual([]);
  });
});
