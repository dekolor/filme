"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import ShowtimeGrid from "./showtime-grid";
import { Skeleton } from "~/components/ui/skeleton";
import { useLocation } from "~/hooks/use-location";

// Type guard to check if cinema has distance property
function hasDistance(cinema: unknown): cinema is { distance: number } {
  return typeof cinema === 'object' && cinema !== null && 'distance' in cinema && typeof (cinema as Record<string, unknown>).distance === 'number';
}

type CinemasResult = NonNullable<ReturnType<typeof useQuery<typeof api.cinemas.getCinemasByMovieId>>>;
type ShowtimesResult = NonNullable<ReturnType<typeof useQuery<typeof api.movieEvents.getEventsByCinemaAndMovie>>>;

export type MovieShowtimesInitialData = {
  initialCinemas?: CinemasResult | null;
  initialShowtimes?: ShowtimesResult | null;
};

type MovieShowtimesProps = {
  movieId: string;
  movieLink?: string;
} & MovieShowtimesInitialData;

export default function MovieShowtimes({ movieId, movieLink, initialCinemas, initialShowtimes }: MovieShowtimesProps) {
  const { location } = useLocation();

  const liveCinemas = useQuery(
    api.cinemas.getCinemasByMovieId,
    {
      movieExternalId: movieId,
      ...(location && {
        userLat: location.latitude,
        userLon: location.longitude,
      }),
    }
  );
  const cinemas = liveCinemas ?? initialCinemas;

  // Initialize selectedCinema from initialCinemas to avoid empty first render
  const [selectedCinema, setSelectedCinema] = useState<string>(
    () => initialCinemas?.[0]?.externalId.toString() ?? ""
  );

  // When live cinemas arrive and nothing is selected, pick the first one
  if (selectedCinema === "" && cinemas && cinemas.length > 0) {
    setSelectedCinema(cinemas[0]!.externalId.toString());
  }

  // Only use initialShowtimes if the selected cinema matches the first cinema
  const firstCinemaId = initialCinemas?.[0]?.externalId.toString();
  const showtimesInitial = selectedCinema === firstCinemaId ? initialShowtimes : undefined;

  if (!cinemas) {
    return (
      <div data-testid="movie-showtimes" className="w-full space-y-6">
        <Skeleton className="h-10 w-full sm:w-64 rounded" />
        <Skeleton className="h-32 w-full rounded" />
      </div>
    );
  }

  return (
    <div data-testid="movie-showtimes" className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-64">
          <Select value={selectedCinema} onValueChange={setSelectedCinema}>
            <SelectTrigger>
              <SelectValue placeholder="Select Cinema" />
            </SelectTrigger>
            <SelectContent>
              {cinemas.map((cinema) => (
                <SelectItem key={cinema.externalId} value={cinema.externalId.toString()}>
                  {cinema.displayName}
                  {hasDistance(cinema) && (
                    <span className="text-gray-500 ml-2">
                      ({cinema.distance} km)
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ShowtimeGrid
        movieId={movieId}
        cinemaId={selectedCinema}
        movieLink={movieLink}
        initialShowtimes={showtimesInitial}
      />
    </div>
  );
}
