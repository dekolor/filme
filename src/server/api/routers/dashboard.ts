import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const DASHBOARD_LIMITS = {
  MOVIES: 4,
  UPCOMING_MOVIES: 4,
  CINEMAS: 20
} as const;

export const dashboardRouter = createTRPCRouter({
  getData: publicProcedure.query(async ({ ctx }) => {
    const now = new Date().toISOString().slice(0, 10);
    
    const [featuredMovie, movies, upcomingMovies, cinemas] = await Promise.all([
      ctx.db.movie.findFirst({
        where: { 
          description: { not: null },
          releaseDate: { lte: now },
          events: {
            some: {
              businessDay: { gte: now },
            },
          },
        },
        orderBy: { tmdbPopularity: "desc" },
      }),
      ctx.db.movie.findMany({
        where: {
          releaseDate: { lte: now },
          events: {
            some: {
              businessDay: { gte: now },
            },
          },
        },
        orderBy: { tmdbPopularity: "desc" },
        take: DASHBOARD_LIMITS.MOVIES,
      }),
      ctx.db.movie.findMany({
        where: {
          releaseDate: { gt: now },
        },
        orderBy: { tmdbPopularity: "desc" },
        take: DASHBOARD_LIMITS.UPCOMING_MOVIES,
      }),
      ctx.db.cinema.findMany({ 
        select: { 
          id: true, 
          displayName: true, 
          imageUrl: true 
        },
        take: DASHBOARD_LIMITS.CINEMAS,
        orderBy: { displayName: "asc" }
      }),
    ]);

    return { 
      featuredMovie, 
      movies, 
      upcomingMovies, 
      cinemas 
    };
  }),
});