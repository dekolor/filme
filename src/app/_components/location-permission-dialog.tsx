"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { LOCATION_CONFIG } from "~/lib/location-config";

interface LocationPermissionToastProps {
  onLocationPermission: (granted: boolean) => void;
}

export default function LocationPermissionToast({
  onLocationPermission,
}: LocationPermissionToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if we've already asked for permission
    const hasAskedForLocation = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.PERMISSION_ASKED);
    const hasUserLocation = localStorage.getItem(LOCATION_CONFIG.STORAGE_KEYS.USER_LOCATION);
    
    if (!hasAskedForLocation && !hasUserLocation) {
      // Show toast after a shorter delay
      timerRef.current = setTimeout(() => {
        setIsVisible(true);
      }, LOCATION_CONFIG.PERMISSION_DIALOG_DELAY);
    }
    
    // Cleanup function to clear timer on unmount
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleAllow = () => {
    localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.PERMISSION_ASKED, "true");
    setIsVisible(false);
    onLocationPermission(true);
  };

  const handleDeny = () => {
    localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.PERMISSION_ASKED, "true");
    setIsVisible(false);
    onLocationPermission(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(LOCATION_CONFIG.STORAGE_KEYS.PERMISSION_ASKED, "true");
    setIsVisible(false);
    onLocationPermission(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-300"
      role="dialog"
      aria-labelledby="location-permission-title"
      aria-describedby="location-permission-description"
      aria-live="polite"
    >
      <div className="bg-black border border-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p id="location-permission-title" className="text-sm font-medium text-white">
                  Sort cinemas by distance?
                </p>
                <p id="location-permission-description" className="text-xs text-gray-400 mt-1">
                  We&apos;ll show you nearby cinemas first
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-300 ml-2"
                aria-label="Dismiss location permission dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleAllow}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 text-xs font-medium"
                aria-label="Allow location access to sort cinemas by distance"
              >
                Allow
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDeny}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-3 py-1 text-xs"
                aria-label="Deny location access"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}