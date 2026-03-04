/**
 * Import data from PostgreSQL export into Convex
 *
 * This is a one-time migration mutation to import data from the
 * convex-migration-data.json file created by scripts/export-to-convex.ts
 *
 * Usage: npx convex run importData:importFromPostgres
 */

import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Schema for imported data
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
  imdbId: v.optional(v.string()),
  description: v.optional(v.string()),
  tmdbPopularity: v.optional(v.float64()),
});

const eventSchema = v.object({
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
 * Import all data from PostgreSQL export
 *
 * This mutation should be run manually after exporting data:
 * 1. Run: npx tsx scripts/export-to-convex.ts
 * 2. Run: npx convex run importData:importFromPostgres --data "$(cat convex-migration-data.json)"
 */
export const importFromPostgres = mutation({
  args: {
    data: v.object({
      cinemas: v.array(cinemaSchema),
      movies: v.array(movieSchema),
      events: v.array(eventSchema),
    }),
  },
  handler: async (ctx, { data }) => {
    console.log("Starting data import...");
    console.log(`  Cinemas to import: ${data.cinemas.length}`);
    console.log(`  Movies to import: ${data.movies.length}`);
    console.log(`  Events to import: ${data.events.length}`);

    // Import cinemas
    let cinemasImported = 0;
    for (const cinema of data.cinemas) {
      // Check if cinema already exists
      const existing = await ctx.db
        .query("cinemas")
        .withIndex("by_externalId", (q) =>
          q.eq("externalId", cinema.externalId),
        )
        .first();

      if (!existing) {
        await ctx.db.insert("cinemas", cinema);
        cinemasImported++;
      }
    }
    console.log(`  ✅ Imported ${cinemasImported} new cinemas`);

    // Import movies
    let moviesImported = 0;
    for (const movie of data.movies) {
      const existing = await ctx.db
        .query("movies")
        .withIndex("by_externalId", (q) => q.eq("externalId", movie.externalId))
        .first();

      if (!existing) {
        await ctx.db.insert("movies", movie);
        moviesImported++;
      }
    }
    console.log(`  ✅ Imported ${moviesImported} new movies`);

    // Import events in batches
    let eventsImported = 0;
    const batchSize = 100;
    for (let i = 0; i < data.events.length; i += batchSize) {
      const batch = data.events.slice(i, i + batchSize);

      for (const event of batch) {
        const existing = await ctx.db
          .query("movieEvents")
          .withIndex("by_externalId", (q) =>
            q.eq("externalId", event.externalId),
          )
          .first();

        if (!existing) {
          await ctx.db.insert("movieEvents", event);
          eventsImported++;
        }
      }

      if ((i + batchSize) % 500 === 0) {
        console.log(`  Progress: ${i + batchSize}/${data.events.length} events processed`);
      }
    }
    console.log(`  ✅ Imported ${eventsImported} new events`);

    return {
      success: true,
      summary: {
        cinemas: {
          total: data.cinemas.length,
          imported: cinemasImported,
          skipped: data.cinemas.length - cinemasImported,
        },
        movies: {
          total: data.movies.length,
          imported: moviesImported,
          skipped: data.movies.length - moviesImported,
        },
        events: {
          total: data.events.length,
          imported: eventsImported,
          skipped: data.events.length - eventsImported,
        },
      },
    };
  },
});

/**
 * Alternative import method that reads from file path
 * (Convex doesn't support reading files directly, so this is for reference)
 */
export const clearAllData = internalMutation({
  args: {},
  handler: async (ctx) => {
    console.log("⚠️  Clearing all data from Convex...");

    // Delete all events first (due to references)
    const events = await ctx.db.query("movieEvents").collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    console.log(`  Deleted ${events.length} events`);

    // Delete all movies
    const movies = await ctx.db.query("movies").collect();
    for (const movie of movies) {
      await ctx.db.delete(movie._id);
    }
    console.log(`  Deleted ${movies.length} movies`);

    // Delete all cinemas
    const cinemas = await ctx.db.query("cinemas").collect();
    for (const cinema of cinemas) {
      await ctx.db.delete(cinema._id);
    }
    console.log(`  Deleted ${cinemas.length} cinemas`);

    return {
      deleted: {
        cinemas: cinemas.length,
        movies: movies.length,
        events: events.length,
      },
    };
  },
});
