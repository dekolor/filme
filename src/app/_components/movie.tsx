"use client";

import { Calendar, Clock, MapPin, Star } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Image from "next/image";
import { api } from "~/trpc/react";

import { DateTime } from "luxon";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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

  if (isLoading || cinemasLoading) {
    return <div>Loading...</div>;
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
              <div className="flex items-center gap-1 rounded-md bg-yellow-500 px-2 py-1 text-sm font-medium text-black">
                <Star className="h-4 w-4 fill-black" />
                9.5
              </div>
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
            <h2 className="mb-2 font-semibold">Synopsis</h2>
            <p>synopsis</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-6">
            <div>
              <h2 className="mb-2 font-semibold">Director</h2>
              <p>director</p>
            </div>
            <div>
              <h2 className="mb-2 font-semibold">Cast</h2>
              <ul className="space-y-1">actor list here</ul>
            </div>
          </div>

          <h2 className="mb-6 text-2xl font-bold">Showtimes</h2>

          <Select
            value={selectedCinemaId?.toString() ?? ""}
            onValueChange={(value) => setSelectedCinemaId(Number(value))}
          >
            <SelectTrigger className="right-0 mb-4 w-[180px]">
              <SelectValue placeholder="Cinema" />
            </SelectTrigger>
            <SelectContent>
              {cinemas?.map((cinema) => (
                <SelectItem key={cinema.id} value={cinema.id.toString()}>
                  {cinema.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </main>
  );
}
