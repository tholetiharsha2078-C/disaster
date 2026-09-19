import { UserLocation } from '../types';

export interface GeolocationStatus {
  status: 'prompt' | 'granted' | 'denied' | 'unavailable' | 'loading';
  message: string;
}

export function requestCurrentLocation(
  onSuccess: (location: UserLocation) => void,
  onError: (status: GeolocationStatus) => void
) {
  if (!('geolocation' in navigator)) {
    onError({
      status: 'unavailable',
      message: 'Browser geolocation is not supported on this device.',
    });
    return;
  }

  onError({
    status: 'loading',
    message: 'Requesting device coordinates from browser GPS/network...',
  });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      const userLoc: UserLocation = {
        latitude,
        longitude,
        accuracyMeters: Math.round(accuracy),
        address: `Detected Coordinates: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
        isApproximate: accuracy > 200,
      };
      onSuccess(userLoc);
    },
    (error) => {
      let msg = 'Unable to retrieve location.';
      let status: GeolocationStatus['status'] = 'unavailable';

      if (error.code === error.PERMISSION_DENIED) {
        status = 'denied';
        msg = 'Location permission was denied. You can manually enter your sector or use regional coordinates.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        msg = 'Position information is temporarily unavailable from device sensors.';
      } else if (error.code === error.TIMEOUT) {
        msg = 'Location request timed out. Retaining preset regional reference coordinates.';
      }

      onError({
        status,
        message: msg,
      });
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
}
