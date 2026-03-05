import Link from "next/link";
import { fetchQuery } from "convex/nextjs";
import { unstable_cache } from "next/cache";
import { api } from "../../../../convex/_generated/api";
import Cinema from "~/app/_components/cinema";

const getCachedCinema = unstable_cache(
  async (externalId: number) =>
    fetchQuery(api.cinemas.getCinemaById, { externalId }),
  ["cinema-detail"],
  { revalidate: 60 },
);

const getCachedCinemaEvents = unstable_cache(
  async (cinemaExternalId: number) =>
    fetchQuery(api.movieEvents.getEventsByCinemaToday, { cinemaExternalId }),
  ["cinema-events"],
  { revalidate: 60 },
);

export default async function CinemaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cinemaId = parseInt(id);
  const [initialCinema, initialEvents] = await Promise.all([
    getCachedCinema(cinemaId),
    getCachedCinemaEvents(cinemaId),
  ]);

  return (
    <div className="bg-background min-h-screen">
      <header className="text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold">
              MovieTime
            </Link>
          </div>
        </div>
      </header>

      <Cinema
        cinemaId={id}
        initialCinema={initialCinema}
        initialEvents={initialEvents}
      />
    </div>
  );
}
