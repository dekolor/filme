import { DateTime } from "luxon";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const movieEventRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.array(
        z.object({
          id: z.string(),
          filmId: z.string(),
          cinemaId: z.number(),
          businessDay: z.string(),
          eventDateTime: z.string(),
          attributes: z.array(z.string()),
          bookingLink: z.string(),
          secondaryBookingLink: z.string().nullable(),
          presentationCode: z.string(),
          soldOut: z.boolean(),
          auditorium: z.string(),
          auditoriumTinyName: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.movieEvent.createMany({
        data: input.map((event) => ({
          ...event,
          attributes: JSON.stringify(event.attributes),
        })),
        skipDuplicates: true,
      });
    }),

  getByCinemaIdAndMovieId: publicProcedure
    .input(z.object({ cinemaId: z.number().optional(), movieId: z.string() }))
    .query(async ({ ctx, input }) => {
      const today = DateTime.now().toFormat("yyyy-MM-dd");
      const events = await ctx.db.movieEvent.findMany({
        where: {
          cinemaId: input.cinemaId,
          filmId: input.movieId,
          businessDay: {
            gte: today,
          },
        },
        include: { Cinema: true },
      });
      return events.map((event) => ({
        ...event,
        attributes: JSON.parse(event.attributes) as string[],
      }));
    }),

  getByCinemaIdToday: publicProcedure
    .input(z.object({ cinemaId: z.number() }))
    .query(async ({ ctx, input }) => {
      const events = await ctx.db.movieEvent.findMany({
        where: {
          cinemaId: input.cinemaId,
          businessDay: {
            equals: DateTime.now().toFormat("yyyy-MM-dd"),
          },
        },
        orderBy: {
          eventDateTime: "asc",
        },
        include: { Movie: true },
      });
      return events.map((event) => ({
        ...event,
        attributes: JSON.parse(event.attributes) as string[],
        Movie: {
          ...event.Movie,
          attributeIds: JSON.parse(event.Movie.attributeIds) as string[],
        },
      }));
    }),
});
