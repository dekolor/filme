import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useQuery } from "convex/react";
import ShowtimeGrid from "~/app/_components/showtime-grid";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("/Users/dekolor/Documents/GitHub/filme/convex/_generated/api", () => ({
  api: {
    movieEvents: {
      getEventsByCinemaAndMovie: "movieEvents:getEventsByCinemaAndMovie",
    },
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

// Suppress next/image warnings in tests
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

type TransformedMovieEvent = {
  externalId: string;
  eventDateTime: string;
  auditorium: string;
  bookingLink: string;
  businessDay: string;
  attributes: string[];
  Cinema: {
    externalId: number;
    displayName: string;
    address: string;
  } | null;
};

function makeEvent(overrides: Partial<TransformedMovieEvent> = {}): TransformedMovieEvent {
  return {
    externalId: "evt-1",
    eventDateTime: "2025-01-15T14:00:00",
    auditorium: "Hall 1",
    bookingLink: "https://example.com/book",
    businessDay: "2025-01-15",
    attributes: [],
    Cinema: {
      externalId: 1,
      displayName: "Cinema City",
      address: "Str. Example 1",
    },
    ...overrides,
  };
}

const defaultProps = {
  movieId: "movie-123",
  cinemaId: "1",
  movieLink: "https://example.com/movie",
};

describe("ShowtimeGrid", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading skeleton when useQuery returns undefined", () => {
    vi.mocked(useQuery).mockReturnValue(undefined);

    render(<ShowtimeGrid {...defaultProps} />);

    // Skeletons are rendered via the Skeleton component; check they appear in the DOM
    // The loading state renders multiple Skeleton elements
    // The component renders a <div className="space-y-4"> wrapping skeletons when isLoading
    const spacedDivs = document.querySelectorAll(".space-y-4");
    expect(spacedDivs.length).toBeGreaterThan(0);
  });

  it("renders date buttons for each unique businessDay", () => {
    const events: TransformedMovieEvent[] = [
      makeEvent({ externalId: "e1", businessDay: "2025-01-15", eventDateTime: "2025-01-15T10:00:00" }),
      makeEvent({ externalId: "e2", businessDay: "2025-01-15", eventDateTime: "2025-01-15T14:00:00" }),
      makeEvent({ externalId: "e3", businessDay: "2025-01-16", eventDateTime: "2025-01-16T10:00:00" }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    // Two unique dates — each gets a button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("labels today's date as 'Today'", () => {
    const today = new Date().toISOString().slice(0, 10);
    const events: TransformedMovieEvent[] = [
      makeEvent({
        externalId: "e1",
        businessDay: today,
        eventDateTime: `${today}T10:00:00`,
      }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  it("labels tomorrow's date as 'Tomorrow'", () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const events: TransformedMovieEvent[] = [
      makeEvent({
        externalId: "e1",
        businessDay: tomorrow,
        eventDateTime: `${tomorrow}T10:00:00`,
      }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });

  it("shows 'No Showtimes Available' when no events match selected date", () => {
    // Return events for only one date. After render the first date is selected.
    // Then click on a date that has no events — we achieve this by having only
    // one date selected but checking the empty state by rendering with empty events.
    vi.mocked(useQuery).mockReturnValue([] as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    expect(screen.getByText("No Showtimes Available")).toBeInTheDocument();
  });

  it("filters showtimes by selected date after clicking a different date button", () => {
    const events: TransformedMovieEvent[] = [
      makeEvent({
        externalId: "e1",
        businessDay: "2025-01-15",
        eventDateTime: "2025-01-15T10:00:00",
        auditorium: "Hall A",
      }),
      makeEvent({
        externalId: "e2",
        businessDay: "2025-01-16",
        eventDateTime: "2025-01-16T12:00:00",
        auditorium: "Hall B",
      }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    // The first date (2025-01-15) is selected by default, showing Hall A
    expect(screen.getByText("Hall A")).toBeInTheDocument();
    expect(screen.queryByText("Hall B")).not.toBeInTheDocument();

    // Click the second date button (2025-01-16)
    const buttons = screen.getAllByRole("button");
    // The second date button is the one with "2025-01-16"
    const secondDateButton = buttons.find((b) => b.textContent?.includes("2025-01-16"));
    expect(secondDateButton).toBeDefined();
    fireEvent.click(secondDateButton!);

    // Now Hall B should be visible and Hall A should not
    expect(screen.getByText("Hall B")).toBeInTheDocument();
    expect(screen.queryByText("Hall A")).not.toBeInTheDocument();
  });

  it("defaults to first available date on initial render", () => {
    const events: TransformedMovieEvent[] = [
      makeEvent({
        externalId: "e1",
        businessDay: "2025-01-14",
        eventDateTime: "2025-01-14T09:00:00",
        auditorium: "Hall First",
      }),
      makeEvent({
        externalId: "e2",
        businessDay: "2025-01-15",
        eventDateTime: "2025-01-15T10:00:00",
        auditorium: "Hall Second",
      }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    // The first date (sorted) should be selected by default
    expect(screen.getByText("Hall First")).toBeInTheDocument();
    expect(screen.queryByText("Hall Second")).not.toBeInTheDocument();
  });

  it("renders showtime cards with time and auditorium info", () => {
    const events: TransformedMovieEvent[] = [
      makeEvent({
        externalId: "e1",
        businessDay: "2025-01-15",
        eventDateTime: "2025-01-15T14:00:00",
        auditorium: "Hall 3",
      }),
    ];

    vi.mocked(useQuery).mockReturnValue(events as unknown as ReturnType<typeof useQuery>);

    render(<ShowtimeGrid {...defaultProps} />);

    // Auditorium name should be visible
    expect(screen.getByText("Hall 3")).toBeInTheDocument();

    // Book Tickets button should appear
    expect(screen.getByText("Book Tickets")).toBeInTheDocument();
  });
});
