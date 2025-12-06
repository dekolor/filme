"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Cinema } from "@prisma/client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useLocation } from "~/hooks/use-location";
import LocationPermissionToast from "./location-permission-dialog";
import { LOCATION_CONFIG } from "~/lib/location-config";
import { CinemaEmptyState } from "~/components/empty-state";
import { CinemaCardSkeleton } from "~/components/ui/skeletons";

// Hook for debouncing location updates
function useDebouncedLocation(
  location: { latitude: number; longitude: number } | null,
  delay: number,
) {
  // Initialize with the location value to avoid unnecessary delay on first render
  const [debouncedLocation, setDebouncedLocation] = useState(location);

  useEffect(() => {
    // If there's no location yet, update immediately when it becomes available
    if (!debouncedLocation && location) {
      setDebouncedLocation(location);
      return;
    }

    // Only debounce subsequent updates
    const handler = setTimeout(() => {
      setDebouncedLocation(location);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [location, delay, debouncedLocation]);

  return debouncedLocation;
}

interface FeaturedCinemasProps {
  cinemas?: Pick<Cinema, "id" | "displayName" | "imageUrl">[];
}

const SCROLL_AMOUNT = 320;
const SCROLL_ANIMATION_DELAY = 300;
const SCROLL_THRESHOLD = 2;
// Using debounce delay from config
const PLACEHOLDER_IMAGE = "/noposter.png"; // Use existing placeholder instead of API

function CinemaCard({
  cinema,
}: {
  cinema: Pick<Cinema, "id" | "displayName" | "imageUrl"> & {
    distance?: number;
  };
}) {
  const [imgSrc, setImgSrc] = useState(cinema.imageUrl);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback to existing placeholder image
      setImgSrc(PLACEHOLDER_IMAGE);
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
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            onError={handleImageError}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{cinema.displayName}</h3>
            {cinema.distance && (
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
    isInitialized,
    requestLocation,
    isLoading: locationLoading,
    error: locationError,
  } = useLocation();

  // Debounce location updates to prevent excessive API calls
  const debouncedLocation = useDebouncedLocation(
    location,
    LOCATION_CONFIG.DEBOUNCE_DELAY,
  );

  // Fetch cinemas with location-based sorting
  const { data: locationSortedCinemas } = api.cinema.getAll.useQuery(
    {
      limit: 20,
      userLat: debouncedLocation?.latitude,
      userLon: debouncedLocation?.longitude,
    },
    {
      enabled: isInitialized && !!debouncedLocation,
    },
  );

  // Determine if we should show loading state
  // Show skeletons when user has saved location but sorted data hasn't loaded yet
  // This prevents the jarring list swap from unsorted to sorted
  const isWaitingForSortedData =
    isInitialized && !!debouncedLocation && !locationSortedCinemas;

  // Use location-sorted cinemas if available, otherwise fallback to static
  const cinemas = useMemo(() => {
    return locationSortedCinemas ?? staticCinemas ?? [];
  }, [locationSortedCinemas, staticCinemas]);

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

    // Check buttons after scroll animation
    setTimeout(checkScrollButtons, SCROLL_ANIMATION_DELAY);
  };

  return (
    <section data-testid="featured-cinemas" className="my-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          All Cinemas
          {(locationLoading || isWaitingForSortedData) && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (sorting by distance...)
            </span>
          )}
          {location && !locationLoading && !isWaitingForSortedData && (
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
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isWaitingForSortedData ? (
        <div className="scrollbar-hide flex gap-6 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0">
              <CinemaCardSkeleton />
            </div>
          ))}
        </div>
      ) : cinemas.length === 0 ? (
        <CinemaEmptyState />
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-6 overflow-x-auto pb-4"
          onScroll={checkScrollButtons}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cinemas.map((cinema) => (
            <div key={cinema.id} className="w-80 flex-shrink-0">
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
