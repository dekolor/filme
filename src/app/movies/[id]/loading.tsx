import { Skeleton } from "~/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-background min-h-screen">
      <header className="text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              MovieTime
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-8 md:flex-row">
          <div className="md:w-1/3 lg:w-1/4">
            <Skeleton className="aspect-[2/3] w-full rounded-lg shadow-md" />
          </div>
          <div className="md:w-2/3 lg:w-3/4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <Skeleton className="h-10 w-2/3 max-w-xs rounded" />
              <Skeleton className="h-8 w-28 rounded" />
            </div>
            <div className="text-muted-foreground mb-6 flex flex-wrap gap-4 text-sm">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-16 rounded" />
              <Skeleton className="h-7 w-14 rounded" />
              <Skeleton className="h-7 w-20 rounded" />
            </div>
            <div className="mb-6">
              <Skeleton className="mb-2 h-6 w-32 rounded" />
              <Skeleton className="mb-1 h-4 w-full rounded" />
              <Skeleton className="mb-1 h-4 w-5/6 rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
            <Skeleton className="mb-6 h-8 w-40 rounded" />
          </div>
        </div>
      </main>
    </div>
  );
}