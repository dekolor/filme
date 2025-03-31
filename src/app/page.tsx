import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import CitySelector from "~/app/_components/city-selector";
import FeaturedMovies from "~/app/_components/featured-movies";
import { HydrateClient } from "~/trpc/server";
import FeaturedCinemas from "./_components/featured-cinemas";

export default function Home() {
  return (
    <HydrateClient>
      <div className="bg-background min-h-screen">
        <header className="bg-secondarytext-primary-foreground py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <Link href="/" className="text-2xl font-bold">
                MovieTime
              </Link>
              <div className="flex w-full items-center gap-2 md:w-auto">
                <CitySelector />
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
          <section className="mb-12">
            <div className="relative mb-6 h-[300px] overflow-hidden rounded-xl md:h-[400px]">
              <Image
                src="https://picsum.photos/1200/400"
                alt="Now showing: Dune Part Two"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6">
                <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">
                  Now Showing: Dune Part Two
                </h1>
                <p className="mb-4 max-w-2xl text-white/80">
                  The saga continues as Paul Atreides unites with the Fremen to
                  seek revenge against the conspirators who destroyed his
                  family.
                </p>
                <Button asChild>
                  <Link href="/movies/dune-part-two">View Showtimes</Link>
                </Button>
              </div>
            </div>
          </section>

          <FeaturedMovies />

          <FeaturedCinemas />
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
}
