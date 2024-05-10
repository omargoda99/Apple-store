import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { FIREBASE_AUTH } from "@/app/FirebaseConfig";
import { getAuth, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";


const SignInScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);


  const handleSignIn = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        Alert.alert(
          "Warning",
          "Please verify your email before signing in",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Resend Email Verification",
              onPress: () => sendEmailVerification(user),
            },
          ],
          { cancelable: false }
        );
        return;
      } else {
        setEmail("");
        setPassword("");
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('email', user.email);
        await AsyncStorage.setItem('pass', password);
        router.replace('(tabs)')


      }
    } catch (error) {
      console.error("Sign-in failed", error);
      const errorCode = error.code;
      let errorMessage = "";
      if (errorCode === "auth/user-not-found") {
        errorMessage = "Wrong email address";
      } else if (errorCode === "auth/invalid-email") {
        errorMessage = "Invalid email!";
      } else if (errorCode === "auth/missing-password") {
        errorMessage = "Enter a password!";
      } else if (errorCode === "auth/wrong-password") {
        errorMessage = "Incorrect email or password";
      } else if (errorCode === "auth/too-many-requests") {
        errorMessage = "Too many requests, try again after 30 seconds";
      } else {
        errorMessage = "Sign-in failed";
      }

      Alert.alert("Error", errorMessage, [{ text: "OK" }], { cancelable: false });
    }
  };


  const handleSignUp = () => {
    router.push('signUP')

  };

  return (
    <ScrollView style={{ backgroundColor: "#F5F8FA" }}>
      <View style={styles.container}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.niceWords}>Sign in to continue</Text>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor=" black"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor=" black"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye" : "eye-off"} size={24} color=" black" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>
        <Text style={styles.signUpLink} onPress={handleSignUp}>
          Don't have an account?<Text style={{ color: "grey" }}> Sign Up</Text>!
        </Text>
        <Text style={styles.signUpLink} onPress={() => router.push('forgot')}>
          Forgot <Text style={{ color: "grey" }}>Password?</Text>
        </Text>
        <View>
          <View style={styles.auther}>
            <Text style={styles.font}>made by</Text>
            <Text style={styles.font}>ahmed essam</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingTop: '36%',
    flex: 1,

    padding: 40,
  },
  welcomeContainer: {
    marginBottom: 30,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 24,
    alignSelf: 'center',
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginBottom: 10,
  },
  niceWords: {
    fontSize: 16,
    alignSelf: 'center',
    fontFamily: 'SunshineRegular',
    color: '#657786',
  }, font: {
    fontFamily: "lonsfont",
    color:"#657786"
  },
  inputContainer: {
    marginBottom: 15,
  },
  googleContainer: {
    paddingTop: 10,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    alignSelf: 'center',
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#111',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SunshineRegular',
    color: '#111',
  },
  signInButton: {
    backgroundColor: '#657786',
    borderRadius: 10,
    padding: 10,
    marginTop: 20,
  },
  signInButtonText: {
    fontSize: 17,
    fontFamily: 'SunshineRegular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  signUpLink: {
    fontSize: 14,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginTop: 20,
    alignSelf: 'center',
  },
  google: {
    alignSelf: 'center',
    flexDirection: 'row',
  },

  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  socialIcon: {
    marginBottom: '10%',
    backgroundColor: '#E1E8ED',
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 6

  },
  auther: {
    alignSelf: 'center',
    color: '#657786',
    paddingTop: '30%',
    fontSize: 20,
    alignItems: 'center',
    fontFamily: 'SunshineRegular',
  },
  footerText: {
    fontSize: 14,
    color: '#657786',
  },
});
export default SignInScreen;