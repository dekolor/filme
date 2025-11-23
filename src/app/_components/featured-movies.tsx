"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, Star, ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { Movie } from "@prisma/client";
import { DateTime } from "luxon";
import { MovieEmptyState, UpcomingMovieEmptyState } from "~/components/empty-state";

interface FeaturedMoviesProps {
  movies: Movie[];
  upcomingMovies: Movie[];
}

export default function FeaturedMovies({ movies, upcomingMovies }: FeaturedMoviesProps) {
  return (
    <section data-testid="featured-movies">
      <Tabs defaultValue="now-showing">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-2xl font-bold">Movies</h2>
          <div className="flex items-center gap-4">
            <TabsList>
              <TabsTrigger value="now-showing">Now Showing</TabsTrigger>
              <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
            </TabsList>
            <Button asChild variant="outline" size="sm">
              <Link href="/movies">
                Browse All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <TabsContent value="now-showing" className="mt-0">
          {movies.length === 0 ? (
            <MovieEmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="coming-soon" className="mt-0">
          {upcomingMovies.length === 0 ? (
            <UpcomingMovieEmptyState />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
              {upcomingMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
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
