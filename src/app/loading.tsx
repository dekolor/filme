import { 
  MovieCardSkeleton, 
  CinemaCardSkeleton, 
  FeaturedMovieSkeleton, 
  HeaderSkeleton, 
  SectionHeaderSkeleton 
} from "~/components/ui/skeletons";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <HeaderSkeleton />

      <main className="container mx-auto px-4 py-8">
        {/* Featured Movie Skeleton */}
        <FeaturedMovieSkeleton />

        {/* Featured Movies Skeleton */}
        <section>
          <SectionHeaderSkeleton />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
          </div>
        </section>

        {/* Featured Cinemas Skeleton */}
        <section className="my-12">
          <SectionHeaderSkeleton width="w-44" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CinemaCardSkeleton />
            <CinemaCardSkeleton />
            <CinemaCardSkeleton />
          </div>
        </section>
      </main>
    </div>
  );
}