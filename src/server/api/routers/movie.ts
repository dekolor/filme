import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

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
      const movies = await ctx.db.movie.findMany({
        skip: input.offset,
        take: input.limit,
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
      return movies.map((movie) => ({
        ...movie,
        attributeIds: JSON.parse(movie.attributeIds) as string[],
      }));
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
      const movies = await ctx.db.movie.findMany({
        where: {
          releaseDate: {
            gt: new Date().toISOString(),
          },
        },
        skip: input.offset,
        take: input.limit,
        orderBy: {
          tmdbPopularity: input.orderByPopularity,
        },
      });
      return movies.map((movie) => ({
        ...movie,
        attributeIds: JSON.parse(movie.attributeIds) as string[],
      }));
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
    const searchWords = input.trim().split(/\s+/).filter(word => word.length > 0);

    if (searchWords.length === 0) {
      return [];
    }

    // SQLite doesn't support case-insensitive mode like PostgreSQL
    // Use contains without mode for SQLite compatibility
    const whereConditions = searchWords.map(word => ({
      name: { contains: word }
    }));

    const movies = await ctx.db.movie.findMany({
      where: {
        AND: whereConditions
      },
    });

    return movies.map((movie) => ({
      ...movie,
      attributeIds: JSON.parse(movie.attributeIds) as string[],
    }));
  }),
});
