import { Audio } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Localization from "expo-localization";
import * as Speech from "expo-speech";
import { I18n } from "i18n-js";
import React, { useEffect, useRef, useState } from "react";
import { Button, Text, TouchableOpacity, View } from "react-native";

import axios from "axios";
import { screenHeight, screenWidth } from "../../style.constants";
import { BACKEND_URL } from "@env";

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
// i18n.translations = { en, de };

export default function CameraCompnent({
  currentLanguage,
  setCurrentLanguage,
}: any) {
  //component states
  const [hasCameraPermission, requestPermission] = useCameraPermissions();
  const [objectDetected, setObjectDetected] = useState<number>(0);
  const [allObjectsDetected, setAllObjectsDetected] = useState<Array<any>>([]);
  // const cameraRef = useRef(null);
  const cameraRef = useRef<CameraView | null>(null);
  const detectionInterval = useRef<NodeJS.Timeout | null>(null);
  const soundToPlay = require("../../assets/sounds/synth_loop_2.mp3");

  // Start camera detection loop
  useEffect(() => {
    if (hasCameraPermission?.granted) {
      detectionInterval.current = setInterval(() => {
        startCameraDetection();
      }, 20000);
    }

    return () => {
      if (detectionInterval.current) clearInterval(detectionInterval.current);
    };
  }, [hasCameraPermission]);

  const playAlert = async () => {
    const { sound } = await Audio.Sound.createAsync(soundToPlay);
    await sound.playAsync();
  };

  const startCameraDetection = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          skipProcessing: true,
        });
        const fileUri = photo.uri;

        const formData = new FormData();
        formData.append("file", {
          uri: fileUri,
          name: "image.jpg",
          type: "image/jpeg",
        } as any);

        const response = await axios.post(
          `${BACKEND_URL}/detect`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        console.debug("resp ==> 1", response.data?.detections);
        console.debug("resp ==> 2", response?.request?._response);

        let detectionResp = response.data?.detections;
        if (detectionResp) {
          let numberOfObjects = Number(detectionResp?.length);
          let itemsDetected = detectionResp?.map((_item: any) => _item.label);
          setObjectDetected(numberOfObjects);
          setAllObjectsDetected(itemsDetected);
          console.log("all detections", itemsDetected);

          const speakDirections = () => {
            const words = `${numberOfObjects} obstacles were detected in your path` 
            const directions = itemsDetected
              ?.map((detection: any, idx: number) => {
                return `Obstacle ${
                  idx + 1
                }: ${detection}.`;
              })
              .join(" ");

            Speech.speak(`${words}.  ${directions}`, {
              language: currentLanguage ?? "de",
              pitch: 1.0,
              rate: 1.0,
            });
          };

          const fallBackInstructions = () => {
            Speech.speak(
              "There were no objects in your way. Keep walking ahead.",
              {
                language: currentLanguage ?? "de",
                pitch: 1.0,
                rate: 0.95,
              }
            );
          };
          itemsDetected?.length > 0
            ? speakDirections()
            : fallBackInstructions();

          // playAlert();
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }
  };

  return (
    <View
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        gap: "2",
      }}
    >
      {hasCameraPermission?.granted ? (
        <CameraView
          style={{ width: "100%", height: screenHeight * 0.4 }}
          ref={cameraRef}
        />
      ) : (
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      )}
      <TouchableOpacity
        style={{
          height: "auto",
          width: screenWidth,
          backgroundColor: "#800080",
          paddingVertical: 10,
          borderRadius: 25,
        }}
        onPress={() =>
          setCurrentLanguage(currentLanguage === "de" ? "de" : "en")
        }
      >
        <Text
          style={{
            color: "#fff",
            fontSize: 14,
            textAlign: "center",
            textTransform: "capitalize",
          }}
        >
          Tap to change current language: {currentLanguage}
        </Text>
      </TouchableOpacity>
        <Text
          style={{
            color: "#800080",
            fontSize: 14,
            textAlign: "center",
            textTransform: "capitalize",
          }}
        >
         {`${objectDetected} obtacles were detected in your path.`}
        </Text>
        {allObjectsDetected.map((object, index) => { return (<Text
        key={index}
          style={{
            color: "#800080",
            fontSize: 14,
            textAlign: "center",
            textTransform: "capitalize",
          }}
        >
         {`Obstacle ${index + 1}: ${object}`}
        </Text>)})}
    </View>
  );
}
