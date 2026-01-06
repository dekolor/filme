/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import axios from "axios";
import { api } from "~/trpc/server";
import type { Cinema } from "@prisma/client";
import { processInBatches } from "~/lib/async-utils";

// Control concurrency to avoid rate limiting
const CINEMA_CONCURRENCY = 5;

// Types for external API responses (attributeIds/attributes come as arrays from Cinema City API)
interface ExternalMovie {
  id: string;
  name: string;
  length: number;
  posterLink: string;
  videoLink: string | null;
  link: string;
  weight: number;
  releaseYear: string | null;
  releaseDate: string;
  attributeIds: string[];
}

interface ExternalMovieEvent {
  id: string;
  filmId: string;
  cinemaId: string;
  businessDay: string;
  eventDateTime: string;
  attributeIds: string[];
  bookingLink: string;
  secondaryBookingLink: string | null;
  presentationCode: string;
  soldOut: boolean;
  auditorium: string;
  auditoriumTinyName: string;
}

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: Request) {
  const authorizationHeader = request.headers.get("authorization");
  if (!CRON_SECRET) {
    console.error("CRON_SECRET is not set");
    return NextResponse.json(
      { message: "Server configuration error" },
      { status: 500 },
    );
  }

  // Use constant-time comparison to prevent timing attacks
  const expectedAuth = `Bearer ${CRON_SECRET}`;
  const isValid =
    authorizationHeader &&
    authorizationHeader.length === expectedAuth.length &&
    timingSafeEqual(
      Buffer.from(authorizationHeader),
      Buffer.from(expectedAuth),
    );

  if (!isValid) {
    console.warn("Unauthorized cron attempt detected");
    return NextResponse.json(
      { message: "Invalid authorization" },
      { status: 401 },
    );
  }

  console.log("Authorized cron job starting: fetch-movies");

  try {
    const cinemasResponse = await axios.get(
      "https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/cinemas/with-event/until/2026-04-06?attr=&lang=ro_RO",
    );

    const cinemas = cinemasResponse.data.body.cinemas as Cinema[];

    const cinemaDataToCreate = cinemas.map((cinema: Cinema) => ({
      ...cinema,
      id: Number(cinema.id),
    }));

    const createdCinemasResult = await api.cinema.create(cinemaDataToCreate);

    // Collect all movies and events from all cinemas in parallel
    const allMovies: ExternalMovie[] = [];
    const allEvents: ExternalMovieEvent[] = [];
    const movieIds = new Set<string>();
    const eventIds = new Set<string>();

    await processInBatches(cinemas, CINEMA_CONCURRENCY, async (cinema) => {
      try {
        const datesResponse = await axios.get(
          `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/dates/in-cinema/${cinema.id}/until/2026-04-06?attr=&lang=ro_RO`,
        );

        const dates = datesResponse.data.body.dates as string[];

        // Fetch all dates for this cinema in parallel
        await Promise.all(
          dates.map(async (date) => {
            try {
              const eventsForDateResponse = await axios.get(
                `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/film-events/in-cinema/${cinema.id}/at-date/${date}?attr=&lang=ro_RO`,
              );

              const moviesForDate = eventsForDateResponse.data.body
                .films as ExternalMovie[];
              const eventsForDate = eventsForDateResponse.data.body
                .events as ExternalMovieEvent[];

              // Collect unique movies
              for (const movie of moviesForDate) {
                if (!movieIds.has(movie.id)) {
                  movieIds.add(movie.id);
                  allMovies.push(movie);
                }
              }

              // Collect unique events
              for (const event of eventsForDate) {
                if (!eventIds.has(event.id)) {
                  eventIds.add(event.id);
                  allEvents.push(event);
                }
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
      `Collected ${allMovies.length} unique movies and ${allEvents.length} events`,
    );

    // Batch create movies
    if (allMovies.length > 0) {
      await api.movie.create(allMovies);
    }

    // Batch create events
    if (allEvents.length > 0) {
      const eventsToCreate = allEvents.map((event) => ({
        ...event,
        cinemaId: Number(event.cinemaId),
        attributes: event.attributeIds,
        secondaryBookingLink: event.secondaryBookingLink ?? "",
      }));
      await api.movieEvent.create(eventsToCreate);
    }

    return NextResponse.json(
      {
        message: `Successfully processed ${
          Array.isArray(createdCinemasResult)
            ? createdCinemasResult.length
            : (createdCinemasResult?.count ?? 0)
        } cinemas, ${allMovies.length} movies, ${allEvents.length} events`,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error fetching movies", error);
    return NextResponse.json(
      { message: "Error fetching movies" },
      { status: 500 },
    );
  }
}
