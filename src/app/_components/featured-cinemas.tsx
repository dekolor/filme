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

// Hook for debouncing location updates
function useDebouncedLocation(location: { latitude: number; longitude: number } | null, delay: number) {
  const [debouncedLocation, setDebouncedLocation] = useState(location);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLocation(location);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [location, delay]);

  return debouncedLocation;
}

interface FeaturedCinemasProps {
  cinemas?: Pick<Cinema, 'id' | 'displayName' | 'imageUrl'>[];
}

const SCROLL_AMOUNT = 320;
const SCROLL_ANIMATION_DELAY = 300;
const SCROLL_THRESHOLD = 2;
const LOCATION_DEBOUNCE_DELAY = 500; // 500ms debounce for location updates
const PLACEHOLDER_IMAGE = "/noposter.png"; // Use existing placeholder instead of API

function CinemaCard({ cinema }: { cinema: Pick<Cinema, 'id' | 'displayName' | 'imageUrl'> & { distance?: number } }) {
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
            className="object-cover"
            onError={handleImageError}
          />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{cinema.displayName}</h3>
            {cinema.distance && (
              <span className="text-sm text-blue-500 font-medium">
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

export default function FeaturedCinemas({ cinemas: staticCinemas }: FeaturedCinemasProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const { location, isInitialized, requestLocation } = useLocation();

  // Debounce location updates to prevent excessive API calls
  const debouncedLocation = useDebouncedLocation(location, LOCATION_DEBOUNCE_DELAY);

  // Fetch cinemas with location-based sorting
  const { data: locationSortedCinemas } = api.cinema.getAll.useQuery(
    {
      limit: 20,
      userLat: debouncedLocation?.latitude,
      userLon: debouncedLocation?.longitude,
    },
    {
      enabled: isInitialized && !!debouncedLocation,
    }
  );

  // Use location-sorted cinemas if available, otherwise fallback to static
  const cinemas = useMemo(() => {
    return locationSortedCinemas ?? staticCinemas ?? [];
  }, [locationSortedCinemas, staticCinemas]);

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD);
  };

  useEffect(() => {
    checkScrollButtons();
  }, [cinemas]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    
    const newScrollLeft = scrollRef.current.scrollLeft + 
      (direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT);
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
    
    // Check buttons after scroll animation
    setTimeout(checkScrollButtons, SCROLL_ANIMATION_DELAY);
  };

  return (
    <section data-testid="featured-cinemas" className="my-12">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          All Cinemas
          {location && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              (sorted by distance)
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
        onScroll={checkScrollButtons}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cinemas.map((cinema) => (
          <div key={cinema.id} className="flex-shrink-0 w-80">
            <CinemaCard cinema={cinema} />
          </div>
        ))}
      </div>
      
      <LocationPermissionToast 
        onLocationPermission={(granted) => {
          void requestLocation(granted);
        }}
      />
    </section>
  );
}
