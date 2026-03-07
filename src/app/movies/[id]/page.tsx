import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import Movie from "~/app/_components/movie";

async function getMovie(externalId: string) {
  try {
    return await fetchQuery(api.movies.getMovieById, { externalId });
  } catch {
    return null;
  }
}

async function getCinemas(movieExternalId: string) {
  try {
    return await fetchQuery(api.cinemas.getCinemasByMovieId, {
      movieExternalId,
    });
  } catch {
    return null;
  }
}

async function getShowtimes(
  movieExternalId: string,
  cinemaExternalId: number,
) {
  try {
    return await fetchQuery(api.movieEvents.getEventsByCinemaAndMovie, {
      movieExternalId,
      cinemaExternalId,
    });
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
    getMovie(id),
    getCinemas(id),
  ]);

  // Fetch first cinema's showtimes (if cinemas exist)
  const firstCinemaId = initialCinemas?.[0]?.externalId;
  const initialShowtimes = firstCinemaId
    ? await getShowtimes(id, firstCinemaId)
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
