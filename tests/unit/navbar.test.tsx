import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname } from "next/navigation";
import Navbar from "~/app/_components/navbar";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/"),
}));

// Mock next/link to render a plain anchor so hrefs are testable
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: unknown;
  }) => (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  ),
}));

// Mock window.location
Object.defineProperty(window, "location", {
  value: { href: "" },
  writable: true,
});

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
    vi.mocked(usePathname).mockReturnValue("/");
  });

  it("renders the MovieTime logo link", () => {
    render(<Navbar />);

    const logoLink = screen.getByRole("link", { name: /MovieTime/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("renders Home and Movies nav links", () => {
    render(<Navbar />);

    expect(screen.getByRole("link", { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^Movies$/i })).toBeInTheDocument();
  });

  it("Home link has active styling on '/' path and Movies link is muted", () => {
    vi.mocked(usePathname).mockReturnValue("/");

    render(<Navbar />);

    const homeLink = screen.getByRole("link", { name: /^Home$/i });
    const moviesLink = screen.getByRole("link", { name: /^Movies$/i });

    expect(homeLink.className).toContain("text-foreground");
    expect(moviesLink.className).toContain("text-muted-foreground");
  });

  it("Movies link has active styling on '/movies' path", () => {
    vi.mocked(usePathname).mockReturnValue("/movies");

    render(<Navbar />);

    const homeLink = screen.getByRole("link", { name: /^Home$/i });
    const moviesLink = screen.getByRole("link", { name: /^Movies$/i });

    expect(moviesLink.className).toContain("text-foreground");
    expect(homeLink.className).toContain("text-muted-foreground");
  });

  it("search form submits and navigates to /search?query=avatar", async () => {
    const user = userEvent.setup();

    render(<Navbar />);

    const input = screen.getByPlaceholderText(/Search for movies/i);
    await user.type(input, "avatar");

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(window.location.href).toBe("/search?query=avatar");
  });

  it("empty search does NOT navigate", async () => {
    const user = userEvent.setup();

    render(<Navbar />);

    const input = screen.getByPlaceholderText(/Search for movies/i);
    // Type only whitespace
    await user.type(input, "   ");

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(window.location.href).toBe("");
  });

  it("URL-encodes special characters in search query", async () => {
    const user = userEvent.setup();

    render(<Navbar />);

    const input = screen.getByPlaceholderText(/Search for movies/i);
    await user.type(input, "Spider-Man: No Way Home");

    const form = input.closest("form")!;
    fireEvent.submit(form);

    expect(window.location.href).toBe(
      `/search?query=${encodeURIComponent("Spider-Man: No Way Home")}`,
    );
  });

  it("search icon button triggers form submit", async () => {
    const user = userEvent.setup();

    render(<Navbar />);

    const input = screen.getByPlaceholderText(/Search for movies/i);
    await user.type(input, "batman");

    const searchButton = screen.getByRole("button", { name: /Search/i });
    await user.click(searchButton);

    expect(window.location.href).toBe("/search?query=batman");
  });
});
