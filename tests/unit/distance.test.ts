import { describe, it, expect } from "vitest";
import { calculateDistance, sortCinemasByDistance } from "~/lib/distance";

describe("calculateDistance", () => {
  describe("basic distance calculations", () => {
    it("calculates distance between two points correctly", () => {
      // Bucharest (44.4268, 26.1025) to Cluj-Napoca (46.7712, 23.6236)
      const distance = calculateDistance(44.4268, 26.1025, 46.7712, 23.6236);
      // Expected: approximately 324 km (allow ±5km tolerance for Haversine calculation)
      expect(distance).toBeGreaterThanOrEqual(320);
      expect(distance).toBeLessThanOrEqual(330);
    });

    it("returns 0 for same coordinates", () => {
      const distance = calculateDistance(44.4268, 26.1025, 44.4268, 26.1025);
      expect(distance).toBe(0);
    });

    it("calculates short distances accurately", () => {
      // Two nearby points in Bucharest (approximately 1km apart)
      const distance = calculateDistance(44.4268, 26.1025, 44.4358, 26.1125);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(2);
    });

    it("calculates long distances accurately", () => {
      // Bucharest to Paris
      const distance = calculateDistance(44.4268, 26.1025, 48.8566, 2.3522);
      // Expected: approximately 1870 km (allow ±50km tolerance for long distances)
      expect(distance).toBeGreaterThanOrEqual(1820);
      expect(distance).toBeLessThanOrEqual(1920);
    });
  });

  describe("known real-world distances", () => {
    it("calculates distance between AFI Cotroceni and Sun Plaza", () => {
      // AFI Palace Cotroceni (44.43225, 26.05384) to Sun Plaza (44.40345, 26.12456)
      const distance = calculateDistance(44.43225, 26.05384, 44.40345, 26.12456);
      // Expected: approximately 6-7 km
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(8);
    });

    it("calculates distance from user location to cinema", () => {
      // Sample user location in central Bucharest to ParkLake
      const distance = calculateDistance(44.4361, 26.1027, 44.47123, 26.15234);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10);
    });
  });

  describe("handles edge cases", () => {
    it("handles negative coordinates (southern/western hemisphere)", () => {
      // Sydney (-33.8688, 151.2093) to Melbourne (-37.8136, 144.9631)
      const distance = calculateDistance(
        -33.8688,
        151.2093,
        -37.8136,
        144.9631,
      );
      expect(distance).toBeGreaterThan(700);
      expect(distance).toBeLessThan(800);
    });

    it("handles coordinates crossing prime meridian", () => {
      // London (51.5074, -0.1278) to Paris (48.8566, 2.3522)
      const distance = calculateDistance(51.5074, -0.1278, 48.8566, 2.3522);
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(400);
    });

    it("handles coordinates crossing equator", () => {
      // Singapore (1.3521, 103.8198) to Jakarta (-6.2088, 106.8456)
      const distance = calculateDistance(1.3521, 103.8198, -6.2088, 106.8456);
      expect(distance).toBeGreaterThan(800);
      expect(distance).toBeLessThan(1000);
    });

    it("handles antipodal points correctly", () => {
      // Bucharest and its approximate antipode in Pacific Ocean
      const distance = calculateDistance(44.4268, 26.1025, -44.4268, -153.8975);
      // Should be close to half Earth's circumference (~20,000 km)
      expect(distance).toBeGreaterThan(19000);
      expect(distance).toBeLessThan(21000);
    });
  });

  describe("precision and rounding", () => {
    it("rounds to 1 decimal place", () => {
      const distance = calculateDistance(44.0, 26.0, 44.01, 26.01);
      // Result should have at most 1 decimal place
      expect(distance * 10).toBe(Math.round(distance * 10));
    });

    it("handles very small distances", () => {
      // Two points 10 meters apart (approximately)
      const distance = calculateDistance(44.4268, 26.1025, 44.42681, 26.10251);
      expect(distance).toBeGreaterThanOrEqual(0);
      expect(distance).toBeLessThan(1);
    });

    it("maintains accuracy for medium distances", () => {
      // 100km distance should be reasonably accurate
      const distance = calculateDistance(44.0, 26.0, 44.9, 26.0);
      expect(distance).toBeGreaterThan(90);
      expect(distance).toBeLessThan(110);
    });
  });

  describe("symmetry", () => {
    it("returns same distance regardless of point order", () => {
      const distance1 = calculateDistance(44.4268, 26.1025, 46.7712, 23.6236);
      const distance2 = calculateDistance(46.7712, 23.6236, 44.4268, 26.1025);
      expect(distance1).toBe(distance2);
    });
  });
});

describe("sortCinemasByDistance", () => {
  const createCinema = (
    id: number,
    name: string,
    latitude: number,
    longitude: number,
  ) => ({
    id,
    name,
    latitude,
    longitude,
  });

  describe("basic sorting", () => {
    it("sorts cinemas by distance from user location", () => {
      const cinemas = [
        createCinema(1, "Far Cinema", 46.7712, 23.6236), // Cluj-Napoca
        createCinema(2, "Near Cinema", 44.43, 26.06), // Close to user
        createCinema(3, "Medium Cinema", 45.0, 25.0), // Medium distance
      ];

      const userLat = 44.4268;
      const userLon = 26.1025;

      const sorted = sortCinemasByDistance(cinemas, userLat, userLon);

      expect(sorted[0]!.name).toBe("Near Cinema");
      expect(sorted[1]!.name).toBe("Medium Cinema");
      expect(sorted[2]!.name).toBe("Far Cinema");
    });

    it("includes distance in result", () => {
      const cinemas = [
        createCinema(1, "Cinema", 44.43225, 26.05384),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted[0]).toHaveProperty("distance");
      expect(sorted[0]!.distance).toBeGreaterThan(0);
    });

    it("preserves original cinema properties", () => {
      const cinemas = [
        createCinema(1, "Cinema 1", 44.43225, 26.05384),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted[0]!.id).toBe(1);
      expect(sorted[0]!.name).toBe("Cinema 1");
      expect(sorted[0]!.latitude).toBe(44.43225);
      expect(sorted[0]!.longitude).toBe(26.05384);
    });
  });

  describe("handles edge cases", () => {
    it("returns empty array for empty input", () => {
      const sorted = sortCinemasByDistance([], 44.4268, 26.1025);
      expect(sorted).toEqual([]);
    });

    it("returns single cinema unchanged", () => {
      const cinemas = [createCinema(1, "Cinema", 44.43, 26.06)];
      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted).toHaveLength(1);
      expect(sorted[0]!.id).toBe(1);
    });

    it("handles cinemas at same location", () => {
      const cinemas = [
        createCinema(1, "Cinema 1", 44.43, 26.06),
        createCinema(2, "Cinema 2", 44.43, 26.06),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted).toHaveLength(2);
      expect(sorted[0]!.distance).toBe(sorted[1]!.distance);
    });

    it("handles user at cinema location", () => {
      const cinemas = [
        createCinema(1, "Here", 44.4268, 26.1025),
        createCinema(2, "There", 45.0, 25.0),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted[0]!.distance).toBe(0);
      expect(sorted[1]!.distance).toBeGreaterThan(0);
    });
  });

  describe("sorting stability and order", () => {
    it("maintains stable sort for equal distances", () => {
      const cinemas = [
        createCinema(1, "Cinema A", 44.43, 26.06),
        createCinema(2, "Cinema B", 44.43, 26.06),
        createCinema(3, "Cinema C", 44.43, 26.06),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      // Should maintain original order when distances are equal
      expect(sorted[0]!.id).toBe(1);
      expect(sorted[1]!.id).toBe(2);
      expect(sorted[2]!.id).toBe(3);
    });

    it("sorts ascending (nearest first)", () => {
      const cinemas = [
        createCinema(1, "Far", 46.0, 24.0),
        createCinema(2, "Near", 44.43, 26.06),
        createCinema(3, "Medium", 45.0, 25.5),
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      // Distances should be in ascending order
      expect(sorted[0]!.distance).toBeLessThan(sorted[1]!.distance);
      expect(sorted[1]!.distance).toBeLessThan(sorted[2]!.distance);
    });
  });

  describe("works with extended cinema objects", () => {
    it("preserves additional properties", () => {
      const cinemas = [
        {
          id: 1,
          name: "Cinema City AFI",
          latitude: 44.43225,
          longitude: 26.05384,
          address: "Bd. Vasile Milea 4",
          bookingUrl: "https://example.com/booking/1",
        },
      ];

      const sorted = sortCinemasByDistance(cinemas, 44.4268, 26.1025);

      expect(sorted[0]!.address).toBe("Bd. Vasile Milea 4");
      expect(sorted[0]!.bookingUrl).toBe("https://example.com/booking/1");
      expect(sorted[0]!.distance).toBeGreaterThan(0);
    });
  });

  describe("real-world scenario", () => {
    it("sorts actual cinema locations correctly", () => {
      const cinemas = [
        createCinema(1, "AFI Palace Cotroceni", 44.43225, 26.05384),
        createCinema(2, "Sun Plaza", 44.40345, 26.12456),
        createCinema(3, "ParkLake", 44.47123, 26.15234),
      ];

      // User in central Bucharest
      const sorted = sortCinemasByDistance(cinemas, 44.4361, 26.1027);

      // Verify sorting order by checking distances are ascending
      expect(sorted[0]!.distance).toBeLessThan(sorted[1]!.distance);
      expect(sorted[1]!.distance).toBeLessThan(sorted[2]!.distance);

      // All distances should be reasonable (< 20km within city)
      sorted.forEach((cinema) => {
        expect(cinema.distance).toBeLessThan(20);
      });

      // The closest should be very close (within 10km)
      expect(sorted[0]!.distance).toBeLessThan(10);
    });
  });
});
