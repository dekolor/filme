"use client";

import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { LOCATION_CONFIG } from "~/lib/location-config";

// Zod schemas for validation
const LocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  source: z.enum(["gps", "ip", "none"] as const),
});

const IPApiResponseSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  error: z.boolean().optional(),
  reason: z.string().optional(),
});

type Location = z.infer<typeof LocationSchema>;

// Fallback location
const BUCHAREST_FALLBACK = {
  ...LOCATION_CONFIG.FALLBACK_COORDINATES,
  source: "ip" as const,
};

interface UseLocationReturn {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  requestLocation: (allowGPS: boolean) => Promise<void>;
  hasLocationPermission: boolean;
  isInitialized: boolean;
  clearError: () => void;
  resetLocation: () => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.USER_LOCATION);
    if (savedLocation) {
      try {
        const parsed: unknown = JSON.parse(savedLocation);
        const validatedLocation = LocationSchema.parse(parsed);
        setLocation(validatedLocation);
        setHasLocationPermission(true);
      } catch (e) {
        console.warn("Invalid location data in localStorage, removing:", e);
        localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.USER_LOCATION);
      }
    }
    setIsInitialized(true);
  }, []);

  const getIPLocation = async (): Promise<Location> => {
    try {
      // Using ipapi.co which provides free IP geolocation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOCATION_CONFIG.IP_LOCATION_TIMEOUT);
      
      const response = await fetch(LOCATION_CONFIG.IP_LOCATION_API_URL, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`IP location service returned ${response.status}`);
      }
      
      const data: unknown = await response.json();
      
      // Validate the response data
      const validatedData = IPApiResponseSchema.parse(data);
      
      // Check for API errors
      if (validatedData.error) {
        throw new Error(`${LOCATION_CONFIG.ERROR_MESSAGES.INVALID_RESPONSE}: ${validatedData.reason ?? 'Unknown error'}`);
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
          let errorMessage: string = LOCATION_CONFIG.ERROR_MESSAGES.PERMISSION_DENIED;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = LOCATION_CONFIG.ERROR_MESSAGES.PERMISSION_DENIED;
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = LOCATION_CONFIG.ERROR_MESSAGES.POSITION_UNAVAILABLE;
              break;
            case error.TIMEOUT:
              errorMessage = LOCATION_CONFIG.ERROR_MESSAGES.TIMEOUT;
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: LOCATION_CONFIG.GPS_HIGH_ACCURACY,
          timeout: LOCATION_CONFIG.GPS_TIMEOUT,
          maximumAge: LOCATION_CONFIG.LOCATION_CACHE_AGE,
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
      localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.USER_LOCATION, JSON.stringify(newLocation));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to get location";
      setError(errorMessage);
      console.error("Location error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetLocation = useCallback(() => {
    setLocation(null);
    setHasLocationPermission(false);
    setError(null);
    localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.USER_LOCATION);
    localStorage.removeItem(LOCATION_CONFIG.STORAGE_KEYS.PERMISSION_ASKED);
  }, []);

  return {
    location,
    isLoading,
    error,
    requestLocation,
    hasLocationPermission,
    isInitialized,
    clearError,
    resetLocation,
  };
}