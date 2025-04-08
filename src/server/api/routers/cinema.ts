import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const cinemaRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.number(),
          groupId: z.string(),
          displayName: z.string(),
          link: z.string(),
          imageUrl: z.string(),
          address: z.string(),
          bookingUrl: z.string(),
          blockOnlineSales: z.boolean(),
          blockOnlineSalesUntil: z.date().nullable(),
          latitude: z.number(),
          longitude: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.cinema.createMany({
        data: input,
        skipDuplicates: true,
      });
    }),

  getAll: publicProcedure
    .input(z.number().optional())
    .query(async ({ ctx, input }) => {
      const cinemas = await ctx.db.cinema.findMany({ take: input });

      return cinemas;
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const cinema = await ctx.db.cinema.findUnique({
      where: { id: Number(input) },
    });

    return cinema;
  }),

  getByMovieId: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const cinemas = await ctx.db.cinema.findMany({
        where: {
          events: { some: { Movie: { id: input } } },
        },
      });

      return cinemas;
    }),
});
