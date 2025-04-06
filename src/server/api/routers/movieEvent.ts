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
        data: input,
        skipDuplicates: true,
      });
    }),
});
