"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Cinema } from "@prisma/client";

interface FeaturedCinemasProps {
  cinemas: Pick<Cinema, 'id' | 'displayName' | 'imageUrl'>[];
}

function CinemaCard({ cinema }: { cinema: Pick<Cinema, 'id' | 'displayName' | 'imageUrl'> }) {
  const [imgSrc, setImgSrc] = useState(cinema.imageUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to a placeholder or default image
      setImgSrc('/api/placeholder/400/160');
    }
  };

  return (
    <Link
      href={`/cinemas/${cinema.id}`}
      className="group block"
      data-testid="featured-cinema"
    >
      <div className="bg-card overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-lg">
        <div className="relative h-40">
          <Image
            src={imgSrc}
            alt={cinema.displayName}
            fill
            className="object-cover"
            onError={handleImageError}
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
  );
}

export default function FeaturedCinemas({ cinemas }: FeaturedCinemasProps) {
  return (
    <section data-testid="featured-cinemas" className="my-12">
      <h2 className="mb-6 text-2xl font-bold">Popular Cinemas</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cinemas.map((cinema) => (
          <CinemaCard key={cinema.id} cinema={cinema} />
        ))}
      </div>
    </section>
  );
}
