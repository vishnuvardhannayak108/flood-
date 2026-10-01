export interface GeoCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export const DEFAULT_COORDINATES: GeoCoordinates = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || "17.3850"),
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || "78.4867"),
  accuracy: 50,
};

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Formats coordinates for display or emergency SMS prefill
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E`;
}

/**
 * Obtains high-accuracy GPS coordinates with rapid fallback
 */
export function getRapidLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      resolve(DEFAULT_COORDINATES);
      return;
    }

    // First attempt: High Accuracy with 5-second timeout
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        console.warn("High-accuracy GPS failed, trying standard fallback:", err.message);
        // Fallback: Standard Accuracy with 4-second timeout
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          (err2) => {
            console.warn("Geolocation denied or unavailable:", err2.message);
            resolve(DEFAULT_COORDINATES);
          },
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  });
}
