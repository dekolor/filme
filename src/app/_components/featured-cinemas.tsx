"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useLocation } from "~/hooks/use-location";
import LocationPermissionToast from "./location-permission-dialog";
import { CinemaEmptyState } from "~/components/empty-state";

type CinemaData = {
  externalId: number;
  displayName: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
};

interface FeaturedCinemasProps {
  cinemas?: CinemaData[];
}

const SCROLL_AMOUNT = 320;
const SCROLL_ANIMATION_DELAY = 300;
const SCROLL_THRESHOLD = 2;
const PLACEHOLDER_IMAGE = "/noposter.png";

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function CinemaCard({
  cinema,
}: {
  cinema: CinemaData & { distance?: number };
}) {
  const [imgSrc, setImgSrc] = useState(cinema.imageUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(PLACEHOLDER_IMAGE);
    }
  };

  return (
    <Link
      href={`/cinemas/${cinema.externalId}`}
      className="group block"
      data-testid="featured-cinema"
    >
      <div className="bg-card overflow-hidden rounded-lg shadow-md transition-all group-hover:shadow-lg">
        <div className="relative h-40">
          <Image
            src={imgSrc}
            alt={cinema.displayName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={handleImageError}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{cinema.displayName}</h3>
            {cinema.distance !== undefined && !isNaN(cinema.distance) && (
              <span className="text-sm font-medium text-blue-500">
                {cinema.distance} km
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Multiple screens • Concessions • Parking available
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCinemas({
  cinemas: staticCinemas,
}: FeaturedCinemasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const {
    location,
    isLoading: locationLoading,
    requestLocation,
    error: locationError,
  } = useLocation();

  // Sort cinemas client-side by distance — pure math, no network call
  const cinemas = useMemo(() => {
    const list = staticCinemas ?? [];
    if (!location) return list;
    return list
      .map((c) => ({
        ...c,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          c.latitude,
          c.longitude,
        ),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [staticCinemas, location]);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(
      scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD,
    );
  };

  useEffect(() => {
    checkScrollButtons();
  }, [cinemas]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT);

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });

    setTimeout(checkScrollButtons, SCROLL_ANIMATION_DELAY);
  };

  return (
    <section data-testid="featured-cinemas" className="my-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          All Cinemas
          {locationLoading && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (sorting by distance...)
            </span>
          )}
          {location && !locationLoading && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (sorted by distance)
            </span>
          )}
          {locationError && (
            <span className="ml-2 text-sm font-normal text-red-500">
              (location unavailable)
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="h-8 w-8"
            aria-label="Scroll cinemas left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="h-8 w-8"
            aria-label="Scroll cinemas right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {cinemas.length === 0 ? (
        <CinemaEmptyState />
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-6 overflow-x-auto pb-4"
          onScroll={checkScrollButtons}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cinemas.map((cinema) => (
            <div key={cinema.externalId} className="w-80 flex-shrink-0">
              <CinemaCard cinema={cinema} />
            </div>
          ))}
        </div>
      )}

      <LocationPermissionToast
        onLocationPermission={(granted) => {
          void requestLocation(granted);
        }}
      />
    </section>
  );
}
