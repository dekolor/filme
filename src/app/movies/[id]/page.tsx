import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import Movie from "~/app/_components/movie";

async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  try {
    return await queryFn();
  } catch {
    return null;
  }
}

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch movie + cinemas in parallel
  const [initialMovie, initialCinemas] = await Promise.all([
    safeQuery(() => fetchQuery(api.movies.getMovieById, { externalId: id })),
    safeQuery(() => fetchQuery(api.cinemas.getCinemasByMovieId, { movieExternalId: id })),
  ]);

  // Fetch first cinema's showtimes (if cinemas exist)
  const firstCinemaId = initialCinemas?.[0]?.externalId;
  const initialShowtimes = firstCinemaId
    ? await safeQuery(() =>
        fetchQuery(api.movieEvents.getEventsByCinemaAndMovie, {
          movieExternalId: id,
          cinemaExternalId: firstCinemaId,
        }),
      )
    : null;

  return (
    <div className="bg-background min-h-screen">
      <Movie
        movieId={id}
        initialData={initialMovie}
        initialCinemas={initialCinemas}
        initialShowtimes={initialShowtimes}
      />
    </div>
  );
}
