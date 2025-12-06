import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { sortCinemasByDistance } from "~/lib/distance";

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
          bookingUrl: z.string().nullable(),
          blockOnlineSales: z.boolean(),
          blockOnlineSalesUntil: z.date().nullable(),
          latitude: z.number(),
          longitude: z.number(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      // SQLite doesn't support skipDuplicates, so we handle it conditionally
      const isSQLite = process.env.DATABASE_URL?.startsWith("file:");
      if (isSQLite) {
        // For SQLite, insert one by one and ignore conflicts
        let count = 0;
        for (const cinema of input) {
          try {
            await ctx.db.cinema.create({ data: cinema });
            count++;
          } catch {
            // Ignore duplicate key errors
          }
        }
        return { count };
      }
      return ctx.db.cinema.createMany({
        data: input,
        skipDuplicates: true,
      });
    }),

  getAll: publicProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          userLat: z.number().optional(),
          userLon: z.number().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const cinemas = await ctx.db.cinema.findMany({ take: input?.limit });

      // Sort by distance if user location is provided
      if (input?.userLat && input?.userLon) {
        return sortCinemasByDistance(cinemas, input.userLat, input.userLon);
      }

      return cinemas;
    }),

  getById: publicProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const cinema = await ctx.db.cinema.findUnique({
      where: { id: Number(input) },
    });

    return cinema;
  }),

  getByMovieId: publicProcedure
    .input(
      z.union([
        z.string(), // backward compatibility
        z.object({
          movieId: z.string(),
          userLat: z.number().optional(),
          userLon: z.number().optional(),
        }),
      ]),
    )
    .query(async ({ ctx, input }) => {
      // Handle both old string format and new object format
      const movieId = typeof input === "string" ? input : input.movieId;
      const userLat = typeof input === "object" ? input.userLat : undefined;
      const userLon = typeof input === "object" ? input.userLon : undefined;

      const cinemas = await ctx.db.cinema.findMany({
        where: {
          events: { some: { Movie: { id: movieId } } },
        },
      });

      // Sort by distance if user location is provided
      if (userLat && userLon) {
        return sortCinemasByDistance(cinemas, userLat, userLon);
      }

      return cinemas;
    }),
});
