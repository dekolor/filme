/**
 * Dashboard aggregation query for Convex
 *
 * This file replaces src/server/api/routers/dashboard.ts
 */

import { query } from "./_generated/server";
import { deduplicateMovies } from "./lib/movieUtils";

const DASHBOARD_LIMITS = {
  MOVIES: 4,
  UPCOMING_MOVIES: 4,
  CINEMAS: 20,
} as const;

/**
 * Get all dashboard data in a single query
 * Replaces: dashboardRouter.getData
 */
export const getDashboardData = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString().slice(0, 10);

    // Get all movies
    const allMovies = await ctx.db.query("movies").collect();

    // Get events for filtering
    const futureEvents = await ctx.db
      .query("movieEvents")
      .withIndex("by_businessDay", (q) => q.gte("businessDay", now))
      .collect();

    const movieExternalIdsWithEvents = new Set(
      futureEvents.map((e) => e.filmExternalId),
    );

    // Featured movie: most popular with description and current events
    const featuredMovie = allMovies
      .filter(
        (m) =>
          m.description !== undefined &&
          m.releaseDate <= now &&
          movieExternalIdsWithEvents.has(m.externalId),
      )
      .sort((a, b) => (b.tmdbPopularity ?? 0) - (a.tmdbPopularity ?? 0))[0];

    // Current movies
    const currentMoviesRaw = allMovies
      .filter(
        (m) => m.releaseDate <= now && movieExternalIdsWithEvents.has(m.externalId),
      )
      .sort((a, b) => (b.tmdbPopularity ?? 0) - (a.tmdbPopularity ?? 0))
      .slice(0, DASHBOARD_LIMITS.MOVIES * 2);

    const currentMovies = deduplicateMovies(currentMoviesRaw).slice(
      0,
      DASHBOARD_LIMITS.MOVIES,
    );

    // Upcoming movies
    const upcomingMoviesRaw = allMovies
      .filter((m) => m.releaseDate > now)
      .sort((a, b) => (b.tmdbPopularity ?? 0) - (a.tmdbPopularity ?? 0))
      .slice(0, DASHBOARD_LIMITS.UPCOMING_MOVIES * 2);

    const upcomingMovies = deduplicateMovies(upcomingMoviesRaw).slice(
      0,
      DASHBOARD_LIMITS.UPCOMING_MOVIES,
    );

    // Cinemas
    const allCinemas = await ctx.db.query("cinemas").collect();

    const cinemas = allCinemas
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, DASHBOARD_LIMITS.CINEMAS)
      .map((c) => ({
        _id: c._id,
        externalId: c.externalId,
        displayName: c.displayName,
        imageUrl: c.imageUrl,
      }));

    return {
      featuredMovie,
      movies: currentMovies,
      upcomingMovies,
      cinemas,
    };
  },
});
