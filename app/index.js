import { Text, View } from "react-native";
import SignInScreen from './signIN';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { FIREBASE_AUTH } from "./FirebaseConfig";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkLoginStatus = async () => {
    const user = await AsyncStorage.getItem('email');
    const pass = await AsyncStorage.getItem('pass');
    const value = await AsyncStorage.getItem('isLoggedIn');
    if (value === 'true') {
      try {
        // Attempt to sign in with the retrieved credentials
        await signInWithEmailAndPassword(FIREBASE_AUTH, user, pass);
        // If sign in is successful, set isLoggedIn to true
        setIsLoggedIn(true);
      } catch (error) {
        // If sign in fails, handle the error (e.g., display error message)
        console.error("Error signing in:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
    // Once login status is checked, set isLoading to false
    setIsLoading(false);
  };

  useEffect(() => {
    // Check login status
    checkLoginStatus();
  }, []);

  if (isLoading) {
    // Render loading indicator while checking login status
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
        <View style={{ padding: 20, backgroundColor: '#f7f7f7', borderBottomRightRadius: 40, borderTopLeftRadius: 40, borderWidth: 5, borderColor: '#1DA1F2', elevation: 20 }}>
          <Text style={{ fontFamily: 'SunshineRegular', fontSize: 40 }}><Text style={{color:'#1DA1F2'}}>Apple</Text>Store</Text>
        </View>
      </View>
    );
  }

  // Once the loading is complete, render the appropriate component based on login status
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      {isLoggedIn ? router.navigate('(tabs)') : <SignInScreen />}
    </View>
  );
}
