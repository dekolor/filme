import { MovieDetailsSkeleton } from "~/app/_components/movie";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <MovieDetailsSkeleton />
    </div>
  );
}
