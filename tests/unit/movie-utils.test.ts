import { describe, it, expect } from "vitest";
import { deduplicateMovies } from "~/lib/movie-utils";

// Helper function to create test movies
function createMovie(
  name: string,
  posterLink: string,
  tmdbPopularity: number | null,
) {
  return {
    name,
    posterLink,
    tmdbPopularity,
  };
}

describe("deduplicateMovies", () => {
  describe("basic deduplication", () => {
    it("returns empty array for empty input", () => {
      expect(deduplicateMovies([])).toEqual([]);
    });

    it("returns single movie unchanged", () => {
      const movies = [createMovie("Avatar", "poster1.jpg", 95.5)];
      expect(deduplicateMovies(movies)).toEqual(movies);
    });

    it("returns unique movies unchanged", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 95.5),
        createMovie("Inception", "poster2.jpg", 88.2),
        createMovie("Interstellar", "poster3.jpg", 82.7),
      ];
      expect(deduplicateMovies(movies)).toEqual(movies);
    });
  });

  describe("deduplication by normalized name", () => {
    it("removes duplicate with exact same name", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 95.5),
        createMovie("Avatar", "poster2.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Avatar");
    });

    it("removes duplicate with language suffix (Hu dub)", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 95.5),
        createMovie("Avatar Hu dub", "poster2.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
    });

    it("removes duplicate with format suffix (2D dub)", () => {
      const movies = [
        createMovie("Inception", "poster1.jpg", 88.2),
        createMovie("Inception 2D dub", "poster2.jpg", 85.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
    });

    it("handles multiple variations of same movie", () => {
      const movies = [
        createMovie("The Matrix", "poster1.jpg", 92.0),
        createMovie("The Matrix Hu dub", "poster2.jpg", 91.0),
        createMovie("The Matrix 2D dub", "poster3.jpg", 90.0),
        createMovie("The Matrix 3D dub", "poster4.jpg", 89.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("The Matrix");
    });
  });

  describe("poster preference logic", () => {
    it("prefers movie with poster over movie without poster", () => {
      const movies = [
        createMovie("Avatar", "noposter.png", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
      expect(result[0]!.name).toBe("Avatar Hu dub");
    });

    it("keeps first movie when both have no poster", () => {
      const movies = [
        createMovie("Avatar", "noposter.png", 95.5),
        createMovie("Avatar Hu dub", "noposter.png", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Avatar");
      expect(result[0]!.tmdbPopularity).toBe(95.5);
    });

    it("keeps first movie when both have posters (with equal popularity)", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 95.5),
        createMovie("Avatar Hu dub", "poster2.jpg", 95.5),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Avatar");
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });

    it("handles null posterLink as no poster", () => {
      const movies = [
        { name: "Avatar", posterLink: null as unknown as string, tmdbPopularity: 95.5 },
        { name: "Avatar Hu dub", posterLink: "poster1.jpg", tmdbPopularity: 90.0 },
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });

    it("handles empty string posterLink as no poster", () => {
      const movies = [
        createMovie("Avatar", "", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });
  });

  describe("popularity preference logic", () => {
    it("prefers higher popularity when both have posters", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 90.0),
        createMovie("Avatar Hu dub", "poster2.jpg", 95.5),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.tmdbPopularity).toBe(95.5);
      expect(result[0]!.name).toBe("Avatar Hu dub");
    });

    it("prefers higher popularity when both have no poster", () => {
      const movies = [
        createMovie("Avatar", "noposter.png", 90.0),
        createMovie("Avatar Hu dub", "noposter.png", 95.5),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.tmdbPopularity).toBe(95.5);
    });

    it("treats null popularity as 0", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", null),
        createMovie("Avatar Hu dub", "poster2.jpg", 95.5),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.tmdbPopularity).toBe(95.5);
    });

    it("handles both null popularities", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", null),
        createMovie("Avatar Hu dub", "poster2.jpg", null),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Avatar");
    });
  });

  describe("priority hierarchy: poster > popularity", () => {
    it("prefers poster even with lower popularity", () => {
      const movies = [
        createMovie("Avatar", "noposter.png", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", 50.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
      expect(result[0]!.tmdbPopularity).toBe(50.0);
    });

    it("prefers poster even with null popularity", () => {
      const movies = [
        createMovie("Avatar", "noposter.png", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", null),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });
  });

  describe("complex scenarios", () => {
    it("handles interleaved duplicates and unique movies", () => {
      const movies = [
        createMovie("Avatar", "poster1.jpg", 95.5),
        createMovie("Inception", "poster2.jpg", 88.2),
        createMovie("Avatar Hu dub", "poster3.jpg", 90.0),
        createMovie("Interstellar", "poster4.jpg", 82.7),
        createMovie("Inception 2D dub", "poster5.jpg", 85.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(3);
      const names = result.map((m) => m.name.replace(/ (Hu|2D) dub$/, ""));
      expect(names).toContain("Avatar");
      expect(names).toContain("Inception");
      expect(names).toContain("Interstellar");
    });

    it("preserves order of first occurrence for unique movies", () => {
      const movies = [
        createMovie("C Movie", "poster3.jpg", 82.7),
        createMovie("A Movie", "poster1.jpg", 95.5),
        createMovie("B Movie", "poster2.jpg", 88.2),
      ];
      const result = deduplicateMovies(movies);
      expect(result[0]!.name).toBe("C Movie");
      expect(result[1]!.name).toBe("A Movie");
      expect(result[2]!.name).toBe("B Movie");
    });

    it("handles many duplicates of same movie", () => {
      const movies = Array.from({ length: 10 }, (_, i) =>
        createMovie(`Avatar ${i === 0 ? "" : "Hu dub"}`, `poster${i}.jpg`, i * 10),
      );
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      // Should pick the one with highest popularity (90)
      expect(result[0]!.tmdbPopularity).toBe(90);
    });

    it("works with additional movie properties", () => {
      const movies = [
        {
          id: "1",
          name: "Avatar",
          posterLink: "poster1.jpg",
          tmdbPopularity: 95.5,
          length: 120,
        },
        {
          id: "2",
          name: "Avatar Hu dub",
          posterLink: "poster2.jpg",
          tmdbPopularity: 90.0,
          length: 120,
        },
      ];
      const result = deduplicateMovies(movies);
      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe("1");
      expect(result[0]!.length).toBe(120);
    });
  });

  describe("edge cases with noposter detection", () => {
    it("detects 'noposter' anywhere in URL", () => {
      const movies = [
        createMovie("Avatar", "https://example.com/noposter/image.jpg", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });

    it("detects 'noposter.png' specifically", () => {
      const movies = [
        createMovie("Avatar", "/images/noposter.png", 95.5),
        createMovie("Avatar Hu dub", "poster1.jpg", 90.0),
      ];
      const result = deduplicateMovies(movies);
      expect(result[0]!.posterLink).toBe("poster1.jpg");
    });

    it("treats actual poster URLs correctly", () => {
      const movies = [
        createMovie("Avatar", "https://example.com/avatar-poster.jpg", 90.0),
        createMovie("Avatar Hu dub", "noposter.png", 95.5),
      ];
      const result = deduplicateMovies(movies);
      expect(result[0]!.posterLink).toBe(
        "https://example.com/avatar-poster.jpg",
      );
    });
  });
});
