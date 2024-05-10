


import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { db,FIREBASE_AUTH,storage } from './FirebaseConfig';
import { updateProfile } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { updateDoc, doc, getDoc } from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import * as Location from 'expo-location';
import { router } from 'expo-router';

const EditProfile = () => {

  const [Name, setName] = useState('');
  const [Addres, setAddres] = useState('');
  const [Phone, setPhone] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading2, setLoading2] = useState(false);
  const [image, setImage] = useState(null); // new state variable for profile image
  const [image2, setImage2] = useState('https://th.bing.com/th/id/R.222d79e7bde6db5bb2a2ce526504ddac?rik=mBNCmkbm1VHRfg&pid=ImgRaw&r=0'); // new state variable for profile image






  useEffect(() => {
    // Get the current user object from Firebase Authentication
    const user = FIREBASE_AUTH.currentUser;
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    // If the user object exists and has a display name, set it in state
    setName(user.displayName);
    setImage(user.photoURL)

    async function getUserData() {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserData(docSnap.data());

        // Check if userData has address and phone properties
        setAddres(docSnap.data().Address);
        setPhone(docSnap.data().Phone);

      }
    }

    getUserData();
  }, []);


  const [isLoading, setIsLoading] = useState(false);

  const handleChooseImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    let latitude = location.coords.latitude;
    let longitude = location.coords.longitude;

    let geocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });

    setAddres(geocode[0].city + ', ' + geocode[0].region);
  };

  const handleSave = async () => {
    if (!/^[a-zA-Z\s]*$/.test(Name)) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Please enter a valid name with only letters and spaces',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: '#657786',
        },
      });
      return;
    }
    setIsLoading(true);

    const user = FIREBASE_AUTH.currentUser;
    const userDocRef = doc(db, 'users', user.email);

    const tasks = [];

    if (image && image !== user.photoURL) {
      const response = await fetch(image);
      const blob = await response.blob();
      const filename = `${user.uid}.jpg`;
      const storageRef = ref(storage, `profile-photos/${filename}`);

      tasks.push(uploadBytes(storageRef, blob).then(() => {
        return getDownloadURL(storageRef); // this generates the download URL for the uploaded photo
      }).then((url) => {
        return url; // we need to return the URL to use it below
      }));
    }

    const updates = {};

    if (Name !== user.displayName) {
      updates.displayName = Name;
    }

    if ((image && image !== user.photoURL) || Object.keys(updates).length > 0) {
      const profileUpdates = {};
      if (Name !== user.displayName) {
        profileUpdates.displayName = Name;
      }
      if (image && image !== user.photoURL) {
        const newImage = await tasks[tasks.length - 1]; // get the URL value from the promise
        profileUpdates.photoURL = newImage;
      }
      tasks.push(updateProfile(user, profileUpdates));
    }

    if (Addres !== user.Address || Phone !== user.Phone) {
      updates.Address = Addres;
      updates.Phone = Phone;
    }

    if (Object.keys(updates).length > 0) {
      tasks.push(updateDoc(userDocRef, updates));
    }

    await Promise.all(tasks);

    setIsLoading(false);
    router.back()

    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      title: 'Success',
      textBody: 'Profile updated successfully',
      autoClose: 2000,
    });
  };

  const navigation = useNavigation();


  return (
    <AlertNotificationRoot>
      <ScrollView style={styles.container}>

        <View style={styles.imageContainer}>

        <TouchableOpacity onPress={() => router.navigate({ pathname: 'image', params:{imageUrl: encodeURIComponent(image)}})}>
            <Image source={{ uri: image }} style={styles.image} />

          </TouchableOpacity>
          {image == 'https://th.bing.com/th/id/R.222d79e7bde6db5bb2a2ce526504ddac?rik=mBNCmkbm1VHRfg&pid=ImgRaw&r=0' ? (
            <Text style={styles.noImageText}>No profile image</Text>
          ) : (null)
          }


          <TouchableOpacity style={styles.chooseImageButton} onPress={handleChooseImage}>
            <Text style={styles.chooseImageButtonText}>Choose image</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Name:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setName(text)}
            value={Name}
            maxLength={16}
          />
          <Text style={styles.label}>Phone number:</Text>
          <TextInput
            style={styles.input}
            maxLength={11}
            onChangeText={(text) => setPhone(text)}
            value={Phone === 'none' ? "" : Phone}
            placeholder='enter your phone'

            keyboardType="phone-pad"
          />
          <Text style={styles.label}>Address:</Text>
          <TextInput
            style={styles.input}
            onChangeText={(text) => setAddres(text)}
            value={Addres === 'none' ? "" : Addres}
            placeholder='enter your addres'
            keyboardType="default"
          />
          {loading2 ? (<ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: 10 }} />) : (
            <TouchableOpacity style={styles.saveButton2} onPress={getLocation}>
              <Text style={styles.saveButtonText}>Get Location</Text>
            </TouchableOpacity>)}
          {isLoading && <ActivityIndicator size="large" color="#1DA1F2" style={{ marginTop: 10 }} />}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: 10, borderTopWidth: 1, borderColor: '#657786' }}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>     Save     </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </AlertNotificationRoot>


  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 160,
    fontFamily: "SunshineRegular"
  },
  auther: {
    marginTop: "15%",
    color: '#657786',
    alignSelf: 'center',
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    paddingBottom: 30
  },
  profileImage: {
    alignSelf: 'center',
    width: 85,
    height: 85,
    borderRadius: 40,
    marginBottom: 10,
  },
  image: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    fontFamily: "SunshineRegular",
    alignSelf: 'center',

  },
  chooseImageButton: {
    marginTop: 10,
    paddingHorizontal: 20,
    marginRight: 20,
    marginLeft: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#657786',

  },
  chooseImageButtonText: {
    color: '#fff',
    fontFamily: 'SunshineRegular',
    fontSize: 16,
  },
  profileImagePlaceholder: {
    alignSelf: 'center',
    width: 85,
    height: 85,
    borderRadius: 40,
    backgroundColor: '#D1D9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,

  },
  profileImageText: {
    color: '#657786',
    fontSize: 16,
    fontFamily: "SunshineRegular"
  },
  form: {
    backgroundColor: '#F6F7F9',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  label: {
    fontSize: 18,
    fontFamily: "SunshineRegular",
    color: '#A9B3C1',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#657786',
    height: 49,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
    fontFamily: "SunshineRegular"
  },
  saveButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 20,
  },
  saveButton2: {
    backgroundColor: '#657786',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: "SunshineRegular",
  },
  cancelButton: {
    backgroundColor: '#D1D9E6',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#657786',
    fontSize: 16,
    fontFamily: "SunshineRegular",
  },


});

export default EditProfile;











