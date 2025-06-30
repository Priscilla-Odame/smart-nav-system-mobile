import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import * as Localization from 'expo-localization';
import {I18n} from 'i18n-js';
import { Camera, useCameraPermissions } from 'expo-camera';
import { BACKEND_URL} from '@env';

import axios from 'axios';

// Translations
// const en = {
//   start: "Start Navigation",
//   obstacle: "Obstacle ahead!",
// };

// const de = {
//   start: "Navigation starten",
//   obstacle: "Hindernis voraus!",
// };
const i18n = new I18n({
  en: {
    start: "Start Navigation",
    obstacle: "Obstacle ahead!",
  },
  de: {
    start: "Navigation starten",
    obstacle: "Hindernis voraus!",
  },
});

const preferredLocale = Localization.getLocales()[0]?.languageTag || 'en';

i18n.locale = preferredLocale;
i18n.enableFallback = true;
// i18n.translations = { en, de }; // Use cast to avoid TS error

export default function App() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [hasCameraPermission, requestPermission] = useCameraPermissions();
  // const cameraRef = useRef(null);
  const cameraRef = useRef<Camera | null>(null);

  const detectionInterval = useRef<NodeJS.Timeout | null>(null);

  // Get user's current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  // Start camera detection loop
  useEffect(() => {
    if (hasCameraPermission?.granted) {
      detectionInterval.current = setInterval(() => {
        startCameraDetection();
      }, 3000);
    }

    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [hasCameraPermission]);

  const startCameraDetection = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
        const fileUri = photo.uri;

        const formData = new FormData();
        formData.append('file', {
          uri: fileUri,
          name: 'image.jpg',
          type: 'image/jpeg',
        } as any);

        const response = await axios.post(`${BACKEND_URL}/detect`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data?.obstacle_detected) {
          Speech.speak((i18n as any).t('obstacle'));
        }
      } catch (error) {
        console.error('Detection error:', error);
      }
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title={(i18n as any).t('start')} />
          {destination && <Marker coordinate={destination} />}
          {routeCoords.length > 0 && (
            <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="blue" />
          )}
        </MapView>
      ) : (
        <Text>Loading location...</Text>
      )}

      {hasCameraPermission?.granted ? (
        <Camera style={{ height: 100 }} ref={cameraRef} />
      ) : (
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      )}
    </View>
  );
}
