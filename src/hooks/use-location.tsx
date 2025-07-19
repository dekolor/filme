"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";

// Zod schemas for validation
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(["gps", "ip", "none"]),
});

const IPApiResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  error: z.boolean().optional(),
  reason: z.string().optional(),
});

type Location = z.infer<typeof LocationSchema>;

// Constants
const GPS_TIMEOUT = 10000;
const LOCATION_CACHE_AGE = 300000; // 5 minutes
const BUCHAREST_FALLBACK = {
  latitude: 44.4268,
  longitude: 26.1025,
  source: "ip" as const,
};

interface UseLocationReturn {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: (allowGPS: boolean) => Promise<void>;
  hasLocationPermission: boolean;
  isInitialized: boolean;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation) {
      try {
        const parsed: unknown = JSON.parse(savedLocation);
        const validatedLocation = LocationSchema.parse(parsed);
        setLocation(validatedLocation);
        setHasLocationPermission(true);
      } catch (e) {
        console.warn("Invalid location data in localStorage, removing:", e);
        localStorage.removeItem("userLocation");
      }
    }
    setIsInitialized(true);
  }, []);

  const getIPLocation = async (): Promise<Location> => {
    try {
      // Using ipapi.co which provides free IP geolocation
      const response = await fetch("https://ipapi.co/json/", {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`IP location service returned ${response.status}`);
      }
      
      const data: unknown = await response.json();
      
      // Validate the response data
      const validatedData = IPApiResponseSchema.parse(data);
      
      // Check for API errors
      if (validatedData.error) {
        throw new Error(`IP API error: ${validatedData.reason ?? 'Unknown error'}`);
      }
      
      return {
        latitude: validatedData.latitude,
        longitude: validatedData.longitude,
        source: "ip",
      };
    } catch (error) {
      // Fallback to Bucharest, Romania coordinates if IP location fails
      console.warn("IP location failed, using fallback:", error);
      return BUCHAREST_FALLBACK;
    }
  };

  const getGPSLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            source: "gps",
          });
        },
        (error) => {
          let errorMessage = "Location access denied";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: GPS_TIMEOUT,
          maximumAge: LOCATION_CACHE_AGE,
        }
      );
    });
  };

  const requestLocation = useCallback(async (allowGPS: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      let newLocation: Location;

      if (allowGPS) {
        try {
          newLocation = await getGPSLocation();
        } catch (gpsError) {
          console.warn("GPS location failed, falling back to IP:", gpsError);
          newLocation = await getIPLocation();
        }
      } else {
        newLocation = await getIPLocation();
      }

      setLocation(newLocation);
      setHasLocationPermission(true);
      localStorage.setItem("userLocation", JSON.stringify(newLocation));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);
      console.error("Location error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    hasLocationPermission,
    isInitialized,
  };
}