"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import ShowtimeGrid from "./showtime-grid";

export default function MovieShowtimes({ movieId }: { movieId: string }) {
  const [selectedCinema, setSelectedCinema] = useState<string>("");

  const { data: cinemas } = api.cinema.getByMovieId.useQuery(movieId);

  useEffect(() => {
    if (selectedCinema === "" && cinemas) {
      setSelectedCinema(cinemas?.[0]?.id.toString() ?? "");
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
                <SelectItem key={cinema.id} value={cinema.id.toString()}>
                  {cinema.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ShowtimeGrid movieId={movieId} cinemaId={selectedCinema} />
    </div>
  );
}
