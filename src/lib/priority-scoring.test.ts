import { describe, it, expect } from "vitest";
import { calculatePriorityScore } from "./priority";

describe("Priority Scoring Engine", () => {
  it("scores a critical request with vulnerable people higher than low request", () => {
    const criticalScore = calculatePriorityScore({
      urgency: "critical",
      peopleCount: 4,
      hasVulnerable: true,
      waitingMinutes: 15,
      floodLevelCm: 120
    });

    const lowScore = calculatePriorityScore({
      urgency: "low",
      peopleCount: 1,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    expect(criticalScore).toBeGreaterThan(lowScore);
    expect(criticalScore).toBeGreaterThanOrEqual(80);
    expect(lowScore).toBeLessThanOrEqual(20);
  });

  it("scales points with trapped headcount up to cap", () => {
    const onePerson = calculatePriorityScore({
      urgency: "medium",
      peopleCount: 1,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    const sixPeople = calculatePriorityScore({
      urgency: "medium",
      peopleCount: 6,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    const twentyPeople = calculatePriorityScore({
      urgency: "medium",
      peopleCount: 20,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    expect(sixPeople).toBeGreaterThan(onePerson);
    // Headcount points capped at 25 + 10 = 35
    expect(twentyPeople).toBe(35);
  });

  it("adds bonus for vulnerable individuals", () => {
    const withoutVulnerable = calculatePriorityScore({
      urgency: "high",
      peopleCount: 2,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    const withVulnerable = calculatePriorityScore({
      urgency: "high",
      peopleCount: 2,
      hasVulnerable: true,
      waitingMinutes: 0
    });

    expect(withVulnerable - withoutVulnerable).toBe(15);
  });

  it("escalates score over waiting time", () => {
    const initial = calculatePriorityScore({
      urgency: "high",
      peopleCount: 2,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    const afterOneHour = calculatePriorityScore({
      urgency: "high",
      peopleCount: 2,
      hasVulnerable: false,
      waitingMinutes: 60
    });

    expect(afterOneHour).toBeGreaterThan(initial);
    // 60 mins / 10 = 6 intervals * 2 = 12 points
    expect(afterOneHour - initial).toBe(12);
  });

  it("bounds output strictly between 0 and 100", () => {
    const extremeMax = calculatePriorityScore({
      urgency: "critical",
      peopleCount: 50,
      hasVulnerable: true,
      waitingMinutes: 300,
      floodLevelCm: 400
    });

    const extremeMin = calculatePriorityScore({
      urgency: "low",
      peopleCount: 0,
      hasVulnerable: false,
      waitingMinutes: 0
    });

    expect(extremeMax).toBeLessThanOrEqual(100);
    expect(extremeMin).toBeGreaterThanOrEqual(0);
  });
});
