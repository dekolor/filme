import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getData: publicProcedure.query(async ({ ctx }) => {
    const [featuredMovie, movies, upcomingMovies, cinemas] = await Promise.all([
      ctx.db.movie.findFirst({
        where: { 
          description: { not: null },
          events: {
            some: {
              businessDay: { gte: new Date().toISOString() },
            },
          },
        },
        orderBy: { tmdbPopularity: "desc" },
      }),
      ctx.db.movie.findMany({
        where: {
          events: {
            some: {
              businessDay: { gte: new Date().toISOString() },
            },
          },
        },
        orderBy: { tmdbPopularity: "desc" },
        take: 4,
      }),
      ctx.db.movie.findMany({
        where: {
          releaseDate: { gt: new Date().toISOString() },
        },
        orderBy: { tmdbPopularity: "desc" },
        take: 4,
      }),
      ctx.db.cinema.findMany({ take: 3 }),
    ]);

    return { 
      featuredMovie, 
      movies, 
      upcomingMovies, 
      cinemas 
    };
  }),
});