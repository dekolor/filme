import { CinemaDetailsSkeleton } from "~/app/_components/cinema";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <CinemaDetailsSkeleton />
    </div>
  );
}
