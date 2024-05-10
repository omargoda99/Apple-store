import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ALERT_TYPE, Dialog, AlertNotificationRoot, Toast } from 'react-native-alert-notification';
import { Feather } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { signInWithEmailAndPassword, getAuth, sendPasswordResetEmail, sendEmailVerification, updatePassword } from 'firebase/auth';
import { Alert } from 'react-native';
// Import Firebase modules
import { FIREBASE_AUTH, Firebaseprovider } from './FirebaseConfig';

const ResetPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async () => {
    try {
      await sendPasswordResetEmail(FIREBASE_AUTH, email);
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: 'Success',
        textBody: 'Password reset email sent!',
        autoClose: 2000,
      });
    } catch (error) {
      console.error(error);
      const errorCode = error.code;
      let errorMessage = '';
      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'User not found with this email.';
      } else {
        errorMessage = 'Error sending password reset email';
      }
      Toast.show({
        type: ALERT_TYPE.WARNING,
        title: 'Fail',
        textBody: errorMessage,
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',
        },
      });
    }
  };
  const handleSignIn = async () => {
    if (!newPassword) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        title: 'Fail',
        textBody: 'Please enter a new password',
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',
        },
      });
      return;
    }
    const containsLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

    if (!containsLetterAndNumber.test(newPassword)) {
      Toast.show({
        type: ALERT_TYPE.WARNING,
        textBody: 'Password should contain letters and numbers and at least 6 digits',
        autoClose: 2500,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',
        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',
        },
      });
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        FIREBASE_AUTH,
        email,
        currentPassword
      );
      const user = userCredential.user;

      if (!user.emailVerified) {
        // display error message if email is not verified
        Alert.alert(
          'Warning',
          'Please verify your email before signing in',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Resend Email Verification',
              onPress: () => sendEmailVerification(user),
            },
          ],
          { cancelable: false }
        );
        return;
      } else {
        // change password if user is signed in and email is verified
        const auth = getAuth();
        const user = auth.currentUser;

        try {
          await updatePassword(user, newPassword);
          Dialog.show({
            type: ALERT_TYPE.SUCCESS,
            title: 'Success',
            textBody: 'Password changed!',
            autoClose: 2000,
            onHide: () => navigation.navigate('SignIn')
          });
        } catch (error) {
          console.error(error);
          const errorCode = error.code;
          let errorMessage = '';
          if (errorCode === 'auth/weak-password') {
            errorMessage = 'The password is too weak.';
          } else {
            errorMessage = 'Error resetting password';
          }
          Toast.show({
            type: ALERT_TYPE.WARNING,
            title: 'Fail',
            textBody: errorMessage,
            autoClose: 2000,
            titleStyle: {
              fontFamily: "SunshineRegular",
              color: 'black',

            },
            textBodyStyle: {
              fontFamily: "SunshineRegular",
              color: 'black',
            },
          });
        }
      }
    } catch (error) {
      console.error('Sign-in failed', error);
      const errorCode = error.code;
      let errorMessage = '';
      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'Wrong email address';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Invalid email!';
      } else if (errorCode === 'auth/missing-password') {
        errorMessage = 'Enter a password!';
      } else if (errorCode === 'auth/wrong-password') {
        errorMessage = 'Wrong password';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many requests, try again after 30 seconds';
      } else {
        errorMessage = 'Sign-in failed';
      }

      Toast.show({
        type: ALERT_TYPE.WARNING,
        title: 'Fail',
        textBody: errorMessage,
        autoClose: 2000,
        titleStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',

        },
        textBodyStyle: {
          fontFamily: "SunshineRegular",
          color: 'black',
        },
      });
    }
  };


  const navigation = useNavigation();
  const handleSignUp = () => {
    navigation.navigate('Sign Up');
  };

  return (
    <ScrollView style={{
      backgroundColor: 'white',

    }}>
      <View style={styles.container}>
        <TouchableOpacity style={{
          backgroundColor: '#f5f5f5', padding: 10, width: 70, alignItems: 'center', borderRadius: 10, bottom: 20,
          right: 10, elevation: 5
        }}
          onPress={() => router.back()}>
          <Feather name='arrow-left-circle' color={'#657786'} size={30} ></Feather>
        </TouchableOpacity>
        <AlertNotificationRoot>

          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Reset Password</Text>
            <Text style={styles.niceWords}>Enter your email address and new password to reset your password.</Text>
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
            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your current password"
              placeholderTextColor=" black"
              secureTextEntry={true}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your new password"
              placeholderTextColor=" black"
              secureTextEntry={true}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInButtonText}>Reset Password</Text>
          </TouchableOpacity>


          <View>
          </View>
        </AlertNotificationRoot>
      </View>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingTop: '20%',
    flex: 1,
    backgroundColor: '#F5F8FA',
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

  author: {
    alignSelf: 'center',
    color: '#657786',
    fontSize: 20,
    fontFamily: 'SunshineRegular',
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
});

export default ResetPasswordScreen;
