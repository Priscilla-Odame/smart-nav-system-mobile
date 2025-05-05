import React, { useRef, useState } from 'react';
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

const ImageUploader: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setImage(photo.uri);
      setIsCameraOpen(false);
      setResult(null);
    }
  };

  const uploadImage = async () => {
    if (!image) return;

    setLoading(true);
    const fileUriParts = image.split('/');
    const fileName = fileUriParts[fileUriParts.length - 1];

    const file = {
      uri: image,
      name: fileName,
      type: 'image/jpeg',
    };

    const formData = new FormData();
    formData.append('file', file as any);

    try {
      const response = await fetch('http://192.168.178.29:8000/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const requestCamera = async () => {
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required');
    } else {
      setIsCameraOpen(true);
    }
  };

  return (
    <View style={styles.container}>
      {isCameraOpen ? (
        <CameraView
          style={styles.camera}
          facing={'back'}
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.cameraButtonContainer}>
            <Button title="Take Photo" onPress={takePhoto} />
            <Button title="Cancel" onPress={() => setIsCameraOpen(false)} />
          </View>
        </CameraView>
      ) : (
        <>
          <Button title="Pick an image" onPress={pickImage} />
          <Button title="Open Camera" onPress={requestCamera} />
          {image && (
            <>
              <Image source={{ uri: image }} style={styles.image} />
              <Button title="Upload Image" onPress={uploadImage} />
            </>
          )}
          {loading && <ActivityIndicator size="large" />}
          {result && (
            <View style={styles.result}>
              <Text>Obstacle Detected: {result.obstacle_detected ? 'Yes' : 'No'}</Text>
              <Text>Edge Count: {result.edge_count}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default ImageUploader;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 300,
    marginVertical: 10,
  },
  result: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10,
  },
});
