import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { cinemaRouter } from "./routers/cinema";
import { movieRouter } from "./routers/movie";
import { movieEventRouter } from "./routers/movieEvent";
import { dashboardRouter } from "./routers/dashboard";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  cinema: cinemaRouter,
  movie: movieRouter,
  movieEvent: movieEventRouter,
  dashboard: dashboardRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
