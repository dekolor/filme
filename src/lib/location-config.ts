/**
 * Configuration constants for location-related features
 */
export const LOCATION_CONFIG = {
  // GPS and geolocation settings
  GPS_TIMEOUT: 10000, // 10 seconds
  GPS_HIGH_ACCURACY: true,
  LOCATION_CACHE_AGE: 300000, // 5 minutes

  // UI timing
  PERMISSION_DIALOG_DELAY: 1500, // 1.5 seconds
  DEBOUNCE_DELAY: 500, // 500ms for location updates

  // Fallback coordinates (Bucharest, Romania)
  FALLBACK_COORDINATES: {
    latitude: 44.4268,
    longitude: 26.1025,
  },

  // API settings
  IP_LOCATION_TIMEOUT: 5000, // 5 seconds
  IP_LOCATION_API_URL: 'https://ipapi.co/json/',
  IP_LOCATION_MAX_RESPONSE_SIZE: 1024 * 10, // 10KB max response
  IP_LOCATION_RATE_LIMIT_MS: 60000, // 1 minute between requests

  // Local storage keys
  STORAGE_KEYS: {
    USER_LOCATION: 'userLocation',
    PERMISSION_ASKED: 'locationPermissionAsked',
    LAST_IP_REQUEST: 'lastIpLocationRequest',
  },

  // Error messages
  ERROR_MESSAGES: {
    PERMISSION_DENIED: 'Location access denied',
    POSITION_UNAVAILABLE: 'Location information unavailable',
    TIMEOUT: 'Location request timed out',
    NETWORK_ERROR: 'Network error while getting location',
    INVALID_RESPONSE: 'Invalid location data received',
  },
} as const;

export type LocationSource = 'gps' | 'ip' | 'none';