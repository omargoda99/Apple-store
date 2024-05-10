import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { router } from "expo-router";
import { AntDesign, Feather } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, } from 'firebase/auth';
import { FIREBASE_AUTH } from '@/app/FirebaseConfig';
import { db } from '@/app/FirebaseConfig';
import { addDoc, collection, doc, setDoc, getDocs } from "firebase/firestore";

const SignUnScreen = () => {



    const generateUsername = (name, email) => {
        let username = '';
        if (name) {
            // Generate username based on name
            username = name.toLowerCase().replace(/\s/g, '');
        } else if (email) {
            // Generate username based on email
            const emailParts = email.split('@');
            username = emailParts[0];
        }
        return username;
    };

    const [email, setEmail] = useState('');
    const [birthday, setBirthday] = useState('')
    const [name, setname] = useState('');
    const [username, setUsername] = useState('');

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name && !email && !birthday && !password && !confirmPassword && !username) {
            Alert.alert('Please fill out all the fields before signing up');
            return;
        }

        if (!name) {
            Alert.alert('Please enter your name');
            return;
        }

        if (!/^[a-zA-Z\s]*$/.test(name)) {
            Alert.alert('Please enter a valid name with only letters and spaces');
            return;
        }

        if (!email) {
            Alert.alert('Please enter your email');
            return;
        }

        if (new Date(birthday).getFullYear() > 2005) {
            Alert.alert('Please select a valid birth date, user should be over 18 years old');
            return;
        }

        if (!password) {
            Alert.alert('Please enter your password');
            return;
        }


        if (!confirmPassword) {
            Alert.alert('Please confirm the password');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Passwords do not match');
            return;
        }
        const containsLetterAndNumber = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

        if (!containsLetterAndNumber.test(password)) {
            Alert.alert('Password should contain letters and numbers and at least 6 digits');
            return;
        }
        if (!username) {
            Alert.alert('Please enter a username');
            return;
        }

        // Check if username is already taken
        const usernameSnapshot = await getDocs(collection(db, 'users'));
        const existingUsernames = usernameSnapshot.docs.map((doc) => doc.data().name);

        if (existingUsernames.includes(username)) {
            // Suggest a new unique username
            let suggestionNumber = 2;
            let newUsername = `${username}${suggestionNumber}`;

            while (existingUsernames.includes(newUsername)) {
                suggestionNumber++;
                newUsername = `${username}${suggestionNumber}`;
            }

            Alert.alert(`Username is already taken. Try "${newUsername}" or choose a different username.`);
            return;
        }
        if (username && (!/^[a-zA-Z_]+$/.test(username) && !/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d_]{5,}$/.test(username))) {
            Alert.alert('Username can only contain letters, numbers, or underscore (_) with at least 5 characters');
            return;
        }

        try {
            setIsLoading(true);

            const userCredential = await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
            await updateProfile(userCredential.user, { displayName: name, photoURL: 'https://th.bing.com/th/id/R.222d79e7bde6db5bb2a2ce526504ddac?rik=mBNCmkbm1VHRfg&pid=ImgRaw&r=0' });

            // send email verification
            await sendEmailVerification(userCredential.user);

            await setDoc(doc(db, "users", email), {
                name: username,
                email: email,
                fullname: name,
                password: password,
                Address: 'none',
                Phone: 'none',
                balance: 0

            });




            setIsLoading(false);

            Alert.alert('Email verification sent! Verify to sign in', '', [
                {
                    text: 'OK', onPress: () => router.push('signIN')
                }
            ]);
            setname('')
            setBirthday('')
            setUsername('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')
        } catch (error) {
            setIsLoading(false)
            console.error('Error creating user:', error);

            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('This email is already in use');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Invalid email address');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Password should be at least 6 characters long');
            }
        }
    };

    const navigation = useNavigation();

    const handleSignIn = () => {
        router.push('signIN');

    };



    return (

        <ScrollView style={{
            backgroundColor: '#F5F8FA',

        }}>

            <View style={styles.container}>
                <TouchableOpacity style={{
                    backgroundColor: 'white', padding: 10, width: 70, alignItems: 'center', borderRadius: 10, bottom: 20,
                    right: 10, elevation: 5
                }}
                    onPress={() => router.back()}>
                    <Feather name='arrow-left-circle' color={'#657786 '} size={30} ></Feather>
                </TouchableOpacity>
                <View style={styles.welcomeContainer}>
                    <Text style={{ fontFamily: "lonsfont", color: '#1DA1F2' }}>Sign up to continue</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your Full Name"
                        placeholderTextColor=" black"
                        value={name}
                        onChangeText={setname}
                        maxLength={16}

                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>User Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your username"
                        value={username}
                        onChangeText={text => setUsername(text.replace(/\s/g, ''))}
                        maxLength={16}
                    />
                </View>
                <Text style={styles.note}>user name should be unique whitout spaces.</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your email "
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>

                {/* <BirthdayPicker onDateSelected={setBirthday} /> */}

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Enter your password"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather name={showPassword ? "eye" : "eye-off"} size={24} color=" black" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.note}>at least <Text style={{ color: "grey", fontWeight: 'bold', fontSize: 13 }}>6</Text> digits contain letters and characters.</Text>

                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirm your password"
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                    </View>
                </View>
                {isLoading ? (<ActivityIndicator size="large" color="grey" />) : (
                    <TouchableOpacity style={styles.signInButton} onPress={handleSignUp}>
                        <Text style={styles.signInButtonText}>Create new account</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.signUpLink} onPress={handleSignIn}>have an account? <Text style={{ color: "grey" }}>Sign In!</Text></Text>
                <View>

                </View>

            </View>

        </ScrollView >

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        backgroundColor: '#F5F8FA',
        paddingRight: 40,
        paddingLeft: 40,
    },
    welcomeContainer: {
        marginBottom: 7,
        alignSelf: 'center',
    },
    note: {
        fontSize: 12,
        fontFamily: 'SunshineRegular',
        color: '#657786',
        alignSelf: 'center'
    },
    inputContainer: {
        marginBottom: 10,
    },
    googleContainer: {
        paddingTop: 5,
    },
    inputLabel: {
        fontSize: 16,
        fontFamily: 'SunshineRegular',
        color: '#657786',
        marginBottom: 10,
    },
    label: {
        fontSize: 18,
        fontFamily: 'SunshineRegular',
        color: '#657786',
        alignSelf: 'center',
        marginBottom: 5,
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
        marginTop: 10,
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
        marginTop: 10,
        alignSelf: 'center',
        paddingBottom: 10,
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
        marginBottom: '24%',
        backgroundColor: '#E1E8ED',
        borderRadius: 50,
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
        marginLeft: 6

    },
    auther: {
        alignSelf: 'center',
        marginBottom: "50%",
        color: '#657786',
        fontSize: 20,
        fontFamily: 'SunshineRegular',
    },
    footerText: {
        fontSize: 14,
        color: '#657786',
    },
});
export default SignUnScreen;