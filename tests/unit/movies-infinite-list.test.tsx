import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useQuery } from "convex/react";
import MoviesInfiniteList from "~/app/_components/movies-infinite-list";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
}));

vi.mock("/Users/dekolor/Documents/GitHub/filme/convex/_generated/api", () => ({
  api: {
    movies: {
      getAllMovies: "movies:getAllMovies",
    },
  },
}));

// Mock next/link so tests don't need a router context
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock next/image to avoid DOM attribute warnings
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

// IntersectionObserver mock — must use a regular function so `new` works
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();
const mockUnobserve = vi.fn();

let capturedCallback: IntersectionObserverCallback | null = null;

// Must use a regular function (not arrow) as a constructor
function MockIntersectionObserver(
  callback: IntersectionObserverCallback,
): void {
  capturedCallback = callback;
   
  (this as Record<string, unknown>).observe = mockObserve;
  (this as Record<string, unknown>).disconnect = mockDisconnect;
  (this as Record<string, unknown>).unobserve = mockUnobserve;
   
}

global.IntersectionObserver =
  MockIntersectionObserver as unknown as typeof IntersectionObserver;

const MOVIES_PER_PAGE = 24;

type Movie = {
  externalId: string;
  name: string;
  posterLink: string;
  releaseYear?: string;
  length: number;
  attributeIds: string[];
  releaseDate: string;
};

function makeMovie(id: string, overrides: Partial<Movie> = {}): Movie {
  return {
    externalId: id,
    name: `Movie ${id}`,
    posterLink: `https://example.com/poster-${id}.jpg`,
    releaseYear: "2024",
    length: 120,
    attributeIds: [],
    releaseDate: "2024-01-01",
    ...overrides,
  };
}

function makeMovies(count: number, startId = 1): Movie[] {
  return Array.from({ length: count }, (_, i) => makeMovie(String(startId + i)));
}

describe("MoviesInfiniteList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedCallback = null;
    vi.mocked(useQuery).mockReturnValue(undefined);
  });

  it("shows empty state when initialMovies is empty", () => {
    render(<MoviesInfiniteList initialMovies={[]} />);

    // MovieEmptyState renders "No movies found"
    expect(screen.getByText("No movies found")).toBeInTheDocument();
  });

  it("renders movie count text", () => {
    const movies = makeMovies(5);

    render(<MoviesInfiniteList initialMovies={movies} />);

    expect(screen.getByText(/Showing 5 movies/)).toBeInTheDocument();
  });

  it("deduplicates initial movies with same externalId", () => {
    const duplicateMovies: Movie[] = [
      makeMovie("dup-1", { name: "Duplicated Movie" }),
      makeMovie("dup-1", { name: "Duplicated Movie" }),
      makeMovie("unique-2", { name: "Unique Movie" }),
    ];

    render(<MoviesInfiniteList initialMovies={duplicateMovies} />);

    // Should show 2 movies after deduplication (dup-1 once + unique-2)
    expect(screen.getByText(/Showing 2 movies/)).toBeInTheDocument();
  });

  it("shows '(scroll for more)' when hasMore is true (initialMovies.length === 24)", () => {
    const movies = makeMovies(MOVIES_PER_PAGE);

    render(<MoviesInfiniteList initialMovies={movies} />);

    expect(screen.getByText(/scroll for more/)).toBeInTheDocument();
  });

  it("does NOT show '(scroll for more)' when initialMovies.length < 24", () => {
    const movies = makeMovies(10);

    render(<MoviesInfiniteList initialMovies={movies} />);

    expect(screen.queryByText(/scroll for more/)).not.toBeInTheDocument();
  });

  it("shows \"You've reached the end\" when hasMore is false and movies > 0", () => {
    const movies = makeMovies(10);

    render(<MoviesInfiniteList initialMovies={movies} />);

    // When less than 24 movies, hasMore is false
    expect(screen.getByText(/You've reached the end/)).toBeInTheDocument();
  });

  it("does not fetch more when hasMore is false even when IntersectionObserver fires", () => {
    const movies = makeMovies(5); // less than 24, so hasMore = false
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<MoviesInfiniteList initialMovies={movies} />);

    // Simulate IntersectionObserver firing with entry.isIntersecting = true
    if (capturedCallback) {
      capturedCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    }

    // Count text remains the same (still 5 movies, no additional loading)
    expect(screen.getByText(/Showing 5 movies/)).toBeInTheDocument();

    // No loading spinner should appear since isFetching stays false
    expect(screen.queryByText("Loading more movies...")).not.toBeInTheDocument();
  });
});
