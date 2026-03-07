import { Calendar, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { MapPin } from "lucide-react";
import { Clock } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Skeleton } from "~/components/ui/skeleton";
import { DateTime } from "luxon";

type TransformedMovieEvent = {
  externalId: string;
  eventDateTime: string;
  auditorium: string;
  bookingLink: string;
  businessDay: string;
  attributes: string[];
  Cinema: {
    externalId: number;
    displayName: string;
    address: string;
  } | null;
};

type ShowtimeGridProps = {
  movieId: string;
  cinemaId: string;
  movieLink?: string;
  initialShowtimes?: TransformedMovieEvent[] | null;
};

export default function ShowtimeGrid({
  movieId,
  cinemaId,
  movieLink,
  initialShowtimes,
}: ShowtimeGridProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");

  const liveEvents = useQuery(api.movieEvents.getEventsByCinemaAndMovie, {
    cinemaExternalId: Number(cinemaId),
    movieExternalId: movieId,
  });
  const events = liveEvents ?? initialShowtimes;
  const isLoading = events === undefined;

  const showtimes = events ?? null;
  const availableDates = events
    ? [...new Set(events.map((event) => event.businessDay))].sort()
    : [];

  // Use selectedDate if it's valid, otherwise default to first available date
  const activeDate = selectedDate && availableDates.includes(selectedDate)
    ? selectedDate
    : availableDates[0] ?? "";

  // Filter showtimes by active date
  const filteredShowtimes =
    showtimes?.filter((showtime) => showtime.businessDay === activeDate) ??
    [];

  return (
    <div className="animate-in fade-in space-y-6 duration-300">
      {/* Date Selection */}
      <div className="flex flex-wrap gap-2">
        {availableDates.map((date) => {
          const today = DateTime.now().toFormat("yyyy-MM-dd");
          const tomorrow = DateTime.now()
            .plus({ days: 1 })
            .toFormat("yyyy-MM-dd");

          let displayText = date;
          let customClasses = "";

          if (date === today) {
            displayText = "Today";
            customClasses =
              activeDate === date
                ? "border-yellow-500 bg-yellow-500 text-black hover:bg-yellow-600"
                : "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10";
          } else if (date === tomorrow) {
            displayText = "Tomorrow";
            customClasses =
              activeDate === date
                ? "border-purple-500 bg-purple-500 text-white hover:bg-purple-600"
                : "border-purple-500 text-purple-500 hover:bg-purple-500/10";
          }

          return (
            <Button
              key={date}
              variant={activeDate === date ? "default" : "outline"}
              onClick={() => setSelectedDate(date)}
              className={`flex items-center gap-2 ${customClasses}`}
            >
              <Calendar className="h-4 w-4" />
              {displayText}
            </Button>
          );
        })}
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
                    key={showtime.externalId}
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
                          {/* TODO: Add seat availability badge when seat data is available */}
                          {false && (
                            <Badge
                              variant="outline"
                              className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                            >
                              Many Seats Available
                            </Badge>
                          )}
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
                              window.open(movieLink, "_blank");
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
