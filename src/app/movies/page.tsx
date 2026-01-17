import { fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import MoviesInfiniteList from "~/app/_components/movies-infinite-list";

export const metadata = {
  title: "Browse Movies - MovieTime",
  description: "Browse all currently showing movies at Cinema City Romania",
};

const MOVIES_PER_PAGE = 24;

export default async function MoviesPage() {
  const initialMovies = await fetchQuery(api.movies.getAllMovies, {
    orderByPopularity: "desc",
    limit: MOVIES_PER_PAGE,
    offset: 0,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Now Showing</h1>
        <p className="text-muted-foreground">
          Browse all movies currently showing at Cinema City locations
        </p>
      </div>

      <MoviesInfiniteList initialMovies={initialMovies} />
    </div>
  );
}
