"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function FeaturedMovie() {
  const { data: movie, isLoading } = api.movie.getAll.useQuery({
    limit: 1,
    orderByPopularity: "desc",
    hasDescription: true,
  });

  const featuredMovie = movie?.[0];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="mb-12">
      <div className="relative mb-6 h-[300px] overflow-hidden rounded-xl md:h-[400px]">
        <Image
          src={featuredMovie?.posterLink ?? ""}
          alt="Now showing: Dune Part Two"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-6">
          <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">
            Now Showing: {featuredMovie?.name}
          </h1>
          <p className="mb-4 max-w-2xl text-white/80">
            {featuredMovie?.description}
          </p>
          <Button asChild>
            <Link href={`/movies/${featuredMovie?.id}`}>View Showtimes</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
