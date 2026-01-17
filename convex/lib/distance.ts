/**
 * Distance calculation utilities for Convex
 */

/**
 * Calculate the distance between two points using the Haversine formula
 *
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Cinema type with location information
 */
type CinemaWithLocation = {
  latitude: number;
  longitude: number;
  [key: string]: unknown;
};

/**
 * Sort cinemas by distance from a given point
 *
 * @param cinemas - Array of cinemas with latitude/longitude
 * @param userLat - User's latitude
 * @param userLon - User's longitude
 * @returns Sorted array of cinemas with distance property added
 */
export function sortCinemasByDistance<T extends CinemaWithLocation>(
  cinemas: T[],
  userLat: number,
  userLon: number,
): (T & { distance: number })[] {
  return cinemas
    .map((cinema) => ({
      ...cinema,
      distance: calculateDistance(
        userLat,
        userLon,
        cinema.latitude,
        cinema.longitude,
      ),
    }))
    .sort((a, b) => a.distance - b.distance);
}
