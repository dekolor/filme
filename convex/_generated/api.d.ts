/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as cinemas from "../cinemas.js";
import type * as cron from "../cron.js";
import type * as dashboard from "../dashboard.js";
import type * as dataFetcher from "../dataFetcher.js";
import type * as importData from "../importData.js";
import type * as lib_asyncUtils from "../lib/asyncUtils.js";
import type * as lib_distance from "../lib/distance.js";
import type * as lib_movieUtils from "../lib/movieUtils.js";
import type * as movieEvents from "../movieEvents.js";
import type * as movies from "../movies.js";
import type * as triggerFetch from "../triggerFetch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  cinemas: typeof cinemas;
  cron: typeof cron;
  dashboard: typeof dashboard;
  dataFetcher: typeof dataFetcher;
  importData: typeof importData;
  "lib/asyncUtils": typeof lib_asyncUtils;
  "lib/distance": typeof lib_distance;
  "lib/movieUtils": typeof lib_movieUtils;
  movieEvents: typeof movieEvents;
  movies: typeof movies;
  triggerFetch: typeof triggerFetch;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
