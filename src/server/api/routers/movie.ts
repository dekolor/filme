import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { normalizeMovieName } from "~/lib/utils";
import type { Movie } from "@prisma/client";

type MovieWithParsedAttributes = Omit<Movie, "attributeIds"> & {
  attributeIds: string[];
};

/**
 * Deduplicates movies by normalized name, keeping the one with a poster
 * or the highest popularity score.
 */
function deduplicateMovies(
  movies: MovieWithParsedAttributes[],
): MovieWithParsedAttributes[] {
  const movieMap = new Map<string, MovieWithParsedAttributes>();

  for (const movie of movies) {
    const normalizedName = normalizeMovieName(movie.name);
    const existing = movieMap.get(normalizedName);

    if (!existing) {
      movieMap.set(normalizedName, movie);
    } else {
      // Prefer movie with a poster, then by popularity
      const existingHasPoster =
        existing.posterLink && !existing.posterLink.includes("noposter");
      const currentHasPoster =
        movie.posterLink && !movie.posterLink.includes("noposter");

      if (!existingHasPoster && currentHasPoster) {
        movieMap.set(normalizedName, movie);
      } else if (
        existingHasPoster === currentHasPoster &&
        (movie.tmdbPopularity ?? 0) > (existing.tmdbPopularity ?? 0)
      ) {
        movieMap.set(normalizedName, movie);
      }
    }
  }

  return Array.from(movieMap.values());
}

export const movieRouter = createTRPCRouter({
  create: publicProcedure
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
      return ctx.db.movie.createMany({
        data: input.map((movie) => ({
          ...movie,
          attributeIds: JSON.stringify(movie.attributeIds),
        })),
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

  search: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    // Split search term into words and filter out empty strings
    const searchWords = input
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (searchWords.length === 0) {
      return [];
    }

    // Use case-insensitive search for PostgreSQL
    const whereConditions = searchWords.map((word) => ({
      name: { contains: word, mode: "insensitive" as const },
    }));

    const movies = await ctx.db.movie.findMany({
      where: {
        AND: whereConditions,
      },
    });

    const parsedMovies = movies.map((movie) => ({
      ...movie,
      attributeIds: JSON.parse(movie.attributeIds) as string[],
    }));
    return deduplicateMovies(parsedMovies);
  }),
});
