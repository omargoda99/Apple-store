import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FIREBASE_AUTH, db } from '../FirebaseConfig';
import { getAuth, updateProfile } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { updateDoc, doc, getDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
const UserProfile = () => {

  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
console.log(image,'   pro')
  const auth = getAuth()
  const handleLogout = async () => {
    try {
      router.replace('signIN');
      await auth.signOut();
      alert('signed out');
      await AsyncStorage.setItem('isLoggedIn', 'false');
    } catch (error) {
      console.error('Error signing out:', error);
      // display error message to user
      alert('Error signing out');
    }
  };
  const [isLoading, setIsLoading] = useState(false);

  const [userData, setUserData] = useState(null);


  const isFocused = useIsFocused();
  useEffect(() => {
    const userDocRef = doc(db, "users", FIREBASE_AUTH.currentUser.email);
    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setIsLoading(false);
      }
    });

    const user = FIREBASE_AUTH.currentUser;

    // If the user object exists and has a display name, set it in state
    if (user && user.displayName) {
      setName(user.displayName);
      console.log(name);
    }
    if (user && user.email) {
      setEmail(user.email);
      console.log(email);
    }
    if (user && user.photoURL) {
      setImage(user.photoURL);
    }

    return unsub;
  }, [isFocused]);
  if (isLoading || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1da1f2" />
      </View>
    );
  }
  return (
    <ScrollView style={{
      backgroundColor: '#F6F7F9',

    }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.navigate('balance')}
          style={{
            position: 'absolute',
            top: '8%',
            right: '5%',
            flexDirection: 'column',
            alignItems: 'center',
            backgroundColor: '#E1E8ED',
            padding: 10,
            borderRadius: 10,
            elevation: 3, // for Android
            shadowColor: '#000', // for iOS
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
          <Text style={{
            fontFamily: 'SunshineRegular',
            color: '#657786',
            fontFamily: "SunshineRegular"
          }}>Your Balance:</Text>
          <Text
            style={{
              fontFamily: 'SunshineRegular',
              color: '#657786',
            }}>${userData.balance.toFixed(2)}</Text>
        </TouchableOpacity>
        <View style={styles.header}>
          <View style={styles.profile}>
          <TouchableOpacity onPress={() => router.navigate({ pathname: 'image', params:{imageUrl: encodeURIComponent(image)}})}>

              <Image source={{ uri: image }} style={styles.profileImage} />
              {image == 'https://th.bing.com/th/id/R.222d79e7bde6db5bb2a2ce526504ddac?rik=mBNCmkbm1VHRfg&pid=ImgRaw&r=0' ? (
                <Text style={styles.noImageText}>No profile image</Text>

              ) : (null)
              }


            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.username}>@{userData.name}</Text>
            </View>
          </View>

        </View>

        <View style={styles.userInfo}>
          <View style={styles.userInfoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.info}>{email}</Text>
          </View>
          <View style={styles.userInfoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.info}>{userData.Phone}</Text>
          </View>
          {/* <View style={styles.userInfoRow}>
          <Text style={styles.label}>Birthday:</Text>
          <Text style={styles.info}>{userData.birthday.toDate().toDateString()}</Text>
        </View> */}
          <View style={styles.userInfoRow}>
            <Text style={styles.label}>Addres:</Text>
            <Text style={styles.info}>{userData.Address}</Text>

          </View>
          <TouchableOpacity style={styles.logButton} onPress={handleLogout} >
            <Text style={styles.logButtonText}><Feather name='log-out' size={15}></Feather> Logout</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 160,
    fontFamily: "SunshineRegular"
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  profile: {
    alignItems: 'center',
    alignSelf: 'center',

  },
  profileImage: {
    alignSelf: 'center',
    width: 85,
    height: 85,
    borderRadius: 40,
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    fontFamily: "SunshineRegular",
    alignSelf: 'center',

  },
  loadingContainer: {
    backgroundColor: '#F6F7F9',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholder: {
    alignSelf: 'center',
    width: 85,
    height: 85,
    borderRadius: 40,
    backgroundColor: '#D1D9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  editButtonText: {
    color: 'white',
    fontFamily: "SunshineRegular"

  },
  profileImageText: {
    color: '#657786',
    fontSize: 16,
    fontFamily: "SunshineRegular"
  },
  profileInfo: {
    paddingTop: 15,
    paddingBottom: 20
  },
  name: {
    fontSize: 20,
    fontFamily: "SunshineRegular",
    color: '#657786',
    marginBottom: 5,
    alignSelf: 'center'
  },
  username: {
    fontSize: 15,
    color: '#A9B3C1',
    fontFamily: "SunshineRegular",
    alignSelf: 'center',
  },
  balance: {
    margin: 18,
    fontSize: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "SunshineRegular",
    color: '#A9B3C1',
  },
  balanceAmount: {
    fontSize: 13,
    fontFamily: "SunshineRegular",
    color: '#0C0D34',
  },
  userInfo: {
    fontFamily: "SunshineRegular"
    ,

  },
  userInfoRow: {
    borderBottomWidth: 3,
    borderBottomColor: '#E1E8ED',
    height: 60,
    padding: 5,
    margin: 10,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: "SunshineRegular"

  },
  label: {
    flex: 1,
    fontSize: 18,
    fontFamily: "SunshineRegular",
    color: '#A9B3C1',
  },
  info: {
    flex: 2,
    fontSize: 14,
    color: '#657786',
    fontFamily: "SunshineRegular",
  },
  rechargeButton: {
    backgroundColor: '#657786',
    borderRadius: 10,

    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-end',
    marginTop: 20,
    marginBottom: 10,
  },
  rechargeButtoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: "SunshineRegular",
    alignSelf: 'center'
    ,
  },
  editButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 20,
    width: 160,
    marginBottom: 10,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: "SunshineRegular",
    alignSelf: 'center'
    ,
  },
  logButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 50,
    width: 160,
    marginBottom: 10,
    shadowColor: '#000222',
    shadowOffset: {
      width: 2,
      height: 10,
    },
    shadowOpacity: 1.25,
    shadowRadius: 5.84,
    elevation: 6,
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: "SunshineRegular",
    alignSelf: 'center'
    ,
  },
  form: {
    backgroundColor: '#F6F7F9',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
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
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: "SunshineRegular"
    ,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  passwordIcon: {
    marginLeft: -30,
  },
  auther: {
    marginTop: "15%",
    color: '#657786',
    alignSelf: 'center',
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    paddingBottom: 30
  },

});

export default UserProfile;
