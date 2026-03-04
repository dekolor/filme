import Link from "next/link";
import { Button } from "~/components/ui/button";
import FeaturedMovies from "~/app/_components/featured-movies";
import FeaturedCinemas from "./_components/featured-cinemas";
import FeaturedMovie from "./_components/featured-movie";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import { ErrorBoundary } from "~/components/error-boundary";
import { unstable_cache } from "next/cache";

const getCachedDashboardData = unstable_cache(
  async () => {
    const data = await fetchQuery(api.dashboard.getDashboardData, {});
    // Throw on empty to prevent caching startup/warmup misses
    if (data.movies.length === 0 && data.cinemas.length === 0) {
      throw new Error("EMPTY_DASHBOARD");
    }
    return data;
  },
  ["dashboard-data"],
  { revalidate: 60 },
);

async function getDashboardData() {
  try {
    return await getCachedDashboardData();
  } catch {
    // Cache miss or empty data — fetch directly
    return await fetchQuery(api.dashboard.getDashboardData, {});
  }
}

export default async function Home() {
  try {
    const dashboardData = await getDashboardData();

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
              <FeaturedCinemas cinemas={dashboardData.cinemas} />
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
