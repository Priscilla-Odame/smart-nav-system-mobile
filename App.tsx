import React from "react";
import { View } from "react-native";

import CameraCompnent from "./components/cameraFeed/feed";
import MapsComponent from "./components/maps/map";

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <MapsComponent />
      <CameraCompnent />
    </View>
  );
}
