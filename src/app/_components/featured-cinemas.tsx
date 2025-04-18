"use client";

import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function FeaturedCinemas() {
  const { data: cinemas } = api.cinema.getAll.useQuery(3);

  return (
    <section className="my-12">
      <h2 className="mb-6 text-2xl font-bold">Popular Cinemas</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cinemas?.map((cinema) => (
          <Link
            key={cinema.id}
            href={`/cinemas/${cinema.id}`}
            className="group block"
          >
            <div className="bg-card overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-lg">
              <div className="relative h-40">
                <Image
                  src={cinema.imageUrl}
                  alt={cinema.displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold">{cinema.displayName}</h3>
                <p className="text-muted-foreground text-sm">
                  Multiple screens • Concessions • Parking available
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
