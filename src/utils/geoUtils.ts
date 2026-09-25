import { GeoLocationData } from '../types';

// Default Office HQ coordinates (Astute Experience Marina Bay / Tech Hub)
export const OFFICE_COORDINATES = {
  latitude: 1.2838,
  longitude: 103.8591,
  radiusMeters: 250, // 250m geofence radius
  name: 'Astute Tech Park HQ, Tower B',
};

// Calculate distance between two lat/lng in meters using Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function isWithinOfficeZone(latitude: number, longitude: number): boolean {
  const distance = calculateDistanceMeters(
    latitude,
    longitude,
    OFFICE_COORDINATES.latitude,
    OFFICE_COORDINATES.longitude
  );
  return distance <= OFFICE_COORDINATES.radiusMeters;
}

export async function captureCurrentGps(
  preferredType: 'Office HQ' | 'Remote / WFH' | 'Client Site' = 'Office HQ'
): Promise<GeoLocationData> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      // Fallback
      resolve(getSimulatedGps(preferredType));
      return;
    }

    const timeoutId = setTimeout(() => {
      // Timeout fallback after 3.5s
      resolve(getSimulatedGps(preferredType));
    }, 3500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutId);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy || 15);
        const isOffice = isWithinOfficeZone(lat, lng);

        resolve({
          latitude: lat,
          longitude: lng,
          accuracy,
          addressName: isOffice
            ? OFFICE_COORDINATES.name
            : `${lat.toFixed(4)}°, ${lng.toFixed(4)}° (${preferredType})`,
          verifiedOfficeZone: isOffice,
        });
      },
      (err) => {
        clearTimeout(timeoutId);
        console.warn('Geolocation capture failed or denied, using context simulated coordinates:', err.message);
        resolve(getSimulatedGps(preferredType));
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 30000,
      }
    );
  });
}

export function getSimulatedGps(
  type: 'Office HQ' | 'Remote / WFH' | 'Client Site'
): GeoLocationData {
  if (type === 'Office HQ') {
    // Slight random jitter within office perimeter (<30 meters)
    const jitterLat = (Math.random() - 0.5) * 0.0003;
    const jitterLng = (Math.random() - 0.5) * 0.0003;
    const lat = parseFloat((OFFICE_COORDINATES.latitude + jitterLat).toFixed(6));
    const lng = parseFloat((OFFICE_COORDINATES.longitude + jitterLng).toFixed(6));
    return {
      latitude: lat,
      longitude: lng,
      accuracy: 12,
      addressName: OFFICE_COORDINATES.name,
      verifiedOfficeZone: true,
    };
  } else if (type === 'Remote / WFH') {
    return {
      latitude: 1.3002,
      longitude: 103.8345,
      accuracy: 25,
      addressName: 'Residential District, Sector 4 (WFH Authorized)',
      verifiedOfficeZone: false,
    };
  } else {
    return {
      latitude: 1.2925,
      longitude: 103.8558,
      accuracy: 18,
      addressName: 'Client Innovation Center, Downtown',
      verifiedOfficeZone: false,
    };
  }
}

export function formatGpsCoordinates(geo?: GeoLocationData): string {
  if (!geo) return 'GPS not captured';
  const latDir = geo.latitude >= 0 ? 'N' : 'S';
  const lngDir = geo.longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(geo.latitude).toFixed(4)}° ${latDir}, ${Math.abs(geo.longitude).toFixed(4)}° ${lngDir}`;
}
