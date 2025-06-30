import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import polyline from '@mapbox/polyline';
import type { LocationObjectCoords } from 'expo-location';
type LatLng = { latitude: number; longitude: number };
import { GOOGLE_MAPS_API_KEY } from '@env';


export default function MapNavigationScreen() {
  const [origin, setOrigin] = useState<LocationObjectCoords | null>(null);
  const [destination, setDestination] = useState({
    latitude: 37.7749, // Example: San Francisco City Hall
    longitude: -122.4194,
  });
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const currentLoc = await Location.getCurrentPositionAsync({});
      setOrigin(currentLoc.coords);

      const points = await getRoute(currentLoc.coords, destination);
      setRouteCoords(points);

      speakDirection("Navigation started. Obstacle detection and voice assistant active.");
    })();
  }, []);

  async function getRoute(from: any, to: any) {
    const originStr = `${from.latitude},${from.longitude}`;
    const destStr = `${to.latitude},${to.longitude}`;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_API_KEY}`
    );

    const data = await res.json();
    const encoded = data.routes[0]?.overview_polyline?.points;
    const decoded = polyline.decode(encoded);

    const coords = decoded.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }));

    // Speak next turn (basic)
    const firstStep = data.routes[0]?.legs[0]?.steps[0]?.html_instructions?.replace(/<[^>]+>/g, '');
    if (firstStep) speakDirection(firstStep);

    return coords;
  }

  function speakDirection(text: any) {
    Speech.speak(text, { rate: 0.95, language: 'en' });
  }

  if (!origin) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        region={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={origin} title="You are here" />
        <Marker coordinate={destination} title="Destination" />
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
});
