import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { deduplicateMovies } from "~/lib/movie-utils";
import { isSQLiteDatabase } from "~/lib/database-utils";

export const movieRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          length: z.number(),
          posterLink: z.string(),
          videoLink: z.string().nullable(),
          link: z.string(),
          weight: z.number(),
          releaseYear: z.string().nullable(),
          releaseDate: z.string(),
          attributeIds: z.array(z.string()),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const data = input.map((movie) => ({
        ...movie,
        attributeIds: JSON.stringify(movie.attributeIds),
      }));
      // SQLite doesn't support skipDuplicates, so we handle it conditionally
      const isSQLite = isSQLiteDatabase();
      if (isSQLite) {
        // For SQLite, insert one by one and ignore conflicts
        let count = 0;
        for (const movie of data) {
          try {
            await ctx.db.movie.create({ data: movie });
            count++;
          } catch {
            // Ignore duplicate key errors
          }
        }
        return { count };
      }
      return ctx.db.movie.createMany({
        data,
        skipDuplicates: true,
      });
    }),

  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        orderByPopularity: z.enum(["asc", "desc"]).optional(),
        hasDescription: z.boolean().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Fetch more movies than requested to account for deduplication
      const fetchLimit = input.limit ? input.limit * 2 : undefined;
      const movies = await ctx.db.movie.findMany({
        skip: input.offset,
        take: fetchLimit,
        where: {
          events: {
            some: {
              businessDay: { gte: new Date().toISOString() },
            },
          },
          ...(input.hasDescription && {
            description: {
              not: null,
            },
          }),
        },
        orderBy: {
          tmdbPopularity: input.orderByPopularity,
        },
      });
      const parsedMovies = movies.map((movie) => ({
        ...movie,
        attributeIds: JSON.parse(movie.attributeIds) as string[],
      }));
      const deduplicated = deduplicateMovies(parsedMovies);
      return input.limit ? deduplicated.slice(0, input.limit) : deduplicated;
    }),

  getAllUpcoming: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        orderByPopularity: z.enum(["asc", "desc"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Fetch more movies than requested to account for deduplication
      const fetchLimit = input.limit ? input.limit * 2 : undefined;
      const movies = await ctx.db.movie.findMany({
        where: {
          releaseDate: {
            gt: new Date().toISOString(),
          },
        },
        skip: input.offset,
        take: fetchLimit,
        orderBy: {
          tmdbPopularity: input.orderByPopularity,
        },
      });
      const parsedMovies = movies.map((movie) => ({
        ...movie,
        attributeIds: JSON.parse(movie.attributeIds) as string[],
      }));
      const deduplicated = deduplicateMovies(parsedMovies);
      return input.limit ? deduplicated.slice(0, input.limit) : deduplicated;
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const movie = await ctx.db.movie.findUnique({ where: { id: input } });
    if (!movie) return null;
    return {
      ...movie,
      attributeIds: JSON.parse(movie.attributeIds) as string[],
    };
  }),

  search: publicProcedure
    .input(z.string().max(100))
    .query(async ({ ctx, input }) => {
      // Split search term into words and filter out empty strings
      const sanitized = input.trim().slice(0, 100);
      const searchWords = sanitized
        .split(/\s+/)
        .filter((word) => word.length > 0);

      if (searchWords.length === 0) {
        return [];
      }

      // Limit number of search terms to prevent performance issues
      if (searchWords.length > 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Too many search terms (max 10)",
        });
      }

    // Check if we're using SQLite (doesn't support mode: "insensitive")
    const isSQLite = isSQLiteDatabase();

    // Build where conditions based on database type
    const whereConditions = searchWords.map((word) => ({
      name: isSQLite
        ? { contains: word }
        : { contains: word, mode: "insensitive" as const },
    }));

    const movies = await ctx.db.movie.findMany({
      where: {
        AND: whereConditions,
      },
    });

    // For SQLite, filter results case-insensitively in JavaScript
    const filteredMovies = isSQLite
      ? movies.filter((movie) =>
          searchWords.every((word) =>
            movie.name.toLowerCase().includes(word.toLowerCase()),
          ),
        )
      : movies;

    const parsedMovies = filteredMovies.map((movie) => ({
      ...movie,
      attributeIds: JSON.parse(movie.attributeIds) as string[],
    }));
    return deduplicateMovies(parsedMovies);
  }),
});
