"use client";

import Image from "next/image";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Link from "next/link";
import { api } from "~/trpc/react";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import type { Movie, MovieEvent } from "@prisma/client";
import { DateTime } from "luxon";
import { Skeleton } from "~/components/ui/skeleton";

function groupShowtimes(showtimes: MovieEvent[]) {
  return {
    Morning: showtimes.filter(
      (s) => DateTime.fromISO(s.eventDateTime).hour < 12,
    ),
    Afternoon: showtimes.filter(
      (s) =>
        DateTime.fromISO(s.eventDateTime).hour >= 12 &&
        DateTime.fromISO(s.eventDateTime).hour < 18,
    ),
    Evening: showtimes.filter(
      (s) =>
        DateTime.fromISO(s.eventDateTime).hour >= 18 &&
        DateTime.fromISO(s.eventDateTime).hour < 22,
    ),
    Night: showtimes.filter(
      (s) => DateTime.fromISO(s.eventDateTime).hour >= 22,
    ),
  };
}

function CinemaMovieCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex shrink-0 justify-center py-4 sm:w-[120px] sm:py-0 sm:pl-4 md:w-[180px]">
            <Skeleton className="relative aspect-[2/3] h-[180px] w-[120px] rounded-xl bg-zinc-800 shadow-lg md:h-[270px] md:w-[180px]" />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <Skeleton className="mb-4 h-8 w-2/3 rounded" />
            <Skeleton className="mb-2 h-6 w-28 rounded" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-16 min-w-[120px] rounded-xl" />
              <Skeleton className="h-16 min-w-[120px] rounded-xl" />
              <Skeleton className="h-16 min-w-[120px] rounded-xl" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CinemaDetailsSkeleton() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="relative mb-6 h-[220px] overflow-hidden rounded-2xl shadow-lg md:h-[340px]">
          <Skeleton className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
            <Skeleton className="h-12 w-2/3 max-w-lg rounded" />
          </div>
        </div>
        <div className="grid gap-6 text-lg md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-56 rounded" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-36 rounded" />
            </div>
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-40 rounded" />
            </div>
          </div>
        </div>
      </div>
      <Skeleton className="mb-6 h-8 w-52 rounded" />
      <div className="mb-6 flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="space-y-8">
        <CinemaMovieCardSkeleton />
        <CinemaMovieCardSkeleton />
        <CinemaMovieCardSkeleton />
      </div>
    </main>
  );
}

export default function Cinema({ cinemaId }: { cinemaId: string }) {
  const { data: cinema, isLoading } = api.cinema.getById.useQuery(cinemaId);
  const [movies, setMovies] = useState<Movie[]>([]);

  const [grouped, setGrouped] = useState<Record<string, MovieEvent[]>>({});

  const { data: movieEvents } = api.movieEvent.getByCinemaIdToday.useQuery({
    cinemaId: parseInt(cinemaId),
  });

  useEffect(() => {
    if (movieEvents) {
      const uniqueMovies = Array.from(
        new Map(
          movieEvents.map((event) => [event.Movie.id, event.Movie]),
        ).values(),
      );
      setMovies(uniqueMovies);

      const grouped = groupShowtimes(movieEvents);
      setGrouped(grouped);
    }
  }, [movieEvents]);

  if (!isLoading && !cinema) {
    notFound();
  }

  if (isLoading) {
    return <CinemaDetailsSkeleton />;
  }

  const cinemaData = cinema!;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-10">
        <div className="relative mb-6 h-[220px] overflow-hidden rounded-2xl shadow-lg md:h-[340px]">
          <Image
            src={cinemaData.imageUrl || "/placeholder.svg"}
            alt={cinemaData.displayName}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white drop-shadow-lg md:text-4xl">
              {cinemaData.displayName}
            </h1>
          </div>
        </div>

        <div className="grid gap-6 text-lg md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="text-primary mt-0.5 h-5 w-5" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cinemaData.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {cinemaData.address}
              </a>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="text-primary mt-0.5 h-5 w-5" />
              <span className="text-muted-foreground">
                {cinemaData.latitude} — {cinemaData.longitude}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ExternalLink className="text-primary mt-0.5 h-5 w-5" />
              <a
                href={cinemaData.link}
                className="break-all hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {cinemaData.link}
              </a>
            </div>
          </div>
        </div>
      </div>

      <h2 className="mb-6 text-2xl font-bold">Movies & Showtimes</h2>

      <Tabs defaultValue="today">
        <TabsList className="mb-6">
          <TabsTrigger value="today">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Today</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-8">
          {movies.length > 0 ? (
            movies.map((movie) => (
              <Card
                key={movie.id}
                className="overflow-hidden rounded-2xl bg-zinc-900 shadow-2xl"
              >
                <CardContent className="p-0">
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="flex shrink-0 justify-center py-4 sm:w-[120px] sm:py-0 sm:pl-4 md:w-[180px]">
                      <div className="relative aspect-[2/3] h-[180px] w-[120px] overflow-hidden rounded-xl bg-zinc-800 shadow-lg md:h-[270px] md:w-[180px]">
                        <Image
                          src={movie.posterLink || "/placeholder.svg"}
                          alt={movie.name}
                          fill
                          className="rounded-xl object-cover"
                          sizes="(max-width: 640px) 120px, 180px"
                        />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-4 flex items-start justify-between">
                        <Link
                          href={`/movies/${movie.id}`}
                          className="text-2xl leading-tight font-bold text-white hover:underline"
                        >
                          {movie.name}
                        </Link>
                      </div>

                      <div className="space-y-4">
                        {Object.entries(grouped).map(
                          ([period, times]) =>
                            times.length > 0 && (
                              <div key={period}>
                                <div className="mb-2 text-lg font-semibold text-zinc-300">
                                  {period}
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {times.map((showtime, idx) => (
                                    <Button
                                      key={idx}
                                      variant="outline"
                                      className="flex h-16 min-w-[120px] flex-col items-center justify-center rounded-xl border-zinc-700 bg-zinc-800/70 shadow-md transition hover:bg-zinc-700"
                                    >
                                      <span className="text-base font-medium text-white">
                                        {DateTime.fromISO(
                                          showtime.eventDateTime,
                                        ).toFormat("d MMM, HH:mm")}
                                      </span>
                                      <span className="mt-1 text-xs text-zinc-400">
                                        {showtime.auditorium}
                                      </span>
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            ),
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <CinemaMovieCardSkeleton />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
