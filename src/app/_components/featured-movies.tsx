"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, Star } from "lucide-react";
import { api } from "~/trpc/react";
import type { Movie } from "@prisma/client";
import { DateTime } from "luxon";
import { Skeleton } from "~/components/ui/skeleton";

export function MovieCardSkeleton() {
  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Skeleton className="absolute inset-0 h-full w-full" />
        <Skeleton className="absolute top-2 left-2 h-6 w-20 rounded-md" />
        <Skeleton className="absolute top-2 right-2 h-6 w-12 rounded-md" />
      </div>
      <CardContent className="p-3">
        <Skeleton className="mb-2 h-6 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

function MoviesTabsSkeleton() {
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-32 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-8 w-24 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
        <MovieCardSkeleton />
      </div>
    </section>
  );
}

export default function FeaturedMovies() {
  const { data: movies, isLoading } = api.movie.getAll.useQuery({
    limit: 4,
    orderByPopularity: "desc",
  });
  const { data: upcomingMovies, isLoading: isUpcomingLoading } =
    api.movie.getAllUpcoming.useQuery({
      limit: 4,
      orderByPopularity: "desc",
    });

  if (isLoading) {
    return <MoviesTabsSkeleton />;
  }

  if (isUpcomingLoading) {
    return <MoviesTabsSkeleton />;
  }

  return (
    <section>
      <Tabs defaultValue="now-showing">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Movies</h2>
          <TabsList>
            <TabsTrigger value="now-showing">Now Showing</TabsTrigger>
            <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="now-showing" className="mt-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {movies!.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coming-soon" className="mt-0">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {upcomingMovies!.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const [imgSrc, setImgSrc] = useState(movie.posterLink || "/noposter.png");

  return (
    <Card className="group overflow-hidden">
      <Link href={`/movies/${movie.id}`}>
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={imgSrc}
            alt={movie.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => {
              setImgSrc("/noposter.png");
            }}
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary">
              {DateTime.fromISO(movie.releaseDate).toLocaleString(
                DateTime.DATE_MED,
              )}
            </Badge>
          </div>
          {movie.releaseYear && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 rounded-md bg-yellow-500 px-1.5 py-0.5 text-xs font-medium text-black">
              <Star className="h-3 w-3 fill-black" />
              {movie.releaseYear}
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-1 font-semibold">{movie.name}</h3>
          <div className="text-muted-foreground mt-1 flex items-center text-xs">
            <Clock className="mr-1 h-3 w-3" />
            {movie.length} min
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
