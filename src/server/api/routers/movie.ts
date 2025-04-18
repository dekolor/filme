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
        data: input,
        skipDuplicates: true,
      });
    }),

  getAll: publicProcedure
    .input(
      z.object({ limit: z.number().optional(), offset: z.number().optional() }),
    )
    .query(async ({ ctx, input }) => {
      const movies = input
        ? ctx.db.movie.findMany({ skip: input.offset, take: input.limit })
        : ctx.db.movie.findMany();
      return movies;
    }),

  getAllUpcoming: publicProcedure
    .input(
      z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const movies = ctx.db.movie.findMany({
        where: {
          releaseDate: {
            gt: new Date().toISOString(),
          },
        },
        skip: input.offset,
        take: input.limit,
      });
      return movies;
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.movie.findUnique({ where: { id: input } });
  }),

  search: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    return ctx.db.movie.findMany({
      where: { name: { contains: input, mode: "insensitive" } },
    });
  }),
});
