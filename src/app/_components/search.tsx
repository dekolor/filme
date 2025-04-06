"use client";
import { api } from "~/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Clock } from "lucide-react";

export default function SearchResults({ query }: { query: string }) {
  const { data: results, isLoading } = api.movie.search.useQuery(query);

  if (isLoading) {
    return <div>Loading...</div>;
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
          <div
            key={movie.id}
            className="bg-card flex flex-col gap-4 overflow-hidden rounded-lg shadow-sm sm:flex-row"
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
                synopsis here
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href={`/movies/${movie.id}`}>View Showtimes</Link>
                </Button>
              </div>
            </div>
          </div>
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
