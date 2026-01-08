/**
 * Export PostgreSQL data to Convex-compatible JSON format
 *
 * This script reads all data from the PostgreSQL database using Prisma
 * and transforms it into a format suitable for importing into Convex.
 *
 * Usage: npx tsx scripts/export-to-convex.ts
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function exportData() {
  console.log("Starting PostgreSQL data export...");

  try {
    // Fetch all data in parallel
    const [cinemas, movies, events] = await Promise.all([
      prisma.cinema.findMany(),
      prisma.movie.findMany(),
      prisma.movieEvent.findMany(),
    ]);

    console.log(`Fetched ${cinemas.length} cinemas`);
    console.log(`Fetched ${movies.length} movies`);
    console.log(`Fetched ${events.length} events`);

    // Transform data for Convex
    const convexData = {
      cinemas: cinemas.map((c) => ({
        externalId: c.id,
        groupId: c.groupId,
        displayName: c.displayName,
        link: c.link,
        imageUrl: c.imageUrl,
        address: c.address,
        bookingUrl: c.bookingUrl ?? undefined,
        blockOnlineSales: c.blockOnlineSales,
        blockOnlineSalesUntil: c.blockOnlineSalesUntil?.getTime(),
        latitude: c.latitude,
        longitude: c.longitude,
      })),
      movies: movies.map((m) => {
        // Parse attributeIds JSON string to array
        let attributeIds: string[] = [];
        try {
          const parsed: unknown = JSON.parse(m.attributeIds);
          attributeIds = Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          console.warn(`Failed to parse attributeIds for movie ${m.id}`);
        }

        return {
          externalId: m.id,
          name: m.name,
          length: m.length,
          posterLink: m.posterLink,
          videoLink: m.videoLink ?? undefined,
          link: m.link,
          weight: m.weight,
          releaseYear: m.releaseYear ?? undefined,
          releaseDate: m.releaseDate,
          attributeIds,
          imdbId: m.imdbId ?? undefined,
          description: m.description ?? undefined,
          tmdbPopularity: m.tmdbPopularity ?? undefined,
        };
      }),
      events: events.map((e) => {
        // Parse attributes JSON string to array
        let attributes: string[] = [];
        try {
          const parsed: unknown = JSON.parse(e.attributes);
          attributes = Array.isArray(parsed) ? (parsed as string[]) : [];
        } catch {
          console.warn(`Failed to parse attributes for event ${e.id}`);
        }

        return {
          externalId: e.id,
          filmExternalId: e.filmId,
          cinemaExternalId: e.cinemaId,
          businessDay: e.businessDay,
          eventDateTime: e.eventDateTime,
          attributes,
          bookingLink: e.bookingLink,
          secondaryBookingLink: e.secondaryBookingLink ?? undefined,
          presentationCode: e.presentationCode,
          soldOut: e.soldOut,
          auditorium: e.auditorium,
          auditoriumTinyName: e.auditoriumTinyName,
        };
      }),
    };

    // Write to JSON file
    const outputPath = path.join(process.cwd(), "convex-migration-data.json");
    fs.writeFileSync(outputPath, JSON.stringify(convexData, null, 2));

    console.log(`\n✅ Export complete!`);
    console.log(`📁 Data written to: ${outputPath}`);
    console.log(`\nSummary:`);
    console.log(`  - ${convexData.cinemas.length} cinemas`);
    console.log(`  - ${convexData.movies.length} movies`);
    console.log(`  - ${convexData.events.length} events`);

    // Validate data integrity
    const uniqueCinemaIds = new Set(convexData.cinemas.map((c) => c.externalId));
    const uniqueMovieIds = new Set(convexData.movies.map((m) => m.externalId));

    console.log(`\nData Integrity Checks:`);
    console.log(`  - Unique cinema IDs: ${uniqueCinemaIds.size}`);
    console.log(`  - Unique movie IDs: ${uniqueMovieIds.size}`);

    // Check for events with missing references
    const eventsWithMissingCinemas = convexData.events.filter(
      (e) => !uniqueCinemaIds.has(e.cinemaExternalId),
    );
    const eventsWithMissingMovies = convexData.events.filter(
      (e) => !uniqueMovieIds.has(e.filmExternalId),
    );

    if (eventsWithMissingCinemas.length > 0) {
      console.warn(
        `  ⚠️  ${eventsWithMissingCinemas.length} events reference missing cinemas`,
      );
    }
    if (eventsWithMissingMovies.length > 0) {
      console.warn(
        `  ⚠️  ${eventsWithMissingMovies.length} events reference missing movies`,
      );
    }

    if (
      eventsWithMissingCinemas.length === 0 &&
      eventsWithMissingMovies.length === 0
    ) {
      console.log(`  ✅ All event references are valid`);
    }
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void exportData();
