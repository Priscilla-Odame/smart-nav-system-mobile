import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraView as CameraViewType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';

type DetectionResult = {
  obstacle_detected: boolean;
  edge_count: number;
};


const LiveFeed = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const cameraRef = useRef<CameraViewType | null>(null);

  useEffect(() => {
    requestPermission();

    const interval = setInterval(() => {
      captureAndUpload();
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const captureAndUpload = async () => {
    if (cameraRef.current && !uploading) {
      try {
        setUploading(true);
        const photo = await cameraRef.current.takePictureAsync({ skipProcessing: true });
        let file;
        if (photo){
          setImage(photo.uri);
          const uriParts = photo.uri.split('/');
          const fileName = uriParts[uriParts.length - 1];
          file = {
            uri: photo.uri,
            name: fileName,
            type: 'image/jpeg',
          };
        }
        const formData = new FormData();
        formData.append('file', file as any);

        const response = await fetch('http://192.168.178.29:8000/detect', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.json();
        setResult(data);
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  };

  if (!permission?.granted) {
    return <Text>No camera permission</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      {uploading && <ActivityIndicator style={styles.loader} size="large" />}
      {result && (
        <View style={styles.result}>
          <Text>Obstacle Detected: {result.obstacle_detected ? 'Yes' : 'No'}</Text>
          <Text>Edge Count: {result.edge_count}</Text>
        </View>
      )}
      {image && <Image source={{ uri: image }} style={styles.preview} />}
    </View>
  );
};

export default LiveFeed;

const styles = StyleSheet.create({
  loader: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
  },
  result: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    elevation: 2,
  },
  preview: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
