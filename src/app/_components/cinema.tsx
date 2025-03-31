"use client";

import Image from "next/image";
import { MapPin, Phone, Clock, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import Link from "next/link";
import { api } from "~/trpc/react";
import { notFound } from "next/navigation";

// Group movies by date (for this demo, we're just using "Today" and "Tomorrow")
const dates = ["Today", "Tomorrow"];

export default function Cinema({ cinemaId }: { cinemaId: string }) {
  const { data: cinema, isLoading } = api.cinema.getById.useQuery(cinemaId);

  // Only show 404 if we've finished loading and still don't have data
  if (!isLoading && !cinema) {
    notFound();
  }

  // Show loading state or skeleton while data is loading
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  // At this point, we know cinema exists
  const cinemaData = cinema!;

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

      <Tabs defaultValue={dates[0]}>
        <TabsList className="mb-6">
          {dates.map((date) => (
            <TabsTrigger key={date} value={date}>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {dates.map((date) => (
          <TabsContent key={date} value={date} className="space-y-8">
            {[
              {
                id: "dune-part-two",
                title: "Dune: Part Two",
                image: "https://picsum.photos/300/400",
                rating: "PG-13",
                showtimes: [
                  { time: "10:30 AM", format: "Standard" },
                  { time: "1:45 PM", format: "IMAX" },
                  { time: "5:00 PM", format: "Standard" },
                  { time: "8:15 PM", format: "IMAX" },
                  { time: "11:30 PM", format: "Standard" },
                ],
              },
              {
                id: "poor-things",
                title: "Poor Things",
                image: "https://picsum.photos/300/400",
                rating: "R",
                showtimes: [
                  { time: "11:15 AM", format: "Standard" },
                  { time: "2:45 PM", format: "Standard" },
                  { time: "6:15 PM", format: "Standard" },
                  { time: "9:45 PM", format: "Standard" },
                ],
              },
              {
                id: "the-fall-guy",
                title: "The Fall Guy",
                image: "https://picsum.photos/300/400",
                rating: "PG-13",
                showtimes: [
                  { time: "10:45 AM", format: "Standard" },
                  { time: "1:30 PM", format: "Standard" },
                  { time: "4:15 PM", format: "Standard" },
                  { time: "7:00 PM", format: "Standard" },
                  { time: "9:45 PM", format: "Standard" },
                ],
              },
            ].map((movie) => (
              <Card key={movie.id}>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="shrink-0 sm:w-[120px] md:w-[180px]">
                      <div className="relative aspect-[2/3] h-full">
                        <Image
                          src={movie.image || "/placeholder.svg"}
                          alt={movie.title}
                          fill
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
                          {movie.title}
                        </Link>
                      </div>

                      <div className="text-muted-foreground mb-4 flex items-center text-sm">
                        <Clock className="mr-1 h-4 w-4" />
                        {date === "Today"
                          ? "Today's Showtimes"
                          : "Tomorrow's Showtimes"}
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {movie.showtimes.map((showtime, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="flex h-auto flex-col py-3"
                          >
                            <span>{showtime.time}</span>
                            <span className="text-muted-foreground mt-1 text-xs">
                              {showtime.format}
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
        ))}
      </Tabs>
    </main>
  );
}
