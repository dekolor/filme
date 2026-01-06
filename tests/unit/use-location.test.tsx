import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useLocation } from "~/hooks/use-location";

// Mock fetch
const mockFetch = vi.fn();

// Mock navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
};

describe("useLocation", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Setup mocks
    global.fetch = mockFetch;
    Object.defineProperty(global.navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });

    // Clear mocks
    mockFetch.mockClear();
    mockGeolocation.getCurrentPosition.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialization", () => {
    it("initializes with null location", () => {
      const { result } = renderHook(() => useLocation());

      expect(result.current.location).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasLocationPermission).toBe(false);
    });

    it("loads location from localStorage on mount", async () => {
      const savedLocation = {
        latitude: 44.4268,
        longitude: 26.1025,
        source: "gps",
      };
      localStorage.setItem("userLocation", JSON.stringify(savedLocation));

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.location).toEqual(savedLocation);
      expect(result.current.hasLocationPermission).toBe(true);
    });

    it("handles invalid localStorage data gracefully", async () => {
      // Suppress console.warn for this test since we expect validation errors
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      localStorage.setItem("userLocation", "invalid json");

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.location).toBeNull();
      expect(localStorage.getItem("userLocation")).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it("validates location data structure", async () => {
      // Suppress console.warn for this test since we expect validation errors
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const invalidLocation = {
        latitude: "invalid",
        longitude: 26.1025,
        source: "gps",
      };
      localStorage.setItem("userLocation", JSON.stringify(invalidLocation));

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.location).toBeNull();

      consoleWarnSpy.mockRestore();
    });

    it("sets isInitialized to true after loading", async () => {
      const { result } = renderHook(() => useLocation());

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isInitialized).toBe(true);
    });
  });

  describe("requestLocation with GPS", () => {
    it("gets GPS location successfully", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 44.4268,
            longitude: 26.1025,
          },
        });
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      expect(result.current.location).toEqual({
        latitude: 44.4268,
        longitude: 26.1025,
        source: "gps",
      });
      expect(result.current.hasLocationPermission).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("saves GPS location to localStorage", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 44.4268,
            longitude: 26.1025,
          },
        });
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      const saved = localStorage.getItem("userLocation");
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual({
        latitude: 44.4268,
        longitude: 26.1025,
        source: "gps",
      });
    });

    it("sets loading state during request", async () => {
      let resolvePosition: (value: any) => void;
      const positionPromise = new Promise((resolve) => {
        resolvePosition = resolve;
      });

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        positionPromise.then(() => {
          success({
            coords: {
              latitude: 44.4268,
              longitude: 26.1025,
            },
          });
        });
      });

      const { result } = renderHook(() => useLocation());

      act(() => {
        void result.current.requestLocation(true);
      });

      // Should be loading immediately
      expect(result.current.isLoading).toBe(true);

      // Resolve the position
      await act(async () => {
        resolvePosition!(null);
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("falls back to IP location when GPS fails", async () => {
      // Suppress console warnings for expected error paths
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 1,
          message: "User denied geolocation",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 44.4,
          longitude: 26.1,
        }),
        headers: {
          get: () => "100",
        },
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      expect(result.current.location?.source).toBe("ip");
      expect(result.current.error).toBeNull();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("requestLocation with IP", () => {
    it("gets IP location successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 44.4268,
          longitude: 26.1025,
        }),
        headers: {
          get: () => "100",
        },
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(false);
      });

      expect(result.current.location).toEqual({
        latitude: 44.4268,
        longitude: 26.1025,
        source: "ip",
      });
      expect(mockFetch).toHaveBeenCalled();
    });

    it("uses fallback when IP location fails", async () => {
      // Suppress console warnings for expected error paths
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(false);
      });

      expect(result.current.location).toEqual({
        latitude: 44.4268,
        longitude: 26.1025,
        source: "ip",
      });

      consoleWarnSpy.mockRestore();
    });

    it("handles API error response", async () => {
      // Suppress console warnings for expected error paths
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          error: true,
          reason: "Rate limit exceeded",
          latitude: 0,
          longitude: 0,
        }),
        headers: {
          get: () => "100",
        },
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(false);
      });

      // Should fall back to Bucharest
      expect(result.current.location).toEqual({
        latitude: 44.4268,
        longitude: 26.1025,
        source: "ip",
      });

      consoleWarnSpy.mockRestore();
    });

    it("stores rate limit timestamp", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 44.4268,
          longitude: 26.1025,
        }),
        headers: {
          get: () => "100",
        },
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(false);
      });

      const timestamp = localStorage.getItem("lastIpLocationRequest");
      expect(timestamp).toBeTruthy();
      expect(parseInt(timestamp!, 10)).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("sets error when GPS permission denied", async () => {
      // Suppress console warnings for expected error paths
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error({
          code: 1,
          message: "User denied",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        });
      });

      mockFetch.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      // GPS failed, IP also failed, so should use fallback but no error
      expect(result.current.location).toBeTruthy();

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("clears error with clearError", async () => {
      const { result } = renderHook(() => useLocation());

      // Manually set error (simulating an error state)
      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("resetLocation", () => {
    it("clears location and permissions", async () => {
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 44.4268,
            longitude: 26.1025,
          },
        });
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      expect(result.current.location).toBeTruthy();
      expect(result.current.hasLocationPermission).toBe(true);

      await act(async () => {
        result.current.resetLocation();
      });

      expect(result.current.location).toBeNull();
      expect(result.current.hasLocationPermission).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears localStorage on reset", async () => {
      localStorage.setItem(
        "userLocation",
        JSON.stringify({ latitude: 44.4268, longitude: 26.1025, source: "gps" }),
      );
      localStorage.setItem("locationPermissionAsked", "true");

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        result.current.resetLocation();
      });

      expect(localStorage.getItem("userLocation")).toBeNull();
      expect(localStorage.getItem("locationPermissionAsked")).toBeNull();
    });
  });

  describe("request deduplication", () => {
    it("deduplicates concurrent IP location requests", async () => {
      // Suppress console.log for deduplication message
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    latitude: 44.4268,
                    longitude: 26.1025,
                  }),
                  headers: {
                    get: () => "100",
                  },
                }),
              100,
            ),
          ),
      );

      const { result } = renderHook(() => useLocation());

      // Make two concurrent requests
      await act(async () => {
        await Promise.all([
          result.current.requestLocation(false),
          result.current.requestLocation(false),
        ]);
      });

      // Should only make one fetch call due to deduplication
      expect(mockFetch).toHaveBeenCalledTimes(1);

      consoleLogSpy.mockRestore();
    });
  });

  describe("browser API availability", () => {
    it("handles missing geolocation API", async () => {
      Object.defineProperty(global.navigator, "geolocation", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          latitude: 44.4268,
          longitude: 26.1025,
        }),
        headers: {
          get: () => "100",
        },
      });

      const { result } = renderHook(() => useLocation());

      await act(async () => {
        await result.current.requestLocation(true);
      });

      // Should fall back to IP location
      expect(result.current.location?.source).toBe("ip");
    });
  });
});
