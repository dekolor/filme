import { describe, it, expect } from "vitest";
import { normalizeMovieName } from "~/lib/utils";

describe("normalizeMovieName", () => {
  describe("removes language suffixes", () => {
    it("removes 'Hu dub' suffix", () => {
      expect(normalizeMovieName("Avatar: Fire and ash Hu dub")).toBe(
        "Avatar: Fire and ash",
      );
    });

    it("removes 'HU dub' suffix (uppercase)", () => {
      expect(normalizeMovieName("Five nights at Freddy's 2 HU dub")).toBe(
        "Five nights at Freddy's 2",
      );
    });

    it("removes 'Ua dub' suffix", () => {
      expect(normalizeMovieName("Interstellar Ua dub")).toBe("Interstellar");
    });

    it("removes 'UA dub' suffix (uppercase)", () => {
      expect(normalizeMovieName("The Matrix UA dub")).toBe("The Matrix");
    });
  });

  describe("removes format suffixes", () => {
    it("removes '2D dub' suffix", () => {
      expect(normalizeMovieName("A mouse hunt for Christmas 2D dub")).toBe(
        "A mouse hunt for Christmas",
      );
    });

    it("removes '3D dub' suffix", () => {
      expect(normalizeMovieName("Avatar 3D dub")).toBe("Avatar");
    });

    it("removes '4DX dub' suffix", () => {
      expect(normalizeMovieName("Fast and Furious 4DX dub")).toBe(
        "Fast and Furious",
      );
    });
  });

  describe("removes standalone 'dub' suffix", () => {
    it("removes standalone 'dub'", () => {
      expect(normalizeMovieName("The Godfather dub")).toBe("The Godfather");
    });

    it("removes standalone 'dub' case-insensitive", () => {
      expect(normalizeMovieName("Inception DUB")).toBe("Inception");
    });
  });

  describe("handles edge cases", () => {
    it("returns unchanged if no suffix matches", () => {
      expect(normalizeMovieName("The Shawshank Redemption")).toBe(
        "The Shawshank Redemption",
      );
    });

    it("preserves 'dub' in middle of title", () => {
      expect(normalizeMovieName("Dub Masters: The Movie")).toBe(
        "Dub Masters: The Movie",
      );
    });

    it("handles empty string", () => {
      expect(normalizeMovieName("")).toBe("");
    });

    it("handles string with only suffix", () => {
      expect(normalizeMovieName("Hu dub")).toBe("Hu");
    });

    it("handles string with only 'dub'", () => {
      expect(normalizeMovieName("dub")).toBe("dub");
    });

    it("trims whitespace after removal", () => {
      expect(normalizeMovieName("Movie Name   Hu dub")).toBe("Movie Name");
    });

    it("handles multiple spaces before suffix", () => {
      expect(normalizeMovieName("Movie Name    2D dub")).toBe("Movie Name");
    });

    it("does not remove 'dub' if not at end", () => {
      expect(normalizeMovieName("Dub Step Movie")).toBe("Dub Step Movie");
    });

    it("handles titles with numbers", () => {
      expect(normalizeMovieName("Avatar 2 Hu dub")).toBe("Avatar 2");
    });

    it("handles titles with special characters", () => {
      expect(normalizeMovieName("Spider-Man: No Way Home 2D dub")).toBe(
        "Spider-Man: No Way Home",
      );
    });

    it("removes only the last matching suffix", () => {
      expect(normalizeMovieName("Dub Movie 2D dub")).toBe("Dub Movie");
    });
  });

  describe("case-insensitive matching", () => {
    it("matches 'hu dub' (lowercase)", () => {
      expect(normalizeMovieName("Movie hu dub")).toBe("Movie");
    });

    it("matches 'HU DUB' (all caps)", () => {
      expect(normalizeMovieName("Movie HU DUB")).toBe("Movie");
    });

    it("matches 'Hu Dub' (title case)", () => {
      expect(normalizeMovieName("Movie Hu Dub")).toBe("Movie");
    });

    it("matches '2d dub' (lowercase)", () => {
      expect(normalizeMovieName("Movie 2d dub")).toBe("Movie");
    });

    it("matches '3D DUB' (mixed case)", () => {
      expect(normalizeMovieName("Movie 3D DUB")).toBe("Movie");
    });
  });
});
