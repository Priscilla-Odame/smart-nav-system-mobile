import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import ImageUploader from './components/ImageUploader';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ImageUploader />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
