/**
 * MovieEvent queries and mutations for Convex
 *
 * This file replaces src/server/api/routers/movieEvent.ts
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { DateTime } from "luxon";

// Schema for movie event creation
const movieEventSchema = v.object({
  externalId: v.string(),
  filmExternalId: v.string(),
  cinemaExternalId: v.number(),
  businessDay: v.string(),
  eventDateTime: v.string(),
  attributes: v.array(v.string()),
  bookingLink: v.string(),
  secondaryBookingLink: v.optional(v.string()),
  presentationCode: v.string(),
  soldOut: v.boolean(),
  auditorium: v.string(),
  auditoriumTinyName: v.string(),
});

/**
 * Create multiple movie events (upsert operation)
 * Replaces: movieEventRouter.create
 */
export const createMovieEvents = mutation({
  args: {
    events: v.array(movieEventSchema),
  },
  handler: async (ctx, { events }) => {
    let count = 0;
    for (const event of events) {
      const existing = await ctx.db
        .query("movieEvents")
        .withIndex("by_externalId", (q) => q.eq("externalId", event.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, event);
      } else {
        await ctx.db.insert("movieEvents", event);
        count++;
      }
    }
    return { count };
  },
});

/**
 * Get events by cinema and movie ID (for showtimes page)
 * Replaces: movieEventRouter.getByCinemaIdAndMovieId
 */
export const getEventsByCinemaAndMovie = query({
  args: {
    cinemaExternalId: v.optional(v.number()),
    movieExternalId: v.string(),
  },
  handler: async (ctx, { cinemaExternalId, movieExternalId }) => {
    const today = DateTime.now().toFormat("yyyy-MM-dd");

    let events = await ctx.db
      .query("movieEvents")
      .withIndex("by_filmExternalId", (q) =>
        q.eq("filmExternalId", movieExternalId),
      )
      .filter((q) => q.gte(q.field("businessDay"), today))
      .collect();

    if (cinemaExternalId !== undefined) {
      events = events.filter((e) => e.cinemaExternalId === cinemaExternalId);
    }

    // Fetch cinema data for each event
    const eventsWithCinema = await Promise.all(
      events.map(async (event) => {
        const cinema = await ctx.db
          .query("cinemas")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", event.cinemaExternalId),
          )
          .first();
        return { ...event, Cinema: cinema };
      }),
    );

    return eventsWithCinema;
  },
});

/**
 * Get today's events for a specific cinema
 * Replaces: movieEventRouter.getByCinemaIdToday
 */
export const getEventsByCinemaToday = query({
  args: { cinemaExternalId: v.number() },
  handler: async (ctx, { cinemaExternalId }) => {
    const today = DateTime.now().toFormat("yyyy-MM-dd");

    const events = await ctx.db
      .query("movieEvents")
      .withIndex("by_businessDay_and_cinema", (q) =>
        q.eq("businessDay", today).eq("cinemaExternalId", cinemaExternalId),
      )
      .collect();

    // Sort by event time
    events.sort((a, b) => a.eventDateTime.localeCompare(b.eventDateTime));

    // Fetch movie data for each event
    const eventsWithMovie = await Promise.all(
      events.map(async (event) => {
        const movie = await ctx.db
          .query("movies")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", event.filmExternalId),
          )
          .first();
        return { ...event, Movie: movie };
      }),
    );

    return eventsWithMovie;
  },
});
