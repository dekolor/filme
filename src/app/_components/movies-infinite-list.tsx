"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";
import MovieGrid from "~/app/_components/movie-grid";
import { Loader2 } from "lucide-react";
import { MovieEmptyState } from "~/components/empty-state";

const MOVIES_PER_PAGE = 24;

type Movie = {
  id: string;
  name: string;
  posterLink: string;
  releaseYear: string | null;
  length: number;
  attributeIds: string[];
  releaseDate: string;
};

// Deduplicate movies by ID
function deduplicateById(movies: Movie[]): Movie[] {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    if (seen.has(movie.id)) return false;
    seen.add(movie.id);
    return true;
  });
}

export default function MoviesInfiniteList({
  initialMovies,
}: {
  initialMovies: Movie[];
}) {
  const [movies, setMovies] = useState<Movie[]>(() =>
    deduplicateById(initialMovies),
  );
  const [offset, setOffset] = useState(MOVIES_PER_PAGE);
  const [hasMore, setHasMore] = useState(
    initialMovies.length === MOVIES_PER_PAGE,
  );
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMoreMovies = api.movie.getAll.useQuery(
    {
      orderByPopularity: "desc",
      limit: MOVIES_PER_PAGE,
      offset,
    },
    {
      enabled: false,
    },
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMore &&
          !loadMoreMovies.isFetching
        ) {
          void loadMoreMovies.refetch().then((result) => {
            if (result.data) {
              // Deduplicate by ID when combining with existing movies
              setMovies((prev) => {
                const existingIds = new Set(prev.map((m) => m.id));
                const newUniqueMovies = result.data.filter(
                  (m) => !existingIds.has(m.id),
                );
                return [...prev, ...newUniqueMovies];
              });
              setOffset((prev) => prev + MOVIES_PER_PAGE);
              setHasMore(result.data.length === MOVIES_PER_PAGE);
            }
          });
        }
      },
      { threshold: 0.1 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadMoreMovies, offset]);

  if (movies.length === 0) {
    return <MovieEmptyState />;
  }

  return (
    <div>
      <p className="text-muted-foreground mb-6 text-sm">
        Showing {movies.length} {movies.length === 1 ? "movie" : "movies"}
        {hasMore && " (scroll for more)"}
      </p>

      <MovieGrid movies={movies} />

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="mt-8 flex justify-center">
        {hasMore && loadMoreMovies.isFetching && (
          <div className="text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading more movies...</span>
          </div>
        )}
      </div>

      {!hasMore && movies.length > 0 && (
        <p className="text-muted-foreground mt-8 text-center text-sm">
          You&apos;ve reached the end of the list
        </p>
      )}
    </div>
  );
}
