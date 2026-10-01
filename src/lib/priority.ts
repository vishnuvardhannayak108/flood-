import { UrgencyLevel } from "./status";

export interface PriorityFactors {
  urgency: UrgencyLevel;
  peopleCount: number;
  hasVulnerable: boolean;
  waitingMinutes: number;
  floodLevelCm?: number;
}

/**
 * Client-side mirror of compute_priority_score PostgreSQL function
 * Multi-factor formula bounded to [0, 100]
 */
export function calculatePriorityScore(factors: PriorityFactors): number {
  let score = 0;

  // 1. Base urgency score
  switch (factors.urgency) {
    case "critical":
      score += 40;
      break;
    case "high":
      score += 25;
      break;
    case "medium":
      score += 10;
      break;
    case "low":
    default:
      score += 0;
      break;
  }

  // 2. Trapped individuals (4 points per head, capped at 25)
  const peoplePts = Math.min(25, Math.max(1, factors.peopleCount) * 4);
  score += peoplePts;

  // 3. Vulnerable individuals bonus (infants, pregnant, elderly)
  if (factors.hasVulnerable) {
    score += 15;
  }

  // 4. Time escalation (2 points per 10 minutes waiting, capped at 20)
  const timePts = Math.min(20, Math.floor(Math.max(0, factors.waitingMinutes) / 10) * 2);
  score += timePts;

  // 5. Standing flood water level (if provided, 5 points per 50cm, capped at 15)
  if (factors.floodLevelCm && factors.floodLevelCm > 0) {
    const waterPts = Math.min(15, Math.floor(factors.floodLevelCm / 50) * 5);
    score += waterPts;
  }

  // Bounded within 0 to 100
  return Math.min(100, Math.max(0, score));
}
