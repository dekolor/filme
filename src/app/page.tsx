"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import FeaturedMovies from "~/app/_components/featured-movies";
import FeaturedCinemas from "./_components/featured-cinemas";
import FeaturedMovie from "./_components/featured-movie";
import { api } from "~/trpc/react";
import { 
  MovieCardSkeleton, 
  CinemaCardSkeleton, 
  FeaturedMovieSkeleton, 
  HeaderSkeleton, 
  SectionHeaderSkeleton 
} from "~/components/ui/skeletons";

function LoadingSkeleton() {
  return (
    <div className="bg-background min-h-screen">
      <HeaderSkeleton />

      <main className="container mx-auto px-4 py-8">
        <FeaturedMovieSkeleton />

        <section>
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
          </div>
        </section>

        <section className="my-12">
          <SectionHeaderSkeleton width="w-44" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CinemaCardSkeleton />
            <CinemaCardSkeleton />
            <CinemaCardSkeleton />
          </div>
        </section>
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
  );
}

export default function Home() {
  const { data: dashboardData, isLoading } = api.dashboard.getData.useQuery();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
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
        <FeaturedMovie movie={dashboardData?.featuredMovie ?? null} />

        <FeaturedMovies 
          movies={dashboardData?.movies ?? []} 
          upcomingMovies={dashboardData?.upcomingMovies ?? []} 
        />

        <FeaturedCinemas cinemas={dashboardData?.cinemas ?? []} />
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
  );
}
