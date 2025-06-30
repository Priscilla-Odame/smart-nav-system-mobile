import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import CameraCompnent from "./components/cameraFeed/feed";
import MapsComponent from "./components/maps/map";
import { screenWidth } from "./style.constants";

export default function App() {
  //component states
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");

  return (
    <View style={{ flex: 1 }}>
      <MapsComponent />
      <CameraCompnent
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
      />
    </View>
  );
}
