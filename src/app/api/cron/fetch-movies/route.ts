/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { NextResponse } from "next/server";
import axios from "axios";
import { api } from "~/trpc/server";
import type { Cinema, Movie, MovieEvent } from "@prisma/client";

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

  if (authorizationHeader !== `Bearer ${CRON_SECRET}`) {
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

    for (const cinema of cinemas) {
      const datesResponse = await axios.get(
        `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/dates/in-cinema/${cinema.id}/until/2026-04-06?attr=&lang=ro_RO`,
      );

      const dates = datesResponse.data.body.dates as string[];

      for (const date of dates) {
        const eventsForDateResponse = await axios.get(
          `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/film-events/in-cinema/${cinema.id}/at-date/${date}?attr=&lang=ro_RO`,
        );

        const moviesForDate = eventsForDateResponse.data.body.films as Movie[];

        const moviesForDateToCreate = moviesForDate.map((movie: Movie) => ({
          ...movie,
        }));

        await api.movie.create(moviesForDateToCreate);

        const eventsForDate = eventsForDateResponse.data.body
          .events as MovieEvent[];

        const eventsForDateToCreate = eventsForDate.map(
          (event: any) =>
            ({
              ...event,
              cinemaId: Number(event.cinemaId),
              attributes: event.attributeIds,
              secondaryBookingLink: event.secondaryBookingLink ?? "",
            }) as MovieEvent,
        );

        await api.movieEvent.create(eventsForDateToCreate);
      }
    }

    return NextResponse.json(
      {
        // Adjust the success message based on what createdCinemasResult actually returns
        message: `Successfully processed ${
          Array.isArray(createdCinemasResult)
            ? createdCinemasResult.length
            : (createdCinemasResult?.count ?? 0) // Example: Adapt based on actual return type
        } cinemas`,
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
