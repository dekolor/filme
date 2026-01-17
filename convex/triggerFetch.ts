/**
 * Temporary public wrapper to manually trigger data fetch
 * This allows us to call the internal fetchMoviesScheduled function from CLI
 */

import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const manualFetch = action({
  args: {},
  handler: async (ctx) => {
    console.log("🎬 Manually triggering data fetch...");
    await ctx.runAction(internal.dataFetcher.fetchMoviesScheduled);
    return { success: true, message: "Data fetch completed" };
  },
});
