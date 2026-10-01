import { describe, it, expect, beforeEach } from "vitest";
import { enqueueOfflineRequest, getPendingRequests, removePendingRequest } from "./offline-queue";

describe("Offline Queue & Idempotency", () => {
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("should generate a client_request_id and enqueue request", async () => {
    const payload = {
      p_lat: 17.385,
      p_lng: 78.4867,
      p_contact_phone: "+91 91000 00002",
    };

    const clientRequestId = await enqueueOfflineRequest("sos", payload);
    expect(clientRequestId).toBeDefined();
    expect(typeof clientRequestId).toBe("string");

    const pending = await getPendingRequests();
    expect(pending.length).toBeGreaterThan(0);
    const found = pending.find((p) => p.client_request_id === clientRequestId);
    expect(found).toBeDefined();
    expect(found?.type).toBe("sos");
  });

  it("should remove request upon successful sync", async () => {
    const payload = {
      p_title: "Test Flood Incident",
      p_severity: "medium",
    };

    const id = await enqueueOfflineRequest("incident", payload);
    let pending = await getPendingRequests();
    expect(pending.some((p) => p.client_request_id === id)).toBe(true);

    await removePendingRequest(id);
    pending = await getPendingRequests();
    expect(pending.some((p) => p.client_request_id === id)).toBe(false);
  });
});
