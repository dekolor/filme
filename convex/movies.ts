/**
 * Movie queries and mutations for Convex
 *
 * This file replaces src/server/api/routers/movie.ts
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { deduplicateMovies } from "./lib/movieUtils";

// Schema for movie creation
const movieSchema = v.object({
  externalId: v.string(),
  name: v.string(),
  length: v.number(),
  posterLink: v.string(),
  videoLink: v.optional(v.string()),
  link: v.string(),
  weight: v.number(),
  releaseYear: v.optional(v.string()),
  releaseDate: v.string(),
  attributeIds: v.array(v.string()),
});

/**
 * Create multiple movies (upsert operation)
 * Replaces: movieRouter.create
 */
export const createMovies = mutation({
  args: {
    movies: v.array(movieSchema),
  },
  handler: async (ctx, { movies }) => {
    let count = 0;
    for (const movie of movies) {
      const existing = await ctx.db
        .query("movies")
        .withIndex("by_externalId", (q) => q.eq("externalId", movie.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, movie);
      } else {
        await ctx.db.insert("movies", movie);
        count++;
      }
    }
    return { count };
  },
});

/**
 * Get all movies with current/future events
 * Replaces: movieRouter.getAll
 */
export const getAllMovies = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    orderByPopularity: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    hasDescription: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    // Get all events from today onwards
    const events = await ctx.db
      .query("movieEvents")
      .withIndex("by_businessDay", (q) => q.gte("businessDay", today))
      .collect();

    const movieExternalIds = new Set(events.map((e) => e.filmExternalId));

    // Fetch movies
    let movies = await ctx.db.query("movies").collect();
    movies = movies.filter((m) => movieExternalIds.has(m.externalId));

    // Filter by description if needed
    if (args.hasDescription) {
      movies = movies.filter((m) => m.description !== undefined);
    }

    // Sort by popularity
    if (args.orderByPopularity) {
      movies.sort((a, b) => {
        const aVal = a.tmdbPopularity ?? 0;
        const bVal = b.tmdbPopularity ?? 0;
        return args.orderByPopularity === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    // Fetch more for deduplication (2x)
    const fetchLimit = args.limit ? args.limit * 2 : movies.length;
    const sliced = movies.slice(args.offset ?? 0, (args.offset ?? 0) + fetchLimit);

    // Deduplicate
    const deduplicated = deduplicateMovies(sliced);

    return args.limit ? deduplicated.slice(0, args.limit) : deduplicated;
  },
});

/**
 * Get all upcoming movies (future releases)
 * Replaces: movieRouter.getAllUpcoming
 */
export const getAllUpcomingMovies = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    orderByPopularity: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    const movies = await ctx.db
      .query("movies")
      .filter((q) => q.gt(q.field("releaseDate"), today))
      .collect();

    // Sort by popularity
    if (args.orderByPopularity) {
      movies.sort((a, b) => {
        const aVal = a.tmdbPopularity ?? 0;
        const bVal = b.tmdbPopularity ?? 0;
        return args.orderByPopularity === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    const fetchLimit = args.limit ? args.limit * 2 : movies.length;
    const sliced = movies.slice(args.offset ?? 0, (args.offset ?? 0) + fetchLimit);

    const deduplicated = deduplicateMovies(sliced);

    return args.limit ? deduplicated.slice(0, args.limit) : deduplicated;
  },
});

/**
 * Get a single movie by its external ID
 * Replaces: movieRouter.getById
 */
export const getMovieById = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    return await ctx.db
      .query("movies")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();
  },
});

/**
 * Search movies by name
 * Replaces: movieRouter.search
 *
 * Note: Convex doesn't have built-in full-text search,
 * so we fetch all movies and filter in-memory.
 * This is acceptable for <10k movies.
 */
export const searchMovies = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const sanitized = searchTerm.trim().slice(0, 100);
    const searchWords = sanitized.split(/\s+/).filter((w) => w.length > 0);

    if (searchWords.length === 0) return [];
    if (searchWords.length > 10) {
      throw new Error("Too many search terms (max 10)");
    }

    // Convex doesn't have full-text search, so we fetch all and filter
    const allMovies = await ctx.db.query("movies").collect();

    // Multi-word case-insensitive search
    const filtered = allMovies.filter((movie) => {
      const nameLower = movie.name.toLowerCase();
      return searchWords.every((word) => nameLower.includes(word.toLowerCase()));
    });

    return deduplicateMovies(filtered);
  },
});

/**
 * Update a movie with TMDB data
 * Internal mutation used by data fetcher
 */
export const updateMovieWithTMDB = mutation({
  args: {
    externalId: v.string(),
    imdbId: v.optional(v.string()),
    description: v.optional(v.string()),
    tmdbPopularity: v.optional(v.float64()),
    posterLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const movie = await ctx.db
      .query("movies")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (movie) {
      const updateData: {
        imdbId?: string;
        description?: string;
        tmdbPopularity?: number;
        posterLink?: string;
      } = {};
      if (args.imdbId !== undefined) updateData.imdbId = args.imdbId;
      if (args.description !== undefined) updateData.description = args.description;
      if (args.tmdbPopularity !== undefined)
        updateData.tmdbPopularity = args.tmdbPopularity;
      if (args.posterLink !== undefined) updateData.posterLink = args.posterLink;

      await ctx.db.patch(movie._id, updateData);
    }
  },
});
