/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import axios from "axios";
import type { Cinema, Movie, MovieEvent } from "@prisma/client";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("Starting script: fetch-movies");

const fetchMovies = async () => {
  try {
    const cinemasResponse = await axios.get(
      "https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/cinemas/with-event/until/2026-04-06?attr=&lang=ro_RO",
    );

    const cinemas = cinemasResponse.data.body.cinemas as Cinema[];

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

    await prisma.cinema.createMany({
      data: cinemaDataToCreate,
      skipDuplicates: true,
    });

    for (const cinema of cinemas) {
      const datesResponse = await axios.get(
        `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/dates/in-cinema/${cinema.id}/until/2026-04-06?attr=&lang=en_GB`,
      );

      const dates = datesResponse.data.body.dates as string[];

      for (const date of dates) {
        const eventsForDateResponse = await axios.get(
          `https://www.cinemacity.ro/ro/data-api-service/v1/quickbook/10107/film-events/in-cinema/${cinema.id}/at-date/${date}?attr=&lang=en_GB`,
        );

        const moviesForDate = eventsForDateResponse.data.body.films as Movie[];

        const moviesForDateToCreate = moviesForDate.map((movie: Movie) => ({
          ...movie,
        }));

        await prisma.movie.createMany({
          data: moviesForDateToCreate,
          skipDuplicates: true,
        });

        const eventsForDate = eventsForDateResponse.data.body
          .events as MovieEvent[];

        const eventsForDateToCreate = eventsForDate.map(
          (event: any) =>
            ({
              id: event.id,
              filmId: event.filmId,
              cinemaId: Number(event.cinemaId),
              businessDay: event.businessDay,
              eventDateTime: event.eventDateTime,
              attributes: event.attributeIds,
              bookingLink: event.bookingLink,
              secondaryBookingLink: event.secondaryBookingLink ?? "",
              presentationCode: event.presentationCode,
              soldOut: event.soldOut,
              auditorium: event.auditorium,
              auditoriumTinyName: event.auditoriumTinyName,
            }) as MovieEvent,
        );

        await prisma.movieEvent.createMany({
          data: eventsForDateToCreate,
          skipDuplicates: true,
        });
      }
    }

    console.log("Successfully processed cinemas");
  } catch (error) {
    console.error("Error fetching movies", error);
  }
};

const fetchTmdbData = async () => {
  const movies = await prisma.movie.findMany();

  for (const movie of movies) {
    const tmdbIdRequestData = await axios.get(
      `https://api.themoviedb.org/3/search/movie?query=${movie.name}&include_adult=false&language=en-US&page=1`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      },
    );

    if (tmdbIdRequestData.data.results.length === 0) {
      console.log(`No results found for movie ${movie.name}`);
      continue;
    }

    const tmdbMovieId = tmdbIdRequestData.data.results[0].id;

    const tmdbMovieRequestData = await axios.get(
      `https://api.themoviedb.org/3/movie/${tmdbMovieId}?language=en-US`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
        },
      },
    );

    const tmdbMovie = tmdbMovieRequestData.data;

    await prisma.movie.update({
      where: { id: movie.id },
      data: {
        imdbId: tmdbMovie.imdb_id,
        description: tmdbMovie.overview,
        tmdbPopularity: tmdbMovie.popularity,
      },
    });
  }
};

await fetchMovies();
await fetchTmdbData();
