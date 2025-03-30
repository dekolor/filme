import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const movieRouter = createTRPCRouter({
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
      return ctx.db.movie.createMany({
        data: input,
        skipDuplicates: true,
      });
    }),

  getAll: publicProcedure
    .input(z.number().optional())
    .query(async ({ ctx, input }) => {
      const movies = await ctx.db.movie.findMany({ take: input });

      return movies;
    }),
});
