"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Cinema } from "@prisma/client";
import { Button } from "~/components/ui/button";

interface FeaturedCinemasProps {
  cinemas: Pick<Cinema, 'id' | 'displayName' | 'imageUrl'>[];
}

const SCROLL_AMOUNT = 320;
const SCROLL_ANIMATION_DELAY = 300;
const SCROLL_THRESHOLD = 2;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
        <h2 className="text-2xl font-bold">All Cinemas</h2>
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
    </section>
  );
}
