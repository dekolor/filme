import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import SearchResults from "~/app/_components/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const { query } = await searchParams;

  return (
    <div className="bg-background min-h-screen">
      <header className="text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <Link href="/" className="text-2xl font-bold">
              MovieTime
            </Link>
            <form className="relative w-full md:w-96" action="/search">
              <Input
                type="search"
                name="query"
                placeholder="Search for movies..."
                className="w-full pr-10"
                defaultValue={query}
              />
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute top-0 right-0 h-full"
              >
                <Search className="h-4 w-4" />
                <span className="sr-only">Search</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <SearchResults query={query!} />
    </div>
  );
}
