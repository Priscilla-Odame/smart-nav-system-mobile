import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import type { CameraView as CameraViewType } from 'expo-camera';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech'; // Import Speech for text-to-speech

export default function LiveFeed() {
  const cameraRef = useRef<CameraViewType | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [obstacleDetected, setObstacleDetected] = useState(false);

  // Use useCameraPermissions hook for camera permission
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Request Camera and Audio permissions
  useEffect(() => {
    (async () => {
      const audioStatus = await Audio.requestPermissionsAsync();
      const cameraStatus = await requestCameraPermission(); // Request camera permission using the hook
      if (cameraStatus.granted && audioStatus.granted) {
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    })();
  }, [requestCameraPermission]);

  useEffect(() => {
    let interval: any;
    if (isStreaming) {
      interval = setInterval(() => {
        captureAndSend();
      }, 2000); // every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isStreaming]);

  const captureAndSend = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      const base64Img = photo.base64;

      try {
        const response = await fetch('http://backend-url:8000/detect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Img }),
        });

        const result = await response.json();
        console.log('Result:', result);

        if (result.obstacle_detected) {
          setObstacleDetected(true);
          playAlert();
          speakObstacleWarning();
        } else {
          setObstacleDetected(false);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const playAlert = async () => {
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/beep.mp3') // Put a beep.mp3 sound in your assets folder
    );
    await sound.playAsync();
  };

  const speakObstacleWarning = () => {
    Speech.speak('Obstacle ahead', {
      language: 'en',
      pitch: 1,
      rate: 0.9,
    });
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>No access to camera or audio</Text>;

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing='back'>
        {/* The CameraView component rendering live stream */}
      </CameraView>

      <View style={styles.overlay}>
        <Button title={isStreaming ? 'Stop Streaming' : 'Start Streaming'} onPress={() => setIsStreaming(!isStreaming)} />
        <Text style={{ color: obstacleDetected ? 'red' : 'green', fontWeight: 'bold', marginTop: 10 }}>
          {obstacleDetected ? '⚠️ Obstacle Detected' : '✅ All Clear'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
  },
});
