import { describe, it, expect } from "vitest";
import { 
  isValidTransition, 
  RequestStatus, 
  REQUEST_STATUSES,
  isTerminalStatus,
  canCancelRequest
} from "./status";

describe("Request State Machine Transitions", () => {
  it("allows standard linear rescue progression", () => {
    expect(isValidTransition("submitted", "verified")).toBe(true);
    expect(isValidTransition("verified", "prioritized")).toBe(true);
    expect(isValidTransition("prioritized", "assigned")).toBe(true);
    expect(isValidTransition("assigned", "accepted")).toBe(true);
    expect(isValidTransition("accepted", "en_route")).toBe(true);
    expect(isValidTransition("en_route", "on_site")).toBe(true);
    expect(isValidTransition("on_site", "completed")).toBe(true);
  });

  it("blocks illegal status skips", () => {
    expect(isValidTransition("submitted", "completed")).toBe(false);
    expect(isValidTransition("submitted", "on_site")).toBe(false);
    expect(isValidTransition("assigned", "completed")).toBe(false);
    expect(isValidTransition("accepted", "completed")).toBe(false);
  });

  it("allows cancellation from non-terminal states", () => {
    expect(canCancelRequest("submitted")).toBe(true);
    expect(canCancelRequest("verified")).toBe(true);
    expect(canCancelRequest("prioritized")).toBe(true);
    expect(canCancelRequest("assigned")).toBe(true);
    expect(canCancelRequest("accepted")).toBe(true);
    expect(canCancelRequest("en_route")).toBe(true);
  });

  it("prevents any transitions out of terminal states", () => {
    expect(isTerminalStatus("completed")).toBe(true);
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("duplicate")).toBe(true);

    expect(isValidTransition("completed", "submitted")).toBe(false);
    expect(isValidTransition("completed", "assigned")).toBe(false);
    expect(isValidTransition("cancelled", "en_route")).toBe(false);
    expect(isValidTransition("duplicate", "verified")).toBe(false);
  });

  it("supports deduplication branching from triage states", () => {
    expect(isValidTransition("submitted", "duplicate")).toBe(true);
    expect(isValidTransition("verified", "duplicate")).toBe(true);
    expect(isValidTransition("prioritized", "duplicate")).toBe(true);
  });
});
