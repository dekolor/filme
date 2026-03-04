/**
 * Cinema queries and mutations for Convex
 *
 * This file replaces src/server/api/routers/cinema.ts
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { sortCinemasByDistance } from "./lib/distance";

// Schema for cinema creation
const cinemaSchema = v.object({
  externalId: v.number(),
  groupId: v.string(),
  displayName: v.string(),
  link: v.string(),
  imageUrl: v.string(),
  address: v.string(),
  bookingUrl: v.optional(v.string()),
  blockOnlineSales: v.boolean(),
  blockOnlineSalesUntil: v.optional(v.number()),
  latitude: v.float64(),
  longitude: v.float64(),
});

/**
 * Create multiple cinemas (upsert operation)
 * Replaces: cinemaRouter.create
 */
export const createCinemas = mutation({
  args: {
    cinemas: v.array(cinemaSchema),
  },
  handler: async (ctx, { cinemas }) => {
    let count = 0;
    for (const cinema of cinemas) {
      // Upsert: check if exists by externalId
      const existing = await ctx.db
        .query("cinemas")
        .withIndex("by_externalId", (q) => q.eq("externalId", cinema.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, cinema);
      } else {
        await ctx.db.insert("cinemas", cinema);
        count++;
      }
    }
    return { count };
  },
});

/**
 * Get all cinemas with optional limit and distance sorting
 * Replaces: cinemaRouter.getAll
 */
export const getAllCinemas = query({
  args: {
    limit: v.optional(v.number()),
    userLat: v.optional(v.float64()),
    userLon: v.optional(v.float64()),
  },
  handler: async (ctx, { limit, userLat, userLon }) => {
    let cinemas = await ctx.db.query("cinemas").collect();

    if (limit) {
      cinemas = cinemas.slice(0, limit);
    }

    // Sort by distance if user location provided
    if (userLat !== undefined && userLon !== undefined) {
      return sortCinemasByDistance(cinemas, userLat, userLon);
    }

    return cinemas;
  },
});

/**
 * Get a single cinema by its external ID
 * Replaces: cinemaRouter.getById
 */
export const getCinemaById = query({
  args: { externalId: v.number() },
  handler: async (ctx, { externalId }) => {
    return await ctx.db
      .query("cinemas")
      .withIndex("by_externalId", (q) => q.eq("externalId", externalId))
      .first();
  },
});

/**
 * Get cinemas showing a specific movie
 * Replaces: cinemaRouter.getByMovieId
 */
export const getCinemasByMovieId = query({
  args: {
    movieExternalId: v.string(),
    userLat: v.optional(v.float64()),
    userLon: v.optional(v.float64()),
  },
  handler: async (ctx, { movieExternalId, userLat, userLon }) => {
    // Find all events for this movie
    const events = await ctx.db
      .query("movieEvents")
      .withIndex("by_filmExternalId", (q) =>
        q.eq("filmExternalId", movieExternalId),
      )
      .collect();

    // Get unique cinema external IDs
    const cinemaExternalIds = [
      ...new Set(events.map((e) => e.cinemaExternalId)),
    ];

    // Fetch cinemas
    const cinemas = (
      await Promise.all(
        cinemaExternalIds.map((id) =>
          ctx.db
            .query("cinemas")
            .withIndex("by_externalId", (q) => q.eq("externalId", id))
            .first(),
        ),
      )
    ).filter((c) => c !== null);

    // Sort by distance if user location provided
    if (userLat !== undefined && userLon !== undefined) {
      return sortCinemasByDistance(cinemas, userLat, userLon);
    }

    return cinemas;
  },
});
