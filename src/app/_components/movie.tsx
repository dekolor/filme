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

export default function Movie({ movieId }: { movieId: string }) {
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

          <Tabs defaultValue={cinemas?.[0]?.id.toString()}>
            <TabsList className="mb-4">
              {cinemas?.map((cinema) => (
                <TabsTrigger key={cinema.id} value={cinema.id.toString()}>
                  {cinema.displayName}
                </TabsTrigger>
              ))}
            </TabsList>

            {cinemas!.map((cinema) => (
              <TabsContent key={cinema.id} value={cinema.id.toString()}>
                <Card>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <MapPin className="text-muted-foreground h-5 w-5" />
                      <h3 className="font-semibold">{cinema.displayName}</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {cinema?.events.map((showtime, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="flex h-auto flex-col py-3"
                        >
                          <span>
                            {DateTime.fromISO(
                              showtime.eventDateTime,
                            ).toLocaleString(DateTime.DATETIME_SHORT)}
                          </span>
                          <span className="text-muted-foreground mt-1 text-xs">
                            Sala: {showtime.auditoriumTinyName}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </main>
  );
}
