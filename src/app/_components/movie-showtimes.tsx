"use client";

import { useEffect, useState } from "react";
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
import { useLocation } from "~/hooks/use-location";

// Type guard to check if cinema has distance property
function hasDistance(cinema: unknown): cinema is { distance: number } {
  return typeof cinema === 'object' && cinema !== null && 'distance' in cinema && typeof (cinema as Record<string, unknown>).distance === 'number';
}

export default function MovieShowtimes({ movieId, movieLink }: { movieId: string; movieLink?: string }) {
  const [selectedCinema, setSelectedCinema] = useState<string>("");
  const { location } = useLocation();

  const cinemas = useQuery(
    api.cinemas.getCinemasByMovieId,
    {
      movieExternalId: movieId,
      ...(location && {
        userLat: location.latitude,
        userLon: location.longitude,
      }),
    }
  );

  useEffect(() => {
    if (selectedCinema === "" && cinemas) {
      setSelectedCinema(cinemas?.[0]?.externalId.toString() ?? "");
    }
  }, [selectedCinema, cinemas]);

  return (
    <div data-testid="movie-showtimes" className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="w-full sm:w-64">
          <Select value={selectedCinema} onValueChange={setSelectedCinema}>
            <SelectTrigger>
              <SelectValue placeholder="Select Cinema" />
            </SelectTrigger>
            <SelectContent>
              {cinemas?.map((cinema) => (
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

      <ShowtimeGrid movieId={movieId} cinemaId={selectedCinema} movieLink={movieLink} />
    </div>
  );
}
