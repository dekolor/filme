/**
 * Movie-related utility functions for Convex
 */

/**
 * Normalizes a movie name by removing language/format suffixes.
 * This helps deduplicate movies that are the same but in different formats.
 *
 * Examples:
 * - "A mouse hunt for Christmas 2D dub" -> "A mouse hunt for Christmas"
 * - "Avatar: Fire and ash Hu dub" -> "Avatar: Fire and ash"
 * - "Five nights at Freddy's 2 HU dub" -> "Five nights at Freddy's 2"
 */
export function normalizeMovieName(name: string): string {
  // Pattern matches common suffixes: "Hu dub", "HU dub", "Ua dub", "2D dub", etc.
  // Also handles standalone "dub" at the end
  return name
    .replace(/\s+(Hu|HU|Ua|UA|2D|3D|4DX)\s+dub$/i, "")
    .replace(/\s+dub$/i, "")
    .trim();
}

/**
 * Minimal movie type for deduplication - only requires fields used in deduplication logic
 */
type DeduplicatableMovie = {
  name: string;
  posterLink: string;
  tmdbPopularity?: number | null;
};

/**
 * Deduplicates movies by normalized name, keeping the one with a poster
 * or the highest popularity score.
 *
 * Works with any movie-like object that has name, posterLink, and tmdbPopularity fields.
 *
 * @param movies - Array of movies to deduplicate
 * @returns Array of deduplicated movies
 */
export function deduplicateMovies<T extends DeduplicatableMovie>(
  movies: T[],
): T[] {
  const movieMap = new Map<string, T>();

  for (const movie of movies) {
    const normalizedName = normalizeMovieName(movie.name);
    const existing = movieMap.get(normalizedName);

    if (!existing) {
      movieMap.set(normalizedName, movie);
    } else {
      // Prefer movie with a poster, then by popularity
      const existingHasPoster =
        existing.posterLink && !existing.posterLink.includes("noposter");
      const currentHasPoster =
        movie.posterLink && !movie.posterLink.includes("noposter");

      if (!existingHasPoster && currentHasPoster) {
        movieMap.set(normalizedName, movie);
      } else if (
        existingHasPoster === currentHasPoster &&
        (movie.tmdbPopularity ?? 0) > (existing.tmdbPopularity ?? 0)
      ) {
        movieMap.set(normalizedName, movie);
      }
    }
  }

  return Array.from(movieMap.values());
}
