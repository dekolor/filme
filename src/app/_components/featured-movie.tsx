import Image from "next/image";
import { Button } from "~/components/ui/button";
import Link from "next/link";

type Movie = {
  externalId: string;
  name: string;
  posterLink: string;
  description?: string;
};

interface FeaturedMovieProps {
  movie: Movie | null | undefined;
}

export default function FeaturedMovie({
  movie: featuredMovie,
}: FeaturedMovieProps) {
  if (!featuredMovie) {
    return null;
  }

  return (
    <div
      data-testid="featured-movie"
      className="relative mb-10 flex h-[340px] items-center overflow-hidden rounded-xl"
    >
      <Image
        src={featuredMovie.posterLink}
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-105 object-cover blur-md brightness-60"
        aria-hidden
      />
      <div className="relative z-10 flex flex-row items-center gap-6 px-6">
        <Image
          src={featuredMovie.posterLink}
          alt={featuredMovie.name}
          width={120}
          height={180}
          priority
          className="hidden rounded-xl shadow-xl md:block"
          style={{ width: "auto", height: "auto" }}
        />
        <div className="flex max-w-lg flex-col">
          <span className="mb-2 w-max rounded bg-white/10 px-3 py-1 text-xs text-white">
            Now Showing
          </span>
          <h1 className="mb-2 text-3xl font-bold text-white">
            {featuredMovie.name}
          </h1>
          <p className="mb-4 text-white/90">{featuredMovie.description}</p>
          <Button asChild>
            <Link href={`/movies/${featuredMovie.externalId}`}>View Showtimes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
