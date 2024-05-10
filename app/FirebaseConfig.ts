// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from 'firebase/storage';
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleAuthProvider } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAvxkKjx9RutzY70nbqARoZ_cWUSxbeCg0",
  authDomain: "ahmed-store-native.firebaseapp.com",
  projectId: "ahmed-store-native",
  storageBucket: "ahmed-store-native.appspot.com",
  messagingSenderId: "955917122822",
  appId: "1:955917122822:web:e038dae6a819075cd13287"
};

// Initialize Firebase 
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const db = getFirestore(FIREBASE_APP);
export const storage = getStorage(FIREBASE_APP);
export const Firebaseprovider = new GoogleAuthProvider();