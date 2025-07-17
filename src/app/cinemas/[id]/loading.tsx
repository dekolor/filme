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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-1/3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            </div>
            <div className="md:w-2/3">
              <Skeleton className="mb-4 h-8 w-3/4" />
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <div className="mb-4 flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Skeleton className="mb-4 h-7 w-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="overflow-hidden rounded-lg border bg-card">
              <Skeleton className="aspect-[2/3] w-full" />
              <div className="p-3">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
              <Skeleton className="aspect-[2/3] w-full" />
              <div className="p-3">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border bg-card">
              <Skeleton className="aspect-[2/3] w-full" />
              <div className="p-3">
                <Skeleton className="mb-2 h-5 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}