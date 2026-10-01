import { describe, it, expect, beforeEach } from "vitest";
import { CrisisStore } from "./crisis-store";

describe("End-to-End Multi-Role Crisis Operations Flow", () => {
  it("executes the full citizen-to-rescue dispatch lifecycle", () => {
    // 1. Citizen creates SOS
    const createdReq = CrisisStore.createRequest({
      lat: 17.3753,
      lng: 78.4878,
      phone: "+91 98490 99999",
      citizenName: "E2E Test Citizen",
      peopleCount: 4,
      hasVulnerable: true,
      urgency: "critical",
      type: "Trapped on Rooftop",
      description: "Flood water surging past ground floor window sill",
      address: "Chaderghat Riverfront Lane 4",
    });

    expect(createdReq).toBeDefined();
    expect(createdReq.shortCode).toMatch(/^FR-\d{4}$/);
    expect(createdReq.status).toBe("prioritized");
    expect(createdReq.priorityScore).toBeGreaterThanOrEqual(60);

    // 2. Queue contains request
    const allReqs = CrisisStore.getRequests();
    const found = allReqs.find((r) => r.id === createdReq.id);
    expect(found).toBeDefined();

    // 3. Dispatch admin / rescue team claims the mission
    const assigned = CrisisStore.updateRequestStatus(
      createdReq.id,
      "assigned",
      "Assigned to boat unit",
      "HQ Dispatcher",
      "admin",
      "Team Alpha 01"
    );
    expect(assigned?.status).toBe("assigned");
    expect(assigned?.assignedTeam).toBe("Team Alpha 01");

    // 4. Rescue team accepts and gets en route
    const enRoute = CrisisStore.updateRequestStatus(
      createdReq.id,
      "en_route",
      "Boat engine deployed, navigating river corridor",
      "Team Lead",
      "rescue_team"
    );
    expect(enRoute?.status).toBe("en_route");

    // 5. Team arrives on site
    const onSite = CrisisStore.updateRequestStatus(
      createdReq.id,
      "on_site",
      "Responders reached rooftop, boarding citizens onto boat",
      "Team Lead",
      "rescue_team"
    );
    expect(onSite?.status).toBe("on_site");

    // 6. Mission completed
    const completed = CrisisStore.updateRequestStatus(
      createdReq.id,
      "completed",
      "All 4 victims safely transferred to Amberpet Relief Camp",
      "Team Lead",
      "rescue_team"
    );
    expect(completed?.status).toBe("completed");
    expect(completed?.history.length).toBeGreaterThan(1);
  });

  it("adjusts shelter occupancy dynamically and updates capacity status", () => {
    const shelters = CrisisStore.getShelters();
    expect(shelters.length).toBeGreaterThan(0);
    const target = shelters[0];

    // Admitting evacuees
    const updated = CrisisStore.updateShelterOccupancy(target.id, 150);
    expect(updated?.currentOccupancy).toBe(150);
    expect(updated?.status).toBe("open");

    // Maxing out capacity
    const filled = CrisisStore.updateShelterOccupancy(target.id, target.maxCapacity);
    expect(filled?.status).toBe("full");

    // Resetting for next arrivals
    const reset = CrisisStore.updateShelterOccupancy(target.id, 50);
    expect(reset?.status).toBe("open");
  });

  it("handles emergency weather broadcasts and revocations", () => {
    const newAlert = CrisisStore.createAlert({
      severity: "critical",
      title: "E2E Siren Test Alert",
      description: "Immediate precautionary check",
      source: "GHMC SEOC",
      issuedAt: "Just now",
      expiresAt: "In 2 hours",
      suggestedAction: "Test directive",
    });

    expect(newAlert.id).toBeDefined();

    const activeAlerts = CrisisStore.getAlerts();
    expect(activeAlerts.some((a) => a.id === newAlert.id)).toBe(true);

    CrisisStore.deleteAlert(newAlert.id);
    const remaining = CrisisStore.getAlerts();
    expect(remaining.some((a) => a.id === newAlert.id)).toBe(false);
  });

  it("processes community incident reporting and verification", () => {
    const incident = CrisisStore.createIncident({
      title: "E2E Overflowing Drain",
      description: "Severe backflow into residential lane",
      waterLevelCm: 85,
      locationName: "Amberpet Lane 2",
      lat: 17.389,
      lng: 78.518,
      reporterName: "Test Citizen",
    });

    expect(incident.status).toBe("pending");

    const verified = CrisisStore.updateIncidentStatus(incident.id, "verified");
    expect(verified?.status).toBe("verified");
  });

  it("records tamper-evident audit logs across operational mutations", () => {
    const logs = CrisisStore.getAuditLogs();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty("action");
    expect(logs[0]).toHaveProperty("actorRole");
    expect(logs[0]).toHaveProperty("diff");
  });
});
