// Location service with real GPS functionality
let Location: any = null;

try {
  Location = require('expo-location');
} catch (error) {
  console.log('expo-location not available, using mock location');
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const getCurrentLocation = async (): Promise<LocationData> => {
  if (Location) {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Location error:', error);
      throw error;
    }
  } else {
    // Mock location for web/demo
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      accuracy: 10,
      timestamp: Date.now(),
    };
  }
};

export const watchLocation = (callback: (location: LocationData) => void) => {
  if (Location) {
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location: any) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );
  } else {
    // Mock watch for demo
    const interval = setInterval(() => {
      callback({
        latitude: 37.7749 + (Math.random() - 0.5) * 0.01,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.01,
        accuracy: 10,
        timestamp: Date.now(),
      });
    }, 5000);

    return {
      remove: () => clearInterval(interval),
    };
  }
};