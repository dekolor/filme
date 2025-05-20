"use client";

import { Calendar, Clock } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import Image from "next/image";
import { api } from "~/trpc/react";

import { DateTime } from "luxon";
import { useState, useEffect } from "react";

import MovieShowtimes from "./movie-showtimes";
import { Skeleton } from "~/components/ui/skeleton";

export default function Movie({ movieId }: { movieId: string }) {
  const [selectedCinemaId, setSelectedCinemaId] = useState<number | null>(null);
  const { data: movie, isLoading } = api.movie.getById.useQuery(movieId);
  const [imgSrc, setImgSrc] = useState("/noposter.png");

  const { data: cinemas, isLoading: cinemasLoading } =
    api.cinema.getByMovieId.useQuery(movieId);

  useEffect(() => {
    if (movie?.posterLink) {
      setImgSrc(movie.posterLink);
    }
  }, [movie?.posterLink]);

  useEffect(() => {
    if (!selectedCinemaId) {
      setSelectedCinemaId(Number(cinemas?.[0]?.id));
    }
  }, [selectedCinemaId, cinemas]);

  if (isLoading || cinemasLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="md:w-1/3 lg:w-1/4">
            <Skeleton className="relative aspect-[2/3] w-full rounded-lg shadow-md" />
          </div>
          <div className="flex flex-col md:w-2/3 lg:w-3/4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <Skeleton className="h-10 w-2/3 max-w-xs rounded" />
              <Skeleton className="h-8 w-28 rounded" />
            </div>
            <div className="text-muted-foreground mb-6 flex flex-wrap gap-4 text-sm">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-7 w-14 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
            </div>
            <div className="mb-6">
              <Skeleton className="mb-2 h-6 w-32 rounded" />
              <Skeleton className="mb-1 h-4 w-full rounded" />
              <Skeleton className="mb-1 h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <Skeleton className="mb-6 h-8 w-40 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="md:w-1/3 lg:w-1/4">
          <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-md">
            <Image
              src={imgSrc}
              alt={movie?.name ?? ""}
              fill
              className="object-cover"
              priority
              onError={() => {
                setImgSrc("/noposter.png");
              }}
            />
          </div>
        </div>

        <div className="md:w-2/3 lg:w-3/4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <h1 className="text-3xl font-bold">{movie?.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {DateTime.fromISO(movie!.releaseDate).toLocaleString(
                  DateTime.DATE_MED,
                )}
              </Badge>
            </div>
          </div>

          <div className="text-muted-foreground mb-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              {movie?.length} min
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              {DateTime.fromISO(movie!.releaseDate).toLocaleString(
                DateTime.DATE_MED,
              )}
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            {movie?.attributeIds.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="mb-2 font-semibold">Description</h2>
            <p>{movie?.description}</p>
          </div>

          <h2 className="mb-6 text-2xl font-bold">Showtimes</h2>

          <MovieShowtimes movieId={movieId} />
        </div>
      </div>
    </main>
  );
}
