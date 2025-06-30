import * as Localization from "expo-localization";
import * as Location from "expo-location";
import { I18n } from "i18n-js";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { screenHeight, screenWidth } from "../../style.constants";

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

const preferredLocale = Localization.getLocales()[0]?.languageTag || "en";

i18n.locale = preferredLocale;
i18n.enableFallback = true;
// i18n.translations = { en, de }; // Use cast to avoid TS error

export default function MapsComponent() {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Get user's current location
  const getLocationData = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc.coords);
  };
  useEffect(() => {
    getLocationData();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {location ? (
        <MapView
          style={{ flex: 1, width: "100%", height: screenHeight / 2 }}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location} title={(i18n as any).t("start")} />
          {destination && <Marker coordinate={destination} />}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeWidth={5}
              strokeColor="blue"
            />
          )}
        </MapView>
      ) : (
        <View
          style={{
            height: screenHeight / 2,
            width: screenWidth,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#000", fontSize: 15 }}>
            Loading location...
          </Text>
        </View>
      )}
    </View>
  );
}
