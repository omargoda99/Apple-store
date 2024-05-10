import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FIREBASE_AUTH } from './FirebaseConfig';
import { ALERT_TYPE, AlertNotificationRoot, Dialog, Toast } from 'react-native-alert-notification';
import { router } from "expo-router";
import { Feather } from '@expo/vector-icons';

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('');
    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(FIREBASE_AUTH, email);
            Dialog.show({
                type: ALERT_TYPE.SUCCESS,
                title: 'Success',
                textBody: 'Password reset email sent!',
                autoClose: 2000,
                onHide: () => router.push('signIN')

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

    const navigation = useNavigation();
    const handleSignIn = () => {
        router.push('signIN')
    };

    const handleSignUp = () => {
        router.push('signUP')
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={{
                backgroundColor: '#f5f5f5', padding: 10, width: 70, alignItems: 'center', borderRadius: 10, bottom: 60,
                right: 10, elevation: 5
            }}
            onPress={()=>router.back()}>
                <Feather name='arrow-left-circle' color={'#657786'} size={30} ></Feather>
            </TouchableOpacity>
            <AlertNotificationRoot>
                <View style={styles.welcomeContainer}>
                    <Text style={styles.welcomeText}>Forgot Password</Text>
                    <Text style={styles.niceWords}>Enter your email address to reset your password.</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="black"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                <TouchableOpacity style={styles.signInButton} onPress={handleResetPassword}>
                    <Text style={styles.signInButtonText}>Reset Password</Text>
                </TouchableOpacity>

            </AlertNotificationRoot>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: '36%',
        flex: 1,
        backgroundColor: '#F5F8FA',
        padding: 40,
        height: 900
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
    inputLabel: {
        fontSize: 13,
        fontFamily: 'SunshineRegular',
        color: '#657786',
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
    resetPasswordLink: {
        fontSize: 14,
        fontFamily: 'SunshineRegular',
        color: '#657786',
        marginTop: 20,
        alignSelf: 'center',
    },
    author: {
        alignSelf: 'center',
        color: '#657786',
        fontSize: 20,
        fontFamily: 'SunshineRegular',
    },
});

export default ForgotPasswordScreen;