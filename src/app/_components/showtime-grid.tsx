import { Calendar, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { MapPin } from "lucide-react";
import { Clock } from "lucide-react";
import { useState, useEffect } from "react";
import type { MovieEvent } from "@prisma/client";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";
import { DateTime } from "luxon";

export default function ShowtimeGrid({
  movieId,
  cinemaId,
}: {
  movieId: string;
  cinemaId: string;
}) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showtimes, setShowtimes] = useState<MovieEvent[] | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  const { data: events, isLoading } =
    api.movieEvent.getByCinemaIdAndMovieId.useQuery({
      cinemaId: Number(cinemaId),
      movieId: movieId,
    });

  useEffect(() => {
    if (events) {
      setShowtimes(events);
      setAvailableDates([...new Set(events.map((event) => event.businessDay))]);
    }
  }, [events]);

  useEffect(() => {
    if (selectedDate === "") {
      setSelectedDate(availableDates[0] ?? "");
    }
  }, [selectedDate, availableDates]);

  // Filter showtimes by selected date
  const filteredShowtimes =
    showtimes?.filter((showtime) => showtime.businessDay === selectedDate) ??
    [];

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Date Selection */}
      <div className="flex flex-wrap gap-2">
        {availableDates.map((date) => (
          <Button
            key={date}
            variant={selectedDate === date ? "default" : "outline"}
            onClick={() => setSelectedDate(date)}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            {date}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      )}

      {/* Showtimes Grid */}
      {!isLoading && (
        <>
          {filteredShowtimes.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredShowtimes.map((showtime) => {
                return (
                  <Card
                    key={showtime.id}
                    className="border-gray-80 hover:bg-card overflow-hidden border bg-black transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex h-full flex-col">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-2 text-xl font-semibold">
                            <Clock className="h-5 w-5 text-yellow-500" />
                            {DateTime.fromISO(showtime.eventDateTime).toFormat(
                              "d MMM, HH:mm ",
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          >
                            Many Seats Available
                          </Badge>
                        </div>

                        <div className="mb-2 flex items-center gap-2 text-gray-400">
                          <MapPin className="h-4 w-4" />
                          {showtime.auditorium}
                        </div>

                        <div className="mt-auto pt-4">
                          <Button
                            variant={"outline"}
                            className="text-primary w-full"
                            onClick={() => {
                              window.open(showtime.bookingLink, "_blank");
                            }}
                          >
                            Book Tickets
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg bg-gray-900/50 p-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-500" />
              <h3 className="mb-2 text-xl font-semibold">
                No Showtimes Available
              </h3>
              <p className="text-gray-400">
                There are no showtimes available for this date. Please select
                another date.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
