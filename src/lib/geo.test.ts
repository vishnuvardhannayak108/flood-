import { describe, it, expect } from "vitest";
import { calculateDistanceKm, formatCoordinates, DEFAULT_COORDINATES } from "./geo";

describe("Geo Utilities", () => {
  it("should calculate correct Haversine distance between two coordinates", () => {
    // Distance between Charminar (17.3616, 78.4747) and Hussain Sagar (17.4239, 78.4738) is ~6.9 km
    const dist = calculateDistanceKm(17.3616, 78.4747, 17.4239, 78.4738);
    expect(dist).toBeGreaterThan(6.0);
    expect(dist).toBeLessThan(8.0);
  });

  it("should return 0 km for identical coordinates", () => {
    const dist = calculateDistanceKm(17.385, 78.4867, 17.385, 78.4867);
    expect(dist).toBe(0);
  });

  it("should format coordinates cleanly", () => {
    const formatted = formatCoordinates(17.385012, 78.486734);
    expect(formatted).toBe("17.38501° N, 78.48673° E");
  });

  it("should have sensible default coordinates for Hyderabad center", () => {
    expect(DEFAULT_COORDINATES.lat).toBeCloseTo(17.385, 2);
    expect(DEFAULT_COORDINATES.lng).toBeCloseTo(78.4867, 2);
  });
});
