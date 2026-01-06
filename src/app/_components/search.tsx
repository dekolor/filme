"use client";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Clock } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";

function MovieSearchCardSkeleton() {
  return (
    <div className="bg-card flex flex-col gap-4 overflow-hidden rounded-lg shadow-sm sm:flex-row">
      <div className="shrink-0 sm:w-[120px] md:w-[180px]">
        <Skeleton className="relative aspect-[2/3] h-full w-full rounded-lg" />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Skeleton className="h-7 w-2/3 max-w-xs rounded" />
          <Skeleton className="h-6 w-16 rounded" />
        </div>
        <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
          <Skeleton className="h-5 w-20 rounded" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16 rounded" />
          <Skeleton className="h-6 w-14 rounded" />
        </div>
        <div className="mt-3">
          <Skeleton className="mb-1 h-4 w-full rounded" />
          <Skeleton className="mb-1 h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-10 w-40 rounded" />
        </div>
      </div>
    </div>
  );
}

function MoviesSearchSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="mb-2 h-8 w-80 max-w-full rounded" />
        <Skeleton className="h-5 w-32 rounded" />
      </div>
      <div className="space-y-6">
        <MovieSearchCardSkeleton key={1} />
        <MovieSearchCardSkeleton key={2} />
      </div>
    </main>
  );
}

export default function SearchResults({ query }: { query: string }) {
  const { data: results, isLoading } = api.movie.search.useQuery(query);

  if (isLoading) {
    return <MoviesSearchSkeleton />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">
          {query ? `Search results for "${query}"` : "All Movies"}
        </h1>
        <p className="text-muted-foreground">
          {results?.length} {results?.length === 1 ? "movie" : "movies"} found
        </p>
      </div>

      <div className="space-y-6">
        {results?.map((movie) => (
          <article
            key={movie.id}
            className="bg-card flex flex-col gap-4 overflow-hidden rounded-lg shadow-sm sm:flex-row"
            data-testid="movie-search-card"
          >
            <div className="shrink-0 sm:w-[120px] md:w-[180px]">
              <div className="relative aspect-[2/3] h-full">
                <Image
                  src={movie.posterLink || "/placeholder.svg"}
                  alt={movie.name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex-1 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="text-xl font-semibold">
                  <Link
                    href={`/movies/${movie.id}`}
                    className="hover:underline"
                  >
                    {movie.name}
                  </Link>
                </h2>
                <Badge variant="outline">{movie.releaseYear}</Badge>
              </div>
              <div className="text-muted-foreground mt-2 flex items-center gap-4 text-sm">
                <div className="flex items-center">
                  <Clock className="mr-1 h-4 w-4" />
                  {movie.length} min
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {movie.attributeIds.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
              <p className="mt-3 line-clamp-2 text-sm md:line-clamp-3">
                {movie.description}
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/movies/${movie.id}`}>View Showtimes</Link>
                </Button>
              </div>
            </div>
          </article>
        ))}

        {results?.length === 0 && (
          <div className="py-12 text-center">
            <h2 className="mb-2 text-xl font-semibold">No movies found</h2>
            <p className="text-muted-foreground mb-6">
              Try searching with different keywords
            </p>
            <Button asChild>
              <Link href="/">Browse All Movies</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
