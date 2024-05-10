import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const FullImageScreen = ({ route }) => {
  const imageUrl = useLocalSearchParams();
  let image = imageUrl.imageUrl;
  // Replace '/' with '%2F' only after 'profile-photos'
  console.log(image);
  return (
    <View style={styles.container}>
      <Image source={{ uri: image }} style={styles.image} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default FullImageScreen;
