"use client";

import Image from "next/image";
import { MapPin, Phone, Clock, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Link from "next/link";
import { api } from "~/trpc/react";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import type { Movie } from "@prisma/client";
import { DateTime } from "luxon";

export default function Cinema({ cinemaId }: { cinemaId: string }) {
  const { data: cinema, isLoading } = api.cinema.getById.useQuery(cinemaId);
  const [movies, setMovies] = useState<Movie[]>([]);

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
    }
  }, [movieEvents]);

  if (!isLoading && !cinema) {
    notFound();
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  const cinemaData = cinema!;
  const movieEventsData = movieEvents!;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="relative mb-6 h-[200px] overflow-hidden rounded-xl md:h-[300px]">
          <Image
            src={cinemaData.imageUrl || "/placeholder.svg"}
            alt={cinemaData.displayName}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white">
              {cinemaData.displayName}
            </h1>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <div className="mb-4 flex items-start gap-2">
              <MapPin className="text-muted-foreground mt-0.5 h-5 w-5" />
              <p>{cinemaData.address}</p>
            </div>
            <div className="mb-4 flex items-start gap-2">
              <Phone className="text-muted-foreground mt-0.5 h-5 w-5" />
              <p>
                {cinemaData.latitude} - {cinemaData.longitude}
              </p>
            </div>
            <p className="mb-4">{cinemaData.link}</p>
          </div>

          <div>
            <h2 className="mb-3 font-semibold">Amenities</h2>
            <div className="grid grid-cols-2 gap-2">
              {/* Fake data, need to update with actual cinema data */}
              {[
                "IMAX",
                "Dolby Atmos",
                "Recliner Seats",
                "Food & Drinks",
                "Parking",
              ].map((amenity) => (
                <div
                  key={amenity}
                  className="bg-muted flex items-center gap-2 rounded-md p-2"
                >
                  <div className="bg-primary h-2 w-2 rounded-full"></div>
                  <span>{amenity}</span>
                </div>
              ))}
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
          {movies.map((movie) => (
            <Card key={movie.id}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="shrink-0 sm:w-[120px] md:w-[180px]">
                    <div className="relative aspect-[2/3] h-full">
                      <Image
                        src={movie.posterLink || "/placeholder.svg"}
                        alt={movie.name}
                        width={180}
                        height={270}
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="mb-4 flex items-start justify-between">
                      <Link
                        href={`/movies/${movie.id}`}
                        className="text-xl font-semibold hover:underline"
                      >
                        {movie.name}
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                      {movieEventsData.map((showtime, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="flex h-auto flex-col py-3"
                        >
                          <span>
                            {" "}
                            {DateTime.fromISO(showtime.eventDateTime).toFormat(
                              "d MMM, HH:mm ",
                            )}
                          </span>
                          <span className="text-muted-foreground mt-1 text-xs">
                            {showtime.auditorium}
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </main>
  );
}
