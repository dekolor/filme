/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import axios from "axios";
import type { Cinema, Movie, MovieEvent } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { processInBatches } from "../lib/async-utils";
import { normalizeMovieName } from "../lib/utils";

const prisma = new PrismaClient();

// Control concurrency to avoid rate limiting
const CINEMA_CONCURRENCY = 5;
const TMDB_CONCURRENCY = 10;

console.log("Starting script: fetch-movies");

const fetchMovies = async () => {
  try {
    console.log("Fetching cinemas...");
    const cinemasResponse = await axios.get(
      "https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/cinemas/with-event/until/2026-04-06?attr=&lang=ro_RO",
    );

    const cinemas = cinemasResponse.data.body.cinemas as Cinema[];
    console.log(`Found ${cinemas.length} cinemas`);

    // Upsert all cinemas
    const cinemaDataToCreate = cinemas.map((cinema: Cinema) => ({
      id: Number(cinema.id),
      groupId: cinema.groupId,
      displayName: cinema.displayName,
      link: cinema.link,
      imageUrl: cinema.imageUrl,
      address: cinema.address,
      bookingUrl: cinema.bookingUrl,
      blockOnlineSales: cinema.blockOnlineSales,
      blockOnlineSalesUntil: cinema.blockOnlineSalesUntil,
      latitude: cinema.latitude,
      longitude: cinema.longitude,
    }));

    await Promise.all(
      cinemaDataToCreate.map((cinema) =>
        prisma.cinema.upsert({
          where: { id: cinema.id },
          update: cinema,
          create: cinema,
        }),
      ),
    );
    console.log(`Upserted ${cinemas.length} cinemas`);

    // Collect all movies and events from all cinemas in parallel
    const allMovies = new Map<string, any>();
    const allEvents = new Map<string, any>();

    console.log("Fetching movies and events from all cinemas...");

    await processInBatches(cinemas, CINEMA_CONCURRENCY, async (cinema) => {
      try {
        const datesResponse = await axios.get(
          `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/dates/in-cinema/${cinema.id}/until/2026-04-06?attr=&lang=en_GB`,
        );
        const dates = datesResponse.data.body.dates as string[];

        // Fetch all dates for this cinema in parallel
        await Promise.all(
          dates.map(async (date) => {
            try {
              const eventsResponse = await axios.get(
                `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/film-events/in-cinema/${cinema.id}/at-date/${date}?attr=&lang=en_GB`,
              );

              const movies = eventsResponse.data.body.films as Movie[];
              const events = eventsResponse.data.body.events as MovieEvent[];

              // Collect unique movies
              for (const movie of movies) {
                if (!allMovies.has(movie.id)) {
                  const attributeIds = (movie as any).attributeIds;

                  /**
                   * Normalize attributeIds to always be a JSON string array.
                   * Cinema City API may return this field in different formats:
                   * - As a JSON string array: '["attr1","attr2"]'
                   * - As a JavaScript array: ["attr1","attr2"]
                   * - As undefined/null/other types
                   */
                  let attributeIdsStr: string;

                  if (typeof attributeIds === "string") {
                    // API returned a string - validate it's valid JSON array
                    try {
                      const parsed = JSON.parse(attributeIds);
                      if (Array.isArray(parsed)) {
                        attributeIdsStr = attributeIds;
                      } else {
                        console.warn(`Movie ${movie.id}: attributeIds is a string but not a JSON array. Got:`, typeof parsed);
                        attributeIdsStr = JSON.stringify([]);
                      }
                    } catch (error) {
                      console.warn(`Movie ${movie.id}: attributeIds is a malformed JSON string. Error:`, error);
                      attributeIdsStr = JSON.stringify([]);
                    }
                  } else if (Array.isArray(attributeIds)) {
                    // API returned a JavaScript array - stringify it
                    attributeIdsStr = JSON.stringify(attributeIds);
                  } else if (attributeIds === undefined || attributeIds === null) {
                    // API didn't provide attributeIds - use empty array
                    attributeIdsStr = JSON.stringify([]);
                  } else {
                    // Unexpected type - log warning and use empty array
                    console.warn(`Movie ${movie.id}: attributeIds has unexpected type:`, typeof attributeIds, attributeIds);
                    attributeIdsStr = JSON.stringify([]);
                  }

                  allMovies.set(movie.id, {
                    ...movie,
                    attributeIds: attributeIdsStr,
                  });
                }
              }

              // Collect all events
              for (const event of events) {
                const eventAttributeIds = (event as any).attributeIds;
                // Ensure attributes is always stored as a JSON string array
                let attributesStr: string;
                if (typeof eventAttributeIds === "string") {
                  try {
                    const parsed = JSON.parse(eventAttributeIds);
                    attributesStr = Array.isArray(parsed)
                      ? eventAttributeIds
                      : JSON.stringify([]);
                  } catch {
                    attributesStr = JSON.stringify([]);
                  }
                } else if (Array.isArray(eventAttributeIds)) {
                  attributesStr = JSON.stringify(eventAttributeIds);
                } else {
                  attributesStr = JSON.stringify([]);
                }
                allEvents.set((event as any).id, {
                  id: (event as any).id,
                  filmId: (event as any).filmId,
                  cinemaId: Number((event as any).cinemaId),
                  businessDay: (event as any).businessDay,
                  eventDateTime: (event as any).eventDateTime,
                  attributes: attributesStr,
                  bookingLink: (event as any).bookingLink,
                  secondaryBookingLink:
                    (event as any).secondaryBookingLink ?? "",
                  presentationCode: (event as any).presentationCode,
                  soldOut: (event as any).soldOut,
                  auditorium: (event as any).auditorium,
                  auditoriumTinyName: (event as any).auditoriumTinyName,
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
      `Collected ${allMovies.size} unique movies and ${allEvents.size} events`,
    );

    // Batch upsert movies
    console.log("Upserting movies...");
    const movieArray = Array.from(allMovies.values());
    await Promise.all(
      movieArray.map((movie) =>
        prisma.movie.upsert({
          where: { id: movie.id },
          update: movie,
          create: movie,
        }),
      ),
    );
    console.log(`Upserted ${movieArray.length} movies`);

    // Batch upsert events
    console.log("Upserting events...");
    const eventArray = Array.from(allEvents.values());
    await processInBatches(eventArray, 100, async (event) => {
      await prisma.movieEvent.upsert({
        where: { id: event.id },
        update: event,
        create: event,
      });
    });
    console.log(`Upserted ${eventArray.length} events`);

    console.log("Successfully processed all cinemas");
  } catch (error) {
    console.error("Error fetching movies", error);
  }
};

/**
 * Checks if a URL returns a valid response (not 404).
 */
async function isValidUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
}

const fetchTmdbData = async () => {
  if (!process.env.TMDB_API_KEY) {
    console.log("TMDB_API_KEY not set, skipping TMDB enrichment");
    return;
  }

  console.log("Fetching TMDB data for enrichment...");
  const movies = await prisma.movie.findMany();
  console.log(`Enriching ${movies.length} movies with TMDB data...`);

  let enriched = 0;
  let failed = 0;

  await processInBatches(movies, TMDB_CONCURRENCY, async (movie) => {
    try {
      // Use normalized name for better TMDB search results
      const searchName = normalizeMovieName(movie.name);

      const tmdbIdRequestData = await axios.get(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchName)}&include_adult=false&language=en-US&page=1`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        },
      );

      if (tmdbIdRequestData.data.results.length === 0) {
        console.log(
          `  ✗ No TMDB results for "${movie.name}" (searched: "${searchName}")`,
        );
        failed++;
        return;
      }

      const tmdbMovieId = tmdbIdRequestData.data.results[0].id;

      const tmdbMovieRequestData = await axios.get(
        `https://api.themoviedb.org/3/movie/${tmdbMovieId}?language=en-US`,
        {
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
          },
        },
      );

      const tmdbMovie = tmdbMovieRequestData.data;

      // Build update data
      const updateData: any = {
        imdbId: tmdbMovie.imdb_id,
        description: tmdbMovie.overview,
        tmdbPopularity: tmdbMovie.popularity,
      };

      // Check if Cinema City poster is valid, if not use TMDB poster
      const cinemaCityPosterValid = await isValidUrl(movie.posterLink);
      if (!cinemaCityPosterValid && tmdbMovie.poster_path) {
        updateData.posterLink = `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`;
      }

      await prisma.movie.update({
        where: { id: movie.id },
        data: updateData,
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
    `TMDB enrichment complete: ${enriched} enriched, ${failed} failed`,
  );
};

await fetchMovies();
await fetchTmdbData().catch((error) => {
  console.error(
    "TMDB enrichment failed, but Cinema City data was fetched successfully:",
    error,
  );
});

await prisma.$disconnect();
