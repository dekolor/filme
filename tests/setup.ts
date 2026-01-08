/**
 * Vitest setup file for unit tests
 */

import { vi } from "vitest";
import { type ReactNode } from "react";

// Mock Convex React hooks
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  ConvexProvider: ({ children }: { children: ReactNode }) => children,
  ConvexReactClient: vi.fn(),
}));

// Mock Convex Next.js utilities
vi.mock("convex/nextjs", () => ({
  fetchQuery: vi.fn(),
  fetchMutation: vi.fn(),
}));
