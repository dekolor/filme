"use client";

import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface LocationPermissionToastProps {
  onLocationPermission: (granted: boolean) => void;
}

export default function LocationPermissionToast({
  onLocationPermission,
}: LocationPermissionToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we've already asked for permission
    const hasAskedForLocation = localStorage.getItem("locationPermissionAsked");
    const hasUserLocation = localStorage.getItem("userLocation");
    
    if (!hasAskedForLocation && !hasUserLocation) {
      // Show toast after a shorter delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAllow = () => {
    localStorage.setItem("locationPermissionAsked", "true");
    setIsVisible(false);
    onLocationPermission(true);
  };

  const handleDeny = () => {
    localStorage.setItem("locationPermissionAsked", "true");
    setIsVisible(false);
    onLocationPermission(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("locationPermissionAsked", "true");
    setIsVisible(false);
    onLocationPermission(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-2 fade-in duration-300">
      <div className="bg-black border border-gray-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">
                  Sort cinemas by distance?
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  We'll show you nearby cinemas first
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-500 hover:text-gray-300 ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleAllow}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-1 text-xs font-medium"
              >
                Allow
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDeny}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 px-3 py-1 text-xs"
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