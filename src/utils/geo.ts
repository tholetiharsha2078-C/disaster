/**
 * Calculate distance between two coordinates in kilometers (Haversine formula)
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

export type ZoneLevel = 'HIGH' | 'ALERT' | 'CAUTION' | 'NORMAL';

export function getAlertZoneLevel(distanceKm: number): {
  level: ZoneLevel;
  label: string;
  badgeClass: string;
  description: string;
} {
  if (distanceKm <= 5) {
    return {
      level: 'HIGH',
      label: 'HIGH ALERT ZONE (0–5 km)',
      badgeClass: 'bg-red-700 text-white font-bold',
      description: 'Immediate threat. Follow official evacuation or shelter guidance.',
    };
  } else if (distanceKm <= 10) {
    return {
      level: 'ALERT',
      label: 'ALERT ZONE (5–10 km)',
      badgeClass: 'bg-red-100 text-red-800 border border-red-300 font-semibold',
      description: 'Elevated danger nearby. Prepare emergency kits and monitor alerts.',
    };
  } else if (distanceKm <= 15) {
    return {
      level: 'CAUTION',
      label: 'STAY CAUTIOUS (10–15 km)',
      badgeClass: 'bg-neutral-100 text-neutral-800 border border-neutral-300 font-medium',
      description: 'Incident within regional perimeter. Stay informed of weather and route conditions.',
    };
  }
  return {
    level: 'NORMAL',
    label: 'NORMAL STATUS (>15 km)',
    badgeClass: 'bg-neutral-100 text-neutral-700',
    description: 'No active major incidents within your immediate alert perimeter.',
  };
}
