import Link from "next/link";
import { Button } from "~/components/ui/button";
import FeaturedMovies from "~/app/_components/featured-movies";
import FeaturedCinemas from "./_components/featured-cinemas";
import FeaturedMovie from "./_components/featured-movie";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ErrorBoundary } from "~/components/error-boundary";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

const getCachedDashboardData = unstable_cache(
  async () => fetchQuery(api.dashboard.getDashboardData, {}),
  ["dashboard-data"],
  { revalidate: 60 },
);

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function getUserLocation(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  const locationCookie = cookieStore.get("user_location");
  if (!locationCookie) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(locationCookie.value)) as { latitude: number; longitude: number };
    if (typeof parsed.latitude === "number" && typeof parsed.longitude === "number") {
      return parsed;
    }
  } catch { /* ignore */ }
  return null;
}

export default async function Home() {
  try {
    const [dashboardData, cookieStore] = await Promise.all([
      getCachedDashboardData(),
      cookies(),
    ]);

    const userLocation = getUserLocation(cookieStore);
    const sortedCinemas = userLocation
      ? dashboardData.cinemas
          .map((c) => ({
            ...c,
            distance: calculateDistance(userLocation.latitude, userLocation.longitude, c.latitude, c.longitude),
          }))
          .sort((a, b) => a.distance - b.distance)
      : dashboardData.cinemas;

    return (
      <>
        <div className="bg-background min-h-screen">
          <main className="container mx-auto px-4 py-8">
            <ErrorBoundary>
              <FeaturedMovie movie={dashboardData.featuredMovie} />
            </ErrorBoundary>

            <ErrorBoundary>
              <FeaturedMovies
                movies={dashboardData.movies}
                upcomingMovies={dashboardData.upcomingMovies}
              />
            </ErrorBoundary>

            <ErrorBoundary>
              <FeaturedCinemas cinemas={sortedCinemas} />
            </ErrorBoundary>
          </main>

          <footer className="bg-muted py-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between md:flex-row">
                <p className="text-muted-foreground">
                  © 2025 MovieTime. All rights reserved.
                </p>
                <div className="mt-4 flex gap-6 md:mt-0">
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    About
                  </Link>
                  <Link
                    href="/contact"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Contact
                  </Link>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Privacy
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </>
    );
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return (
      <div className="bg-background min-h-screen">
        <main className="container mx-auto px-4 py-8">
          <div className="flex min-h-[400px] flex-col items-center justify-center">
            <h1 className="mb-4 text-2xl font-bold">Unable to load content</h1>
            <p className="mb-4 text-muted-foreground">
              We&apos;re experiencing some technical difficulties. Please try refreshing the page.
            </p>
            <Button asChild>
              <Link href="/">Refresh</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }
}
