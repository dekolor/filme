"use client";

import { useState, useEffect, useCallback } from "react";

interface Location {
  latitude: number;
  longitude: number;
  source: "gps" | "ip" | "none";
}

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
        const parsed = JSON.parse(savedLocation) as Location;
        setLocation(parsed);
        setHasLocationPermission(true);
      } catch (e) {
        localStorage.removeItem("userLocation");
      }
    }
    setIsInitialized(true);
  }, []);

  const getIPLocation = async (): Promise<Location> => {
    try {
      // Using ipapi.co which provides free IP geolocation
      const response = await fetch("https://ipapi.co/json/");
      if (!response.ok) throw new Error("IP location service unavailable");
      
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          source: "ip",
        };
      }
      throw new Error("Invalid IP location data");
    } catch (error) {
      // Fallback to Bucharest, Romania coordinates if IP location fails
      console.warn("IP location failed, using fallback:", error);
      return {
        latitude: 44.4268,
        longitude: 26.1025,
        source: "ip",
      };
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
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
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