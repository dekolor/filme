"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { api } from "~/trpc/react";
import { Skeleton } from "~/components/ui/skeleton";

export default function FeaturedMovie() {
  const { data: movie, isLoading } = api.movie.getAll.useQuery({
    limit: 1,
    orderByPopularity: "desc",
    hasDescription: true,
  });

  const featuredMovie = movie?.[0];

  if (isLoading) {
    return (
      <div className="bg-muted relative mb-10 flex h-[340px] items-center overflow-hidden rounded-xl">
        <Skeleton className="absolute inset-0 scale-105 object-cover blur-md brightness-60" />

        <div className="relative z-10 flex w-full flex-row items-center gap-6 px-6">
          <Skeleton className="hidden h-[180px] w-[120px] rounded-xl shadow-xl md:block" />
          <div className="flex max-w-lg flex-1 flex-col">
            <Skeleton className="mb-2 h-6 w-24 rounded bg-white/10" />
            <Skeleton className="mb-2 h-10 w-3/4 rounded" />
            <Skeleton className="mb-4 h-4 w-full rounded" />
            <Skeleton className="mb-1 h-4 w-5/6 rounded" />
            <Skeleton className="mb-4 h-4 w-2/3 rounded" />
            <Skeleton className="h-10 w-40 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="featured-movie" className="relative mb-10 flex h-[340px] items-center overflow-hidden rounded-xl">
      <Image
        src={featuredMovie?.posterLink ?? ""}
        alt=""
        fill
        className="scale-105 object-cover blur-md brightness-60"
        aria-hidden
      />
      <div className="relative z-10 flex flex-row items-center gap-6 px-6">
        <Image
          src={featuredMovie?.posterLink ?? ""}
          alt={featuredMovie?.name ?? ""}
          width={120}
          height={180}
          className="hidden rounded-xl shadow-xl md:block"
        />
        <div className="flex max-w-lg flex-col">
          <span className="mb-2 w-max rounded bg-white/10 px-3 py-1 text-xs text-white">
            Now Showing
          </span>
          <h1 className="mb-2 text-3xl font-bold text-white">
            {featuredMovie?.name}
          </h1>
          <p className="mb-4 text-white/90">{featuredMovie?.description}</p>
          <Button asChild>
            <Link href={`/movies/${featuredMovie?.id}`}>View Showtimes</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
