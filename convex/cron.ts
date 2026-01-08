/**
 * Convex cron job configuration
 *
 * This replaces the Vercel cron job at /api/cron/fetch-movies
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run every night at 2 AM UTC
crons.daily(
  "fetch movie data",
  { hourUTC: 2, minuteUTC: 0 },
  internal.dataFetcher.fetchMoviesScheduled,
);

export default crons;
