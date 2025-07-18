import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const DASHBOARD_LIMITS = {
  MOVIES: 4,
  UPCOMING_MOVIES: 4,
  CINEMAS: 3
} as const;

export const dashboardRouter = createTRPCRouter({
  getData: publicProcedure.query(async ({ ctx }) => {
    const now = new Date().toISOString();
    
    const [featuredMovie, movies, upcomingMovies, cinemas] = await Promise.all([
      ctx.db.movie.findFirst({
        where: { 
          description: { not: null },
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
        }
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