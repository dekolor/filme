import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FeaturedMovies from "~/app/_components/featured-movies";
import FeaturedCinemas from "./_components/featured-cinemas";
import FeaturedMovie from "./_components/featured-movie";
import { api, HydrateClient } from "~/trpc/server";
import { ErrorBoundary } from "~/components/error-boundary";

export default async function Home() {
  try {
    const dashboardData = await api.dashboard.getData();

    return (
      <HydrateClient>
        <div className="bg-background min-h-screen">
          <header className="bg-secondary text-primary-foreground py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
                <Link href="/" className="text-2xl font-bold">
                  MovieTime
                </Link>
                <div className="flex w-full items-center gap-2 md:w-auto">
                  {/* <CitySelector /> */}
                  <form className="relative flex-1 md:w-80" action="/search">
                    <Input
                      type="search"
                      name="query"
                      placeholder="Search for movies..."
                      className="w-full pr-10"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      variant="ghost"
                      className="absolute top-0 right-0 h-full"
                    >
                      <Search className="h-4 w-4" />
                      <span className="sr-only">Search</span>
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </header>

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
      </HydrateClient>
    );
  } catch (error) {
    console.error("Failed to load dashboard data:", error);
    return (
      <div className="bg-background min-h-screen">
        <header className="bg-secondary text-primary-foreground py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <Link href="/" className="text-2xl font-bold">
                MovieTime
              </Link>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <form className="relative flex-1 md:w-80" action="/search">
                  <Input
                    type="search"
                    name="query"
                    placeholder="Search for movies..."
                    className="w-full pr-10"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    className="absolute top-0 right-0 h-full"
                  >
                    <Search className="h-4 w-4" />
                    <span className="sr-only">Search</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </header>

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
