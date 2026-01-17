/**
 * Test data seeding mutations for Playwright E2E tests
 *
 * These mutations are used by tests/global-setup.ts to seed the database
 * with test data before running Playwright tests.
 */

import { mutation } from "./_generated/server";

/**
 * Clear test-specific data from the database
 * Only deletes records with test-specific externalIds to avoid
 * hitting Convex read limits on large production databases
 */
export const clearTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Test data identifiers
    const testMovieIds = ["MOV1", "MOV2", "MOV3", "MOV4", "MOV5"];
    const testCinemaIds = [1, 2, 3];

    let deletedEvents = 0;
    let deletedMovies = 0;
    let deletedCinemas = 0;

    // Delete test movie events (those starting with "EVENT")
    for (const movieId of testMovieIds) {
      const events = await ctx.db
        .query("movieEvents")
        .withIndex("by_filmExternalId", (q) => q.eq("filmExternalId", movieId))
        .collect();
      for (const event of events) {
        await ctx.db.delete(event._id);
        deletedEvents++;
      }
    }

    // Delete test movies
    for (const movieId of testMovieIds) {
      const movie = await ctx.db
        .query("movies")
        .withIndex("by_externalId", (q) => q.eq("externalId", movieId))
        .first();
      if (movie) {
        await ctx.db.delete(movie._id);
        deletedMovies++;
      }
    }

    // Delete test cinemas
    for (const cinemaId of testCinemaIds) {
      const cinema = await ctx.db
        .query("cinemas")
        .withIndex("by_externalId", (q) => q.eq("externalId", cinemaId))
        .first();
      if (cinema) {
        await ctx.db.delete(cinema._id);
        deletedCinemas++;
      }
    }

    return {
      deletedEvents,
      deletedMovies,
      deletedCinemas,
    };
  },
});

/**
 * Seed the database with test data
 * Creates cinemas, movies, and movie events for E2E testing
 */
export const seedTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Use slice(0, 10) for YYYY-MM-DD format (guaranteed for ISO strings)
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    const nextWeekStr = nextWeek.toISOString().slice(0, 10);
    const tomorrowStr = new Date(today.getTime() + 86400000)
      .toISOString()
      .slice(0, 10);

    // Create test cinemas
    const cinemaData = [
      {
        externalId: 1,
        groupId: "1",
        displayName: "AFI Palace Cotroceni",
        link: "https://www.cinemacity.ro/cinemas/afi-palace-cotroceni",
        imageUrl: "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/1.jpg",
        address: "Bd. Vasile Milea 4, București 061344",
        bookingUrl: "https://www.cinemacity.ro/booking/1",
        blockOnlineSales: false,
        latitude: 44.43225,
        longitude: 26.05384,
      },
      {
        externalId: 2,
        groupId: "2",
        displayName: "Sun Plaza",
        link: "https://www.cinemacity.ro/cinemas/sun-plaza",
        imageUrl: "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/2.jpg",
        address: "Calea Văcărești 391, București 040069",
        bookingUrl: "https://www.cinemacity.ro/booking/2",
        blockOnlineSales: false,
        latitude: 44.40345,
        longitude: 26.12456,
      },
      {
        externalId: 3,
        groupId: "3",
        displayName: "ParkLake",
        link: "https://www.cinemacity.ro/cinemas/parklake",
        imageUrl: "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/3.jpg",
        address: "Liviu Rebreanu 4, București 031781",
        bookingUrl: "https://www.cinemacity.ro/booking/3",
        blockOnlineSales: false,
        latitude: 44.47123,
        longitude: 26.15234,
      },
    ];

    for (const cinema of cinemaData) {
      await ctx.db.insert("cinemas", cinema);
    }

    // Create test movies
    const movieData = [
      {
        externalId: "MOV1",
        name: "The Adventures of ChatGPT",
        length: 120,
        posterLink: "https://image.tmdb.org/t/p/w500/poster1.jpg",
        videoLink: "https://www.youtube.com/watch?v=trailer1",
        link: "https://www.cinemacity.ro/movies/chatgpt",
        weight: 100,
        releaseYear: "2024",
        releaseDate: yesterdayStr,
        attributeIds: ["Action", "Sci-Fi", "Comedy"],
        imdbId: "tt1234567",
        description:
          "An AI assistant embarks on an epic journey to help humanity write better code and understand the universe.",
        tmdbPopularity: 95.5,
      },
      {
        externalId: "MOV2",
        name: "Debugging Wars: Episode IX",
        length: 135,
        posterLink: "https://image.tmdb.org/t/p/w500/poster2.jpg",
        videoLink: "https://www.youtube.com/watch?v=trailer2",
        link: "https://www.cinemacity.ro/movies/debugging-wars",
        weight: 95,
        releaseYear: "2024",
        releaseDate: yesterdayStr,
        attributeIds: ["Action", "Drama", "Thriller"],
        imdbId: "tt2345678",
        description:
          "The final battle between programmers and bugs in a galaxy far, far away from production.",
        tmdbPopularity: 88.2,
      },
      {
        externalId: "MOV3",
        name: "The TypeScript Supremacy",
        length: 145,
        posterLink: "https://image.tmdb.org/t/p/w500/poster3.jpg",
        link: "https://www.cinemacity.ro/movies/typescript",
        weight: 90,
        releaseYear: "2024",
        releaseDate: yesterdayStr,
        attributeIds: ["Action", "Sci-Fi"],
        imdbId: "tt3456789",
        description:
          "When JavaScript rebels threaten to destroy the codebase, only TypeScript can restore order and type safety.",
        tmdbPopularity: 82.7,
      },
      {
        externalId: "MOV4",
        name: "React: The New Generation",
        length: 110,
        posterLink: "https://image.tmdb.org/t/p/w500/poster4.jpg",
        videoLink: "https://www.youtube.com/watch?v=trailer4",
        link: "https://www.cinemacity.ro/movies/react-next-gen",
        weight: 85,
        releaseYear: "2024",
        releaseDate: yesterdayStr,
        attributeIds: ["Drama", "Family"],
        imdbId: "tt4567890",
        description:
          "A new generation of developers learns the ancient art of component composition and state management.",
        tmdbPopularity: 75.3,
      },
      {
        externalId: "MOV5",
        name: "Upcoming: The Future of AI",
        length: 128,
        posterLink: "https://image.tmdb.org/t/p/w500/poster5.jpg",
        videoLink: "https://www.youtube.com/watch?v=trailer5",
        link: "https://www.cinemacity.ro/movies/future-ai",
        weight: 80,
        releaseYear: "2025",
        releaseDate: nextWeekStr,
        attributeIds: ["Sci-Fi", "Documentary"],
        imdbId: "tt5678901",
        description:
          "A glimpse into the future where AI and humans work together to solve the world's greatest challenges.",
        tmdbPopularity: 92.1,
      },
    ];

    for (const movie of movieData) {
      await ctx.db.insert("movies", movie);
    }

    // Create movie events (showtimes)
    let eventId = 1;

    for (const cinemaId of [1, 2, 3]) {
      for (const movieId of ["MOV1", "MOV2", "MOV3", "MOV4"]) {
        // Create 3 showtimes per movie per cinema
        for (let hour = 10; hour <= 20; hour += 5) {
          const eventDateTime = `${todayStr}T${hour.toString().padStart(2, "0")}:00:00`;

          await ctx.db.insert("movieEvents", {
            externalId: `EVENT${eventId.toString().padStart(6, "0")}`,
            filmExternalId: movieId,
            cinemaExternalId: cinemaId,
            businessDay: todayStr,
            eventDateTime,
            attributes: ["2D", "DUB"],
            bookingLink: `https://www.cinemacity.ro/booking/${cinemaId}/${movieId}/${eventId}`,
            presentationCode: "2D",
            soldOut: false,
            auditorium: `Sala ${(eventId % 10) + 1}`,
            auditoriumTinyName: `S${(eventId % 10) + 1}`,
          });
          eventId++;
        }

        // Create showtime for tomorrow
        const tomorrowEventDateTime = `${tomorrowStr}T18:00:00`;
        await ctx.db.insert("movieEvents", {
          externalId: `EVENT${eventId.toString().padStart(6, "0")}`,
          filmExternalId: movieId,
          cinemaExternalId: cinemaId,
          businessDay: tomorrowStr,
          eventDateTime: tomorrowEventDateTime,
          attributes: ["2D", "DUB"],
          bookingLink: `https://www.cinemacity.ro/booking/${cinemaId}/${movieId}/${eventId}`,
          presentationCode: "2D",
          soldOut: false,
          auditorium: `Sala ${(eventId % 10) + 1}`,
          auditoriumTinyName: `S${(eventId % 10) + 1}`,
        });
        eventId++;
      }
    }

    return {
      createdCinemas: cinemaData.length,
      createdMovies: movieData.length,
      createdEvents: eventId - 1,
    };
  },
});
