import { Skeleton } from "~/components/ui/skeleton";

function MovieCardSkeleton() {
  return (
    <div className="group overflow-hidden rounded-lg border bg-card">
      <div className="relative aspect-[2/3] overflow-hidden">
        <Skeleton className="absolute inset-0 h-full w-full" />
        <Skeleton className="absolute top-2 left-2 h-6 w-20 rounded-md" />
        <Skeleton className="absolute top-2 right-2 h-6 w-12 rounded-md" />
      </div>
      <div className="p-3">
        <Skeleton className="mb-2 h-6 w-3/4 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
      </div>
    </div>
  );
}

function CinemaCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-lg shadow-md">
      <Skeleton className="relative h-40 w-full" />
      <div className="p-4">
        <Skeleton className="mb-2 h-6 w-3/4 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <header className="bg-secondarytext-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-2xl font-bold">
              MovieTime
            </div>
            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Featured Movie Skeleton */}
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

        {/* Featured Movies Skeleton */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <Skeleton className="h-8 w-32 rounded" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-24 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
            <MovieCardSkeleton />
          </div>
        </section>

        {/* Featured Cinemas Skeleton */}
        <section className="my-12">
          <Skeleton className="mb-6 h-8 w-44 rounded" />
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