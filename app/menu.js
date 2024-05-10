import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';



const MenuHome = () => {
  const navigation = useNavigation();
  const auth = getAuth();

  const handleLinkPress = () => {
    Linking.openURL('https://online-apple-store.web.app/home');
  };

  const handleContact = () => {
    navigation.navigate('contact');
  };

  
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('signIN');
      await AsyncStorage.setItem('isLoggedIn', 'false');

      alert('signed out');

    } catch (error) {
      console.error('Error signing out:', error);
      // display error message to user
      alert('Error signing out');
    }
  };
  return (
    <ScrollView>
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.bestSellingTitle}>Account</Text>
        
        <TouchableOpacity style={styles.userInfoRow} onPress={() =>
          router.navigate('orders')
        }>
          <Text style={styles.label}>Orders</Text>
          <Text style={styles.info}>Your Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfoRow} onPress={()=>router.navigate('Favorite')}>
          <Text style={styles.label}>Favorite</Text>
          <Text style={styles.info}>Favorite products</Text>
        </TouchableOpacity>
   
        <Text style={styles.bestSellingTitle}>Personal info</Text>
        <TouchableOpacity style={styles.userInfoRow} onPress={() => router.navigate('balance')} >
          <Text style={styles.label}>Balance</Text>
          <Text style={styles.info}>Your balance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfoRow} onPress={() => router.navigate('forgot')} >
          <Text style={styles.label}>Verify</Text>
          <Text style={styles.info}>Forgot password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfoRow} onPress={() => router.navigate('change')}>
          <Text style={styles.label}>password</Text>
          <Text style={styles.info}>Change password</Text>
        </TouchableOpacity>
        <Text style={styles.bestSellingTitle}>Connect</Text>
        <TouchableOpacity style={styles.userInfoRow} onPress={() => Linking.openURL('https://portfolio-63e50.web.app/')}>
          <Text style={styles.label}>About us</Text>
          <Text style={styles.info}>Articles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfoRow} onPress={handleLinkPress}>
          <Text style={styles.label}>website</Text>
          <Text style={styles.info}>Our website</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.userInfoRow} onPress={handleContact}>
          <Text style={styles.label}>Help?</Text>
          <Text style={styles.info}>Contact us</Text>
        </TouchableOpacity>
  

        <TouchableOpacity style={styles.logButton} onPress={handleLogout} >
              <Text style={styles.logButtonText}  >Logout</Text>
            </TouchableOpacity>
      </View >
    </View >
    </ScrollView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    padding:20
  },
  userInfo: {
    borderRadius: 20,
    fontFamily: "SunshineRegular"
  },
  bestSellingTitle: {
    marginLeft: 10,
    fontSize: 20,
    fontFamily: 'SunshineRegular',
    color: '#657786',
    marginBottom: 7,
    marginTop: 10,
  },
  userInfoRow: {
    marginRight: 10,
    marginLeft: 10,
    backgroundColor: '#E1E8ED',
    height: 60,
    padding: 10,
    borderRadius: 8,
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
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
    fontSize: 18,
    color: '#657786',
    fontFamily: "SunshineRegular"
  },
  logButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'center',
    marginTop: 20,
    width: 160,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logButtonText: {
    color: '#657786',
    fontSize: 16,
    fontFamily: "SunshineRegular",
    alignSelf: 'center'
    ,
  },
});

export default MenuHome;