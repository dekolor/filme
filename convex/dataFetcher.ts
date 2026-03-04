/**
 * Data fetcher for Convex scheduled functions
 *
 * This replaces src/scripts/fetchData.ts and runs as a scheduled Convex function
 */

import { internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { processInBatches } from "./lib/asyncUtils";
import { normalizeMovieName } from "./lib/movieUtils";

// Control concurrency to avoid rate limiting
const CINEMA_CONCURRENCY = 5;
const TMDB_CONCURRENCY = 10;

// Type definitions for Cinema City API
interface CinemaCityCinema {
  id: string;
  groupId: string;
  displayName: string;
  link: string;
  imageUrl: string;
  address: string;
  bookingUrl?: string;
  blockOnlineSales: boolean;
  blockOnlineSalesUntil?: string;
  latitude: number;
  longitude: number;
}

interface CinemaCityMovie {
  id: string;
  name: string;
  length: number;
  posterLink: string;
  videoLink?: string;
  link: string;
  weight: number;
  releaseYear?: string;
  releaseDate: string;
  attributeIds: string | string[];
}

interface CinemaCityEvent {
  id: string;
  filmId: string;
  cinemaId: string;
  businessDay: string;
  eventDateTime: string;
  attributeIds: string | string[];
  bookingLink: string;
  secondaryBookingLink?: string;
  presentationCode: string;
  soldOut: boolean;
  auditorium: string;
  auditoriumTinyName: string;
}

interface CinemasResponse {
  body: {
    cinemas: CinemaCityCinema[];
  };
}

interface DatesResponse {
  body: {
    dates: string[];
  };
}

interface EventsResponse {
  body: {
    films: CinemaCityMovie[];
    events: CinemaCityEvent[];
  };
}

interface TMDBSearchResult {
  id: number;
}

interface TMDBSearchResponse {
  results: TMDBSearchResult[];
}

interface TMDBMovieDetails {
  id: number;
  imdb_id?: string;
  overview?: string;
  popularity?: number;
  poster_path?: string;
}

/**
 * Main scheduled function - fetches all movie data from Cinema City API
 * Runs nightly at 2 AM UTC via convex/cron.ts
 */
export const fetchMoviesScheduled = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("🎬 Starting scheduled movie fetch...");

    try {
      // Fetch cinemas from Cinema City API
      const cinemasResponse = await fetch(
        "https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/cinemas/with-event/until/2026-04-06?attr=&lang=ro_RO",
      );
      const cinemasData = (await cinemasResponse.json()) as CinemasResponse;
      const cinemas = cinemasData.body.cinemas;

      console.log(`📍 Found ${cinemas.length} cinemas`);

      // Store cinemas
      const cinemaDataToCreate = cinemas.map((cinema) => ({
        externalId: Number(cinema.id),
        groupId: cinema.groupId,
        displayName: cinema.displayName,
        link: cinema.link,
        imageUrl: cinema.imageUrl,
        address: cinema.address,
        bookingUrl: cinema.bookingUrl ?? undefined,
        blockOnlineSales: cinema.blockOnlineSales,
        blockOnlineSalesUntil: cinema.blockOnlineSalesUntil
          ? new Date(cinema.blockOnlineSalesUntil).getTime()
          : undefined,
        latitude: cinema.latitude,
        longitude: cinema.longitude,
      }));

      await ctx.runMutation(internal.dataFetcher.storeCinemas, {
        cinemas: cinemaDataToCreate,
      });
      console.log(`✅ Upserted ${cinemas.length} cinemas`);

      // Collect all movies and events
      type MovieData = {
        externalId: string;
        name: string;
        length: number;
        posterLink: string;
        videoLink?: string;
        link: string;
        weight: number;
        releaseYear?: string;
        releaseDate: string;
        attributeIds: string[];
      };
      type EventData = {
        externalId: string;
        filmExternalId: string;
        cinemaExternalId: number;
        businessDay: string;
        eventDateTime: string;
        attributes: string[];
        bookingLink: string;
        secondaryBookingLink?: string;
        presentationCode: string;
        soldOut: boolean;
        auditorium: string;
        auditoriumTinyName: string;
      };
      const allMovies = new Map<string, MovieData>();
      const allEvents = new Map<string, EventData>();

      console.log("🎥 Fetching movies and events from all cinemas...");

      // Process cinemas in batches of 5 to control concurrency
      await processInBatches(cinemas, CINEMA_CONCURRENCY, async (cinema) => {
        try {
          // Fetch available dates for this cinema
          const datesResponse = await fetch(
            `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/dates/in-cinema/${cinema.id}/until/2026-04-06?attr=&lang=en_GB`,
          );
          const datesData = (await datesResponse.json()) as DatesResponse;
          const dates = datesData.body.dates;

          // Fetch events for each date
          await Promise.all(
            dates.map(async (date) => {
              try {
                const eventsResponse = await fetch(
                  `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/film-events/in-cinema/${cinema.id}/at-date/${date}?attr=&lang=en_GB`,
                );
                const eventsData = (await eventsResponse.json()) as EventsResponse;
                const movies = eventsData.body.films;
                const events = eventsData.body.events;

                // Collect unique movies
                for (const movie of movies) {
                  if (!allMovies.has(movie.id)) {
                    // Normalize attributeIds to always be an array
                    let attributeIds: string[] = [];
                    if (typeof movie.attributeIds === "string") {
                      try {
                        const parsed: unknown = JSON.parse(movie.attributeIds);
                        attributeIds = Array.isArray(parsed) ? (parsed as string[]) : [];
                      } catch {
                        attributeIds = [];
                      }
                    } else if (Array.isArray(movie.attributeIds)) {
                      attributeIds = movie.attributeIds;
                    }

                    allMovies.set(movie.id, {
                      externalId: movie.id,
                      name: movie.name,
                      length: movie.length,
                      posterLink: movie.posterLink,
                      videoLink: movie.videoLink ?? undefined,
                      link: movie.link,
                      weight: movie.weight,
                      releaseYear: movie.releaseYear ?? undefined,
                      releaseDate: movie.releaseDate,
                      attributeIds,
                    });
                  }
                }

                // Collect all events
                for (const event of events) {
                  // Normalize attributes to always be an array
                  let attributes: string[] = [];
                  if (typeof event.attributeIds === "string") {
                    try {
                      const parsed: unknown = JSON.parse(event.attributeIds);
                      attributes = Array.isArray(parsed) ? (parsed as string[]) : [];
                    } catch {
                      attributes = [];
                    }
                  } else if (Array.isArray(event.attributeIds)) {
                    attributes = event.attributeIds;
                  }

                  allEvents.set(event.id, {
                    externalId: event.id,
                    filmExternalId: event.filmId,
                    cinemaExternalId: Number(event.cinemaId),
                    businessDay: event.businessDay,
                    eventDateTime: event.eventDateTime,
                    attributes,
                    bookingLink: event.bookingLink,
                    secondaryBookingLink: event.secondaryBookingLink ?? undefined,
                    presentationCode: event.presentationCode,
                    soldOut: event.soldOut,
                    auditorium: event.auditorium,
                    auditoriumTinyName: event.auditoriumTinyName,
                  });
                }
              } catch (error) {
                console.error(
                  `Error fetching events for cinema ${cinema.id} on ${date}:`,
                  error instanceof Error ? error.message : error,
                );
              }
            }),
          );

          console.log(`  ✓ ${cinema.displayName}: ${dates.length} dates`);
        } catch (error) {
          console.error(
            `Error fetching dates for cinema ${cinema.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      });

      console.log(
        `📊 Collected ${allMovies.size} unique movies and ${allEvents.size} events`,
      );

      // Store movies
      const movieArray = Array.from(allMovies.values());
      await ctx.runMutation(internal.dataFetcher.storeMovies, {
        movies: movieArray,
      });
      console.log(`✅ Upserted ${movieArray.length} movies`);

      // Store events in batches of 100
      const eventArray = Array.from(allEvents.values());
      for (let i = 0; i < eventArray.length; i += 100) {
        const batch = eventArray.slice(i, i + 100);
        await ctx.runMutation(internal.dataFetcher.storeEvents, {
          events: batch,
        });
      }
      console.log(`✅ Upserted ${eventArray.length} events`);

      // Enrich with TMDB data
      console.log("🎬 Starting TMDB enrichment...");
      await ctx.runAction(internal.dataFetcher.enrichWithTMDB, {});

      console.log("🎉 Movie fetch completed successfully!");
    } catch (error) {
      console.error("❌ Error fetching movies:", error);
      throw error;
    }
  },
});

/**
 * Internal mutation to store/upsert cinemas
 */
export const storeCinemas = internalMutation({
  args: {
    cinemas: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, { cinemas }) => {
    for (const cinema of cinemas) {
      const existing = await ctx.db
        .query("cinemas")
        .withIndex("by_externalId", (q) => q.eq("externalId", cinema.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, cinema);
      } else {
        await ctx.db.insert("cinemas", cinema);
      }
    }
  },
});

/**
 * Internal mutation to store/upsert movies
 */
export const storeMovies = internalMutation({
  args: {
    movies: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, { movies }) => {
    for (const movie of movies) {
      const existing = await ctx.db
        .query("movies")
        .withIndex("by_externalId", (q) => q.eq("externalId", movie.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, movie);
      } else {
        await ctx.db.insert("movies", movie);
      }
    }
  },
});

/**
 * Internal mutation to store/upsert events
 */
export const storeEvents = internalMutation({
  args: {
    events: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, { events }) => {
    for (const event of events) {
      const existing = await ctx.db
        .query("movieEvents")
        .withIndex("by_externalId", (q) => q.eq("externalId", event.externalId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, event);
      } else {
        await ctx.db.insert("movieEvents", event);
      }
    }
  },
});

/**
 * TMDB enrichment action
 */
export const enrichWithTMDB = internalAction({
  args: {},
  handler: async (ctx) => {
    const tmdbApiKey = process.env.TMDB_API_KEY;
    if (!tmdbApiKey) {
      console.log("⚠️  TMDB_API_KEY not set, skipping enrichment");
      return;
    }

    // Get all movies for enrichment
    const movies = await ctx.runQuery(internal.dataFetcher.getAllMoviesForEnrichment, {});

    console.log(`🎬 Enriching ${movies.length} movies with TMDB data...`);

    let enriched = 0;
    let failed = 0;

    // Process in batches of 10 to avoid rate limiting
    await processInBatches(movies, TMDB_CONCURRENCY, async (movie) => {
      try {
        // Use normalized name for better TMDB search results
        const searchName = normalizeMovieName(movie.name);

        // Search for movie on TMDB
        const searchResponse = await fetch(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchName)}&include_adult=false&language=en-US&page=1`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${tmdbApiKey}`,
            },
          },
        );
        const searchData = (await searchResponse.json()) as TMDBSearchResponse;

        if (searchData.results.length === 0) {
          console.log(
            `  ✗ No TMDB results for "${movie.name}" (searched: "${searchName}")`,
          );
          failed++;
          return;
        }

        const firstResult = searchData.results[0];
        if (!firstResult) {
          failed++;
          return;
        }

        const tmdbId = firstResult.id;

        // Get movie details
        const detailsResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${tmdbId}?language=en-US`,
          {
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${tmdbApiKey}`,
            },
          },
        );
        const details = (await detailsResponse.json()) as TMDBMovieDetails;

        // Check if Cinema City poster is valid, if not use TMDB poster
        let posterLink = movie.posterLink;
        const cinemaCityPosterValid = await isValidUrl(movie.posterLink);
        if (!cinemaCityPosterValid && details.poster_path) {
          posterLink = `https://image.tmdb.org/t/p/w500${details.poster_path}`;
        }

        // Update movie with TMDB data
        await ctx.runMutation(internal.dataFetcher.updateMovieWithTMDB, {
          externalId: movie.externalId,
          imdbId: details.imdb_id ?? undefined,
          description: details.overview ?? undefined,
          tmdbPopularity: details.popularity ?? undefined,
          posterLink,
        });

        enriched++;
        console.log(`  ✓ ${movie.name}`);
      } catch (error) {
        failed++;
        console.log(
          `  ✗ Failed for ${movie.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    });

    console.log(
      `✅ TMDB enrichment complete: ${enriched} enriched, ${failed} failed`,
    );
  },
});

/**
 * Helper to check if a URL is valid
 */
async function isValidUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status === 200;
  } catch {
    return false;
  }
}

/**
 * Internal query to get all movies for enrichment
 */
export const getAllMoviesForEnrichment = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("movies").collect();
  },
});

/**
 * Internal mutation to update movie with TMDB data
 */
export const updateMovieWithTMDB = internalMutation({
  args: {
    externalId: v.string(),
    imdbId: v.optional(v.string()),
    description: v.optional(v.string()),
    tmdbPopularity: v.optional(v.float64()),
    posterLink: v.string(),
  },
  handler: async (ctx, args) => {
    const movie = await ctx.db
      .query("movies")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .first();

    if (movie) {
      await ctx.db.patch(movie._id, {
        imdbId: args.imdbId,
        description: args.description,
        tmdbPopularity: args.tmdbPopularity,
        posterLink: args.posterLink,
      });
    }
  },
});
