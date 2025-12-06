import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
