/**
 * Unit tests for convex/cinemas.ts
 *
 * Tests cover: createCinemas (upsert), getAllCinemas (limit/distance sorting),
 * getCinemaById, and getCinemasByMovieId.
 */
import { describe, test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10);

function makeCinema(overrides: Partial<{
  externalId: number;
  groupId: string;
  displayName: string;
  link: string;
  imageUrl: string;
  address: string;
  bookingUrl: string;
  blockOnlineSales: boolean;
  blockOnlineSalesUntil: number;
  latitude: number;
  longitude: number;
}> = {}) {
  return {
    externalId: 1,
    groupId: "GRP-1",
    displayName: "AFI Palace Cotroceni",
    link: "https://www.cinemacity.ro/cinemas/afi",
    imageUrl: "https://www.cinemacity.ro/images/afi.jpg",
    address: "Bd. Vasile Milea 4, București",
    bookingUrl: "https://www.cinemacity.ro/booking/1",
    blockOnlineSales: false,
    latitude: 44.43225,
    longitude: 26.05384,
    ...overrides,
  };
}

function makeEvent(overrides: Partial<{
  externalId: string;
  filmExternalId: string;
  cinemaExternalId: number;
  businessDay: string;
  eventDateTime: string;
  attributes: string[];
  bookingLink: string;
  presentationCode: string;
  soldOut: boolean;
  auditorium: string;
  auditoriumTinyName: string;
}> = {}) {
  return {
    externalId: "EVT-CIN-1",
    filmExternalId: "MOV-CIN-1",
    cinemaExternalId: 1,
    businessDay: TODAY,
    eventDateTime: `${TODAY}T18:00:00`,
    attributes: ["2D"],
    bookingLink: "https://cinemacity.ro/booking/1",
    presentationCode: "2D",
    soldOut: false,
    auditorium: "Sala 1",
    auditoriumTinyName: "S1",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createCinemas
// ---------------------------------------------------------------------------

describe("createCinemas", () => {
  test("inserts a new cinema and returns count=1", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 101 })],
    });

    expect(result.count).toBe(1);
  });

  test("upserting same externalId updates the record — count stays 0 on second call", async () => {
    const t = convexTest(schema);

    const first = await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 201, displayName: "Original Name" })],
    });
    expect(first.count).toBe(1);

    const second = await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 201, displayName: "Updated Name" })],
    });
    expect(second.count).toBe(0);

    // Verify the name was actually updated
    const stored = await t.query(api.cinemas.getCinemaById, { externalId: 201 });
    expect(stored?.displayName).toBe("Updated Name");
  });

  test("batch inserts multiple distinct cinemas — count equals total new cinemas", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 301, displayName: "Cinema A", groupId: "GA" }),
        makeCinema({ externalId: 302, displayName: "Cinema B", groupId: "GB" }),
        makeCinema({ externalId: 303, displayName: "Cinema C", groupId: "GC" }),
      ],
    });

    expect(result.count).toBe(3);
  });

  test("mixed batch: some new, some existing — count reflects only new inserts", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 401, groupId: "GA" })],
    });

    const result = await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 401, groupId: "GA" }), // existing
        makeCinema({ externalId: 402, displayName: "New Cinema", groupId: "GB" }), // new
      ],
    });

    expect(result.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getAllCinemas
// ---------------------------------------------------------------------------

describe("getAllCinemas", () => {
  test("returns all cinemas when no limit specified", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 501, displayName: "Cinema X", groupId: "GX" }),
        makeCinema({ externalId: 502, displayName: "Cinema Y", groupId: "GY" }),
        makeCinema({ externalId: 503, displayName: "Cinema Z", groupId: "GZ" }),
      ],
    });

    const cinemas = await t.query(api.cinemas.getAllCinemas, {});
    expect(cinemas.length).toBeGreaterThanOrEqual(3);
    const ids = cinemas.map((c) => c.externalId);
    expect(ids).toContain(501);
    expect(ids).toContain(502);
    expect(ids).toContain(503);
  });

  test("limit slices results to the specified number", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 601, displayName: "Limit Cinema 1", groupId: "GL1" }),
        makeCinema({ externalId: 602, displayName: "Limit Cinema 2", groupId: "GL2" }),
        makeCinema({ externalId: 603, displayName: "Limit Cinema 3", groupId: "GL3" }),
        makeCinema({ externalId: 604, displayName: "Limit Cinema 4", groupId: "GL4" }),
      ],
    });

    const cinemas = await t.query(api.cinemas.getAllCinemas, { limit: 2 });
    expect(cinemas).toHaveLength(2);
  });

  test("with userLat/userLon returns cinemas sorted by distance (nearest first)", async () => {
    const t = convexTest(schema);

    // Cinema near Bucharest city center: ~1 km from user
    // Cinema in Cluj-Napoca: ~400 km from user
    const userLat = 44.4268;   // Bucharest
    const userLon = 26.1025;

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({
          externalId: 701,
          displayName: "Far Cinema (Cluj)",
          groupId: "GFC",
          latitude: 46.7712,
          longitude: 23.6236,
        }),
        makeCinema({
          externalId: 702,
          displayName: "Near Cinema (Bucharest)",
          groupId: "GNC",
          latitude: 44.4268,
          longitude: 26.1025,
        }),
      ],
    });

    const cinemas = await t.query(api.cinemas.getAllCinemas, {
      userLat,
      userLon,
    });

    const ids = cinemas.map((c) => c.externalId);
    const nearIdx = ids.indexOf(702);
    const farIdx = ids.indexOf(701);

    expect(nearIdx).toBeLessThan(farIdx);
  });

  test("distance property is present when userLat/userLon provided", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 801, groupId: "GD" })],
    });

    const cinemas = await t.query(api.cinemas.getAllCinemas, {
      userLat: 44.4268,
      userLon: 26.1025,
    });

    expect(cinemas.length).toBeGreaterThan(0);
    // distance property should be added by sortCinemasByDistance
    expect((cinemas[0] as { distance?: number }).distance).toBeDefined();
    expect(typeof (cinemas[0] as { distance?: number }).distance).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// getCinemaById
// ---------------------------------------------------------------------------

describe("getCinemaById", () => {
  test("returns the cinema when found by externalId", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 901, displayName: "Found Cinema", groupId: "GF" })],
    });

    const cinema = await t.query(api.cinemas.getCinemaById, { externalId: 901 });
    expect(cinema).not.toBeNull();
    expect(cinema?.displayName).toBe("Found Cinema");
    expect(cinema?.externalId).toBe(901);
  });

  test("returns null when externalId does not exist", async () => {
    const t = convexTest(schema);

    const cinema = await t.query(api.cinemas.getCinemaById, { externalId: 99999 });
    expect(cinema).toBeNull();
  });

  test("returns the correct cinema among multiple cinemas", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 1001, displayName: "Alpha", groupId: "GA" }),
        makeCinema({ externalId: 1002, displayName: "Beta", groupId: "GB" }),
        makeCinema({ externalId: 1003, displayName: "Gamma", groupId: "GC" }),
      ],
    });

    const cinema = await t.query(api.cinemas.getCinemaById, { externalId: 1002 });
    expect(cinema?.displayName).toBe("Beta");
  });
});

// ---------------------------------------------------------------------------
// getCinemasByMovieId
// ---------------------------------------------------------------------------

describe("getCinemasByMovieId", () => {
  test("returns cinemas that have events for the given movie", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 2001, displayName: "Has Event Cinema", groupId: "GHE" }),
        makeCinema({ externalId: 2002, displayName: "No Event Cinema", groupId: "GNE" }),
      ],
    });

    await t.run(async (ctx) => {
      // Only cinema 2001 has an event for the target movie
      await ctx.db.insert("movieEvents", makeEvent({
        externalId: "EVT-MOV-A",
        filmExternalId: "TARGET-MOV",
        cinemaExternalId: 2001,
        businessDay: TODAY,
      }));
    });

    const cinemas = await t.query(api.cinemas.getCinemasByMovieId, {
      movieExternalId: "TARGET-MOV",
    });

    const ids = cinemas.map((c) => c.externalId);
    expect(ids).toContain(2001);
    expect(ids).not.toContain(2002);
  });

  test("excludes cinemas with no events for that movie", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({ externalId: 2101, displayName: "Cinema Shows Other", groupId: "GOS" }),
      ],
    });

    await t.run(async (ctx) => {
      // Cinema 2101 only shows a different movie
      await ctx.db.insert("movieEvents", makeEvent({
        externalId: "EVT-OTHER",
        filmExternalId: "OTHER-MOVIE",
        cinemaExternalId: 2101,
        businessDay: TODAY,
      }));
    });

    const cinemas = await t.query(api.cinemas.getCinemasByMovieId, {
      movieExternalId: "TARGET-MOV-2",
    });

    expect(cinemas).toHaveLength(0);
  });

  test("each cinema is returned only once even with multiple events", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 2201, displayName: "Multi-Event Cinema", groupId: "GME" })],
    });

    await t.run(async (ctx) => {
      // Insert 3 events for same cinema and same movie
      for (let i = 0; i < 3; i++) {
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-MULTI-${i}`,
          filmExternalId: "REPEAT-MOV",
          cinemaExternalId: 2201,
          businessDay: TODAY,
          eventDateTime: `${TODAY}T${(10 + i * 3).toString().padStart(2, "0")}:00:00`,
        }));
      }
    });

    const cinemas = await t.query(api.cinemas.getCinemasByMovieId, {
      movieExternalId: "REPEAT-MOV",
    });

    const ids = cinemas.map((c) => c.externalId);
    // Should appear only once despite 3 events
    expect(ids.filter((id) => id === 2201)).toHaveLength(1);
  });

  test("returns empty array when movie has no events at all", async () => {
    const t = convexTest(schema);

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [makeCinema({ externalId: 2301, groupId: "GNA" })],
    });

    const cinemas = await t.query(api.cinemas.getCinemasByMovieId, {
      movieExternalId: "NO-EVENTS-MOV",
    });

    expect(cinemas).toHaveLength(0);
  });

  test("with userLat/userLon returns cinemas sorted nearest first", async () => {
    const t = convexTest(schema);

    // User near Bucharest
    const userLat = 44.4268;
    const userLon = 26.1025;

    await t.mutation(api.cinemas.createCinemas, {
      cinemas: [
        makeCinema({
          externalId: 2401,
          displayName: "Far Cinema",
          groupId: "GFR",
          latitude: 46.7712,
          longitude: 23.6236, // Cluj
        }),
        makeCinema({
          externalId: 2402,
          displayName: "Near Cinema",
          groupId: "GNR",
          latitude: 44.4268,
          longitude: 26.1025, // Same coords as user
        }),
      ],
    });

    await t.run(async (ctx) => {
      for (const [i, cinemaId] of [2401, 2402].entries()) {
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-DIST-${i}`,
          filmExternalId: "DIST-MOV",
          cinemaExternalId: cinemaId,
          businessDay: TODAY,
        }));
      }
    });

    const cinemas = await t.query(api.cinemas.getCinemasByMovieId, {
      movieExternalId: "DIST-MOV",
      userLat,
      userLon,
    });

    const ids = cinemas.map((c) => c.externalId);
    const nearIdx = ids.indexOf(2402);
    const farIdx = ids.indexOf(2401);

    expect(nearIdx).toBeLessThan(farIdx);
  });
});
