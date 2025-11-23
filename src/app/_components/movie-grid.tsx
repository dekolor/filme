"use client";

import Link from "next/link";
import Image from "next/image";
import { Card } from "~/components/ui/card";

type Movie = {
  id: string;
  name: string;
  posterLink: string;
  releaseYear: string | null;
  length: number;
  attributeIds: string[];
  releaseDate: string;
};

export default function MovieGrid({ movies }: { movies: Movie[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <Link key={movie.id} href={`/movies/${movie.id}`} className="group">
          <Card className="h-full overflow-hidden transition-all hover:scale-105 hover:shadow-lg">
            <div className="relative aspect-[2/3] overflow-hidden">
              <Image
                src={movie.posterLink}
                alt={movie.name}
                fill
                className="object-cover transition-transform group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
              />
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 min-h-[2.5rem] text-sm leading-tight font-semibold">
                {movie.name}
              </h3>
              <p className="text-muted-foreground mt-2 text-xs">
                {movie.releaseYear} • {movie.length} min
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
