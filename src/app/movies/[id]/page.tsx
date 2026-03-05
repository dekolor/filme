import { fetchQuery } from "convex/nextjs";
import { unstable_cache } from "next/cache";
import { api } from "../../../../convex/_generated/api";
import Movie from "~/app/_components/movie";

const getCachedMovie = unstable_cache(
  async (externalId: string) =>
    fetchQuery(api.movies.getMovieById, { externalId }),
  ["movie-detail"],
  { revalidate: 60 },
);

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const initialMovie = await getCachedMovie(id);

  return (
    <div className="bg-background min-h-screen">
      <Movie movieId={id} initialData={initialMovie} />
    </div>
  );
}
