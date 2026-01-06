/**
 * Playwright global setup
 * Runs before all tests to prepare the test environment
 */

import { join } from "path";
import { existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

const TEST_DB_URL = "postgresql://dekolor@localhost:5432/filme_test";

async function seed() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DB_URL,
      },
    },
  });

  try {
    console.log("🌱 Seeding test database...");

    // Clean existing data
    console.log("  Cleaning existing data...");
    await prisma.movieEvent.deleteMany();
    await prisma.movie.deleteMany();
    await prisma.cinema.deleteMany();

    // Create test cinemas
    console.log("  Creating cinemas...");
    const cinemas = await prisma.cinema.createMany({
      data: [
        {
          id: 1,
          groupId: "1",
          displayName: "AFI Palace Cotroceni",
          link: "https://www.cinemacity.ro/cinemas/afi-palace-cotroceni",
          imageUrl:
            "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/1.jpg",
          address: "Bd. Vasile Milea 4, București 061344",
          bookingUrl: "https://www.cinemacity.ro/booking/1",
          blockOnlineSales: false,
          blockOnlineSalesUntil: null,
          latitude: 44.43225,
          longitude: 26.05384,
        },
        {
          id: 2,
          groupId: "2",
          displayName: "Sun Plaza",
          link: "https://www.cinemacity.ro/cinemas/sun-plaza",
          imageUrl:
            "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/2.jpg",
          address: "Calea Văcărești 391, București 040069",
          bookingUrl: "https://www.cinemacity.ro/booking/2",
          blockOnlineSales: false,
          blockOnlineSalesUntil: null,
          latitude: 44.40345,
          longitude: 26.12456,
        },
        {
          id: 3,
          groupId: "3",
          displayName: "ParkLake",
          link: "https://www.cinemacity.ro/cinemas/parklake",
          imageUrl:
            "https://www.cinemacity.ro/xmedia-cw/repo/feats/posters/3.jpg",
          address: "Liviu Rebreanu 4, București 031781",
          bookingUrl: "https://www.cinemacity.ro/booking/3",
          blockOnlineSales: false,
          blockOnlineSalesUntil: null,
          latitude: 44.47123,
          longitude: 26.15234,
        },
      ],
      skipDuplicates: true,
    });
    console.log(`  ✓ Created ${cinemas.count} cinemas`);

    // Create test movies
    console.log("  Creating movies...");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    await prisma.movie.createMany({
      data: [
        {
          id: "MOV1",
          name: "The Adventures of ChatGPT",
          length: 120,
          posterLink: "https://image.tmdb.org/t/p/w500/poster1.jpg",
          videoLink: "https://www.youtube.com/watch?v=trailer1",
          link: "https://www.cinemacity.ro/movies/chatgpt",
          weight: 100,
          releaseYear: "2024",
          releaseDate: yesterday.toISOString().split("T")[0]!,
          attributeIds: JSON.stringify(["Action", "Sci-Fi", "Comedy"]),
          imdbId: "tt1234567",
          description:
            "An AI assistant embarks on an epic journey to help humanity write better code and understand the universe.",
          tmdbPopularity: 95.5,
        },
        {
          id: "MOV2",
          name: "Debugging Wars: Episode IX",
          length: 135,
          posterLink: "https://image.tmdb.org/t/p/w500/poster2.jpg",
          videoLink: "https://www.youtube.com/watch?v=trailer2",
          link: "https://www.cinemacity.ro/movies/debugging-wars",
          weight: 95,
          releaseYear: "2024",
          releaseDate: yesterday.toISOString().split("T")[0]!,
          attributeIds: JSON.stringify(["Action", "Drama", "Thriller"]),
          imdbId: "tt2345678",
          description:
            "The final battle between programmers and bugs in a galaxy far, far away from production.",
          tmdbPopularity: 88.2,
        },
        {
          id: "MOV3",
          name: "The TypeScript Supremacy",
          length: 145,
          posterLink: "https://image.tmdb.org/t/p/w500/poster3.jpg",
          videoLink: null,
          link: "https://www.cinemacity.ro/movies/typescript",
          weight: 90,
          releaseYear: "2024",
          releaseDate: yesterday.toISOString().split("T")[0]!,
          attributeIds: JSON.stringify(["Action", "Sci-Fi"]),
          imdbId: "tt3456789",
          description:
            "When JavaScript rebels threaten to destroy the codebase, only TypeScript can restore order and type safety.",
          tmdbPopularity: 82.7,
        },
        {
          id: "MOV4",
          name: "React: The New Generation",
          length: 110,
          posterLink: "https://image.tmdb.org/t/p/w500/poster4.jpg",
          videoLink: "https://www.youtube.com/watch?v=trailer4",
          link: "https://www.cinemacity.ro/movies/react-next-gen",
          weight: 85,
          releaseYear: "2024",
          releaseDate: yesterday.toISOString().split("T")[0]!,
          attributeIds: JSON.stringify(["Drama", "Family"]),
          imdbId: "tt4567890",
          description:
            "A new generation of developers learns the ancient art of component composition and state management.",
          tmdbPopularity: 75.3,
        },
        {
          id: "MOV5",
          name: "Upcoming: The Future of AI",
          length: 128,
          posterLink: "https://image.tmdb.org/t/p/w500/poster5.jpg",
          videoLink: "https://www.youtube.com/watch?v=trailer5",
          link: "https://www.cinemacity.ro/movies/future-ai",
          weight: 80,
          releaseYear: "2025",
          releaseDate: nextWeek.toISOString().split("T")[0]!,
          attributeIds: JSON.stringify(["Sci-Fi", "Documentary"]),
          imdbId: "tt5678901",
          description:
            "A glimpse into the future where AI and humans work together to solve the world's greatest challenges.",
          tmdbPopularity: 92.1,
        },
      ],
      skipDuplicates: true,
    });
    console.log("  ✓ Created 5 movies");

    // Create test movie events (showtimes)
    console.log("  Creating movie events...");
    const todayStr = today.toISOString().split("T")[0]!;
    const tomorrowStr = new Date(today.getTime() + 86400000)
      .toISOString()
      .split("T")[0]!;

    const events = [];
    let eventId = 1;

    // Create showtimes for each movie at different cinemas
    for (const cinemaId of [1, 2, 3]) {
      for (const movieId of ["MOV1", "MOV2", "MOV3", "MOV4"]) {
        // Create 3 showtimes per movie per cinema
        for (let hour = 10; hour <= 20; hour += 5) {
          const eventDateTime = `${todayStr}T${hour.toString().padStart(2, "0")}:00:00`;

          events.push({
            id: `EVENT${eventId.toString().padStart(6, "0")}`,
            filmId: movieId,
            cinemaId,
            businessDay: todayStr,
            eventDateTime,
            attributes: JSON.stringify(["2D", "DUB"]),
            bookingLink: `https://www.cinemacity.ro/booking/${cinemaId}/${movieId}/${eventId}`,
            secondaryBookingLink: null,
            presentationCode: "2D",
            soldOut: false,
            auditorium: `Sala ${(eventId % 10) + 1}`,
            auditoriumTinyName: `S${(eventId % 10) + 1}`,
          });
          eventId++;
        }

        // Also create some showtimes for tomorrow
        const tomorrowEventDateTime = `${tomorrowStr}T18:00:00`;
        events.push({
          id: `EVENT${eventId.toString().padStart(6, "0")}`,
          filmId: movieId,
          cinemaId,
          businessDay: tomorrowStr,
          eventDateTime: tomorrowEventDateTime,
          attributes: JSON.stringify(["2D", "DUB"]),
          bookingLink: `https://www.cinemacity.ro/booking/${cinemaId}/${movieId}/${eventId}`,
          secondaryBookingLink: null,
          presentationCode: "2D",
          soldOut: false,
          auditorium: `Sala ${(eventId % 10) + 1}`,
          auditoriumTinyName: `S${(eventId % 10) + 1}`,
        });
        eventId++;
      }
    }

    await prisma.movieEvent.createMany({
      data: events,
      skipDuplicates: true,
    });
    console.log(`  ✓ Created ${events.length} movie events`);

    console.log("✅ Test database seeded successfully!");
  } finally {
    await prisma.$disconnect();
  }
}

async function globalSetup() {
  console.log("🔧 Setting up test environment...");

  // Push schema to test database (creates tables if they don't exist)
  console.log("  Setting up database schema...");
  execSync("npx prisma db push --skip-generate", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "pipe",
  });

  // Seed the test database
  await seed();

  console.log("✅ Test environment prepared!");
}

export default globalSetup;
