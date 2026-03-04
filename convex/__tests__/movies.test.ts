/**
 * Unit tests for convex/movies.ts
 *
 * Tests cover: createMovies (upsert), getAllMovies (filtering/deduplication/pagination),
 * searchMovies (multi-word, case-insensitive), and getMovieById.
 */
import { describe, test, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../schema";
import { api } from "../_generated/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

/** Minimal valid movie object that passes the createMovies validator. */
function makeMovieInput(overrides: Partial<{
  externalId: string;
  name: string;
  length: number;
  posterLink: string;
  videoLink: string;
  link: string;
  weight: number;
  releaseYear: string;
  releaseDate: string;
  attributeIds: string[];
}> = {}) {
  return {
    externalId: "MOV-TEST-1",
    name: "Test Movie",
    length: 120,
    posterLink: "https://image.tmdb.org/t/p/w500/poster.jpg",
    link: "https://cinemacity.ro/movies/test",
    weight: 100,
    releaseDate: YESTERDAY,
    attributeIds: ["Action"],
    ...overrides,
  };
}

/** Full movie row inserted directly via ctx.db (supports all schema fields). */
function makeMovieRow(overrides: Partial<{
  externalId: string;
  name: string;
  length: number;
  posterLink: string;
  videoLink: string;
  link: string;
  weight: number;
  releaseYear: string;
  releaseDate: string;
  attributeIds: string[];
  description: string;
  tmdbPopularity: number;
  imdbId: string;
}> = {}) {
  return {
    externalId: "MOV-TEST-1",
    name: "Test Movie",
    length: 120,
    posterLink: "https://image.tmdb.org/t/p/w500/poster.jpg",
    link: "https://cinemacity.ro/movies/test",
    weight: 100,
    releaseDate: YESTERDAY,
    attributeIds: ["Action"],
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
    externalId: "EVENT-TEST-1",
    filmExternalId: "MOV-TEST-1",
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
// createMovies
// ---------------------------------------------------------------------------

describe("createMovies", () => {
  test("inserts a new movie and returns count=1", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.movies.createMovies, {
      movies: [makeMovieInput({ externalId: "MOV-NEW" })],
    });

    expect(result.count).toBe(1);
  });

  test("upserting same externalId updates the record — count stays 0 on second call", async () => {
    const t = convexTest(schema);

    const first = await t.mutation(api.movies.createMovies, {
      movies: [makeMovieInput({ externalId: "MOV-UPSERT", name: "Original Name" })],
    });
    expect(first.count).toBe(1);

    const second = await t.mutation(api.movies.createMovies, {
      movies: [makeMovieInput({ externalId: "MOV-UPSERT", name: "Updated Name" })],
    });
    expect(second.count).toBe(0);

    // Verify the name was actually updated
    const stored = await t.query(api.movies.getMovieById, {
      externalId: "MOV-UPSERT",
    });
    expect(stored?.name).toBe("Updated Name");
  });

  test("batch inserts multiple distinct movies — count equals number of new movies", async () => {
    const t = convexTest(schema);

    const result = await t.mutation(api.movies.createMovies, {
      movies: [
        makeMovieInput({ externalId: "BATCH-1", name: "Batch Movie A" }),
        makeMovieInput({ externalId: "BATCH-2", name: "Batch Movie B" }),
        makeMovieInput({ externalId: "BATCH-3", name: "Batch Movie C" }),
      ],
    });

    expect(result.count).toBe(3);
  });

  test("mixed batch: some new, some existing — count reflects only new inserts", async () => {
    const t = convexTest(schema);

    await t.mutation(api.movies.createMovies, {
      movies: [makeMovieInput({ externalId: "EXISTING-1" })],
    });

    const result = await t.mutation(api.movies.createMovies, {
      movies: [
        makeMovieInput({ externalId: "EXISTING-1" }), // existing
        makeMovieInput({ externalId: "NEW-1" }),        // new
      ],
    });

    expect(result.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getAllMovies
// ---------------------------------------------------------------------------

describe("getAllMovies", () => {
  test("returns only movies that have events from today onwards", async () => {
    const t = convexTest(schema);

    // Insert movies and events directly — MOV-A has a future event, MOV-B only past
    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "MOV-A", name: "Has Future Event" }));
      await ctx.db.insert("movies", makeMovieRow({ externalId: "MOV-B", name: "No Future Event" }));

      await ctx.db.insert("movieEvents", makeEvent({
        externalId: "EVT-A",
        filmExternalId: "MOV-A",
        businessDay: TODAY,
      }));
      await ctx.db.insert("movieEvents", makeEvent({
        externalId: "EVT-B",
        filmExternalId: "MOV-B",
        businessDay: YESTERDAY,
      }));
    });

    const movies = await t.query(api.movies.getAllMovies, {});
    const names = movies.map((m) => m.name);

    expect(names).toContain("Has Future Event");
    expect(names).not.toContain("No Future Event");
  });

  test("movies without any events are excluded", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "MOV-NO-EVENTS", name: "No Events" }));
    });

    const movies = await t.query(api.movies.getAllMovies, {});
    expect(movies.map((m) => m.externalId)).not.toContain("MOV-NO-EVENTS");
  });

  test("orderByPopularity desc sorts movies highest-first", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-LOW", name: "Low Popularity", tmdbPopularity: 10,
      }));
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-HIGH", name: "High Popularity", tmdbPopularity: 99,
      }));
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-MID", name: "Mid Popularity", tmdbPopularity: 50,
      }));

      for (const [idx, id] of ["MOV-LOW", "MOV-HIGH", "MOV-MID"].entries()) {
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-POP-${idx}`,
          filmExternalId: id,
          businessDay: TODAY,
        }));
      }
    });

    const movies = await t.query(api.movies.getAllMovies, {
      orderByPopularity: "desc",
    });

    const popularities = movies.map((m) => m.tmdbPopularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeLessThanOrEqual(popularities[i - 1]);
    }
  });

  test("orderByPopularity asc sorts movies lowest-first", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-A1", name: "Alpha One", tmdbPopularity: 30,
      }));
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-A2", name: "Alpha Two", tmdbPopularity: 80,
      }));

      for (const [idx, id] of ["MOV-A1", "MOV-A2"].entries()) {
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-ASC-${idx}`,
          filmExternalId: id,
          businessDay: TODAY,
        }));
      }
    });

    const movies = await t.query(api.movies.getAllMovies, {
      orderByPopularity: "asc",
    });

    const popularities = movies.map((m) => m.tmdbPopularity ?? 0);
    for (let i = 1; i < popularities.length; i++) {
      expect(popularities[i]).toBeGreaterThanOrEqual(popularities[i - 1]);
    }
  });

  test("offset and limit paginate correctly", async () => {
    const t = convexTest(schema);

    const movieIds = ["MOV-P1", "MOV-P2", "MOV-P3", "MOV-P4", "MOV-P5"];
    await t.run(async (ctx) => {
      for (const [i, id] of movieIds.entries()) {
        await ctx.db.insert("movies", makeMovieRow({
          externalId: id,
          name: `Page Movie ${i + 1}`,
          tmdbPopularity: (i + 1) * 10,
        }));
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-PAGE-${i}`,
          filmExternalId: id,
          businessDay: TODAY,
        }));
      }
    });

    const page1 = await t.query(api.movies.getAllMovies, {
      orderByPopularity: "desc",
      limit: 2,
      offset: 0,
    });
    const page2 = await t.query(api.movies.getAllMovies, {
      orderByPopularity: "desc",
      limit: 2,
      offset: 2,
    });

    expect(page1).toHaveLength(2);
    expect(page2).toHaveLength(2);

    // Pages should not overlap
    const page1Ids = page1.map((m) => m.externalId);
    const page2Ids = page2.map((m) => m.externalId);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap).toHaveLength(0);
  });

  test("deduplication removes language-suffixed duplicate when original exists", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-AVATAR",
        name: "Avatar",
        tmdbPopularity: 90,
        posterLink: "https://image.tmdb.org/t/p/w500/avatar.jpg",
      }));
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "MOV-AVATAR-DUB",
        name: "Avatar Hu dub",
        tmdbPopularity: 20,
        posterLink: "https://image.tmdb.org/t/p/w500/avatar_dub.jpg",
      }));

      for (const [idx, id] of ["MOV-AVATAR", "MOV-AVATAR-DUB"].entries()) {
        await ctx.db.insert("movieEvents", makeEvent({
          externalId: `EVT-DUP-${idx}`,
          filmExternalId: id,
          businessDay: TODAY,
        }));
      }
    });

    const movies = await t.query(api.movies.getAllMovies, {});

    // Only one entry for "Avatar" (deduplicated)
    const avatarMovies = movies.filter(
      (m) => m.name === "Avatar" || m.name === "Avatar Hu dub",
    );
    expect(avatarMovies).toHaveLength(1);
    // The higher-popularity version should be kept
    expect(avatarMovies[0].tmdbPopularity).toBe(90);
  });
});

// ---------------------------------------------------------------------------
// searchMovies
// ---------------------------------------------------------------------------

describe("searchMovies", () => {
  test("single word match returns matching movies", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-1", name: "The Adventures of ChatGPT" }));
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-2", name: "Debugging Wars" }));
    });

    const results = await t.query(api.movies.searchMovies, { searchTerm: "Adventures" });
    expect(results.map((m) => m.externalId)).toContain("S-MOV-1");
    expect(results.map((m) => m.externalId)).not.toContain("S-MOV-2");
  });

  test("multi-word search: 'The Adventures' matches titles containing all words", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-3", name: "The Adventures of ChatGPT" }));
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-4", name: "Adventures Without The Prequel" }));
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-5", name: "Something Else" }));
    });

    const results = await t.query(api.movies.searchMovies, { searchTerm: "The Adventures" });
    const ids = results.map((m) => m.externalId);

    expect(ids).toContain("S-MOV-3"); // has both "The" and "Adventures"
    expect(ids).toContain("S-MOV-4"); // has both words (any order)
    expect(ids).not.toContain("S-MOV-5"); // has neither
  });

  test("search is case-insensitive", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-6", name: "TypeScript Supremacy" }));
    });

    const lower = await t.query(api.movies.searchMovies, { searchTerm: "typescript" });
    const upper = await t.query(api.movies.searchMovies, { searchTerm: "TYPESCRIPT" });
    const mixed = await t.query(api.movies.searchMovies, { searchTerm: "TypeScript" });

    for (const results of [lower, upper, mixed]) {
      expect(results.map((m) => m.externalId)).toContain("S-MOV-6");
    }
  });

  test("empty string returns empty array", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-7", name: "Some Movie" }));
    });

    const results = await t.query(api.movies.searchMovies, { searchTerm: "" });
    expect(results).toEqual([]);
  });

  test("whitespace-only string returns empty array", async () => {
    const t = convexTest(schema);

    const results = await t.query(api.movies.searchMovies, { searchTerm: "   " });
    expect(results).toEqual([]);
  });

  test("word not present in any movie name returns empty array", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({ externalId: "S-MOV-8", name: "React Adventures" }));
    });

    const results = await t.query(api.movies.searchMovies, { searchTerm: "zzznomatch" });
    expect(results).toEqual([]);
  });

  test("special characters in search term do not crash the function", async () => {
    const t = convexTest(schema);

    await expect(
      t.query(api.movies.searchMovies, { searchTerm: "he[llo" }),
    ).resolves.toBeDefined();

    await expect(
      t.query(api.movies.searchMovies, { searchTerm: "test.*movie" }),
    ).resolves.toBeDefined();
  });

  test("search deduplicates results when dub/non-dub variants both match", async () => {
    const t = convexTest(schema);

    await t.run(async (ctx) => {
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "S-DUP-1",
        name: "Frozen",
        tmdbPopularity: 80,
        posterLink: "https://image.tmdb.org/t/p/w500/frozen.jpg",
      }));
      await ctx.db.insert("movies", makeMovieRow({
        externalId: "S-DUP-2",
        name: "Frozen Hu dub",
        tmdbPopularity: 10,
        posterLink: "https://image.tmdb.org/t/p/w500/frozen_dub.jpg",
      }));
    });

    const results = await t.query(api.movies.searchMovies, { searchTerm: "Frozen" });
    // deduplicateMovies should collapse these two into one
    const frozenResults = results.filter(
      (m) => m.name === "Frozen" || m.name === "Frozen Hu dub",
    );
    expect(frozenResults).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getMovieById
// ---------------------------------------------------------------------------

describe("getMovieById", () => {
  test("returns the movie when found by externalId", async () => {
    const t = convexTest(schema);

    await t.mutation(api.movies.createMovies, {
      movies: [makeMovieInput({ externalId: "FIND-ME", name: "The Found Movie" })],
    });

    const movie = await t.query(api.movies.getMovieById, { externalId: "FIND-ME" });
    expect(movie).not.toBeNull();
    expect(movie?.name).toBe("The Found Movie");
    expect(movie?.externalId).toBe("FIND-ME");
  });

  test("returns null when externalId does not exist", async () => {
    const t = convexTest(schema);

    const movie = await t.query(api.movies.getMovieById, {
      externalId: "DOES-NOT-EXIST",
    });
    expect(movie).toBeNull();
  });

  test("returns the correct movie when multiple movies exist", async () => {
    const t = convexTest(schema);

    await t.mutation(api.movies.createMovies, {
      movies: [
        makeMovieInput({ externalId: "MULTI-A", name: "Movie A" }),
        makeMovieInput({ externalId: "MULTI-B", name: "Movie B" }),
        makeMovieInput({ externalId: "MULTI-C", name: "Movie C" }),
      ],
    });

    const movieB = await t.query(api.movies.getMovieById, { externalId: "MULTI-B" });
    expect(movieB?.name).toBe("Movie B");
    expect(movieB?.externalId).toBe("MULTI-B");
  });
});
