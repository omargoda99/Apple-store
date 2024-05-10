import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { AntDesign, Feather, FontAwesome6, Entypo, EvilIcons, Octicons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { FIREBASE_AUTH, db } from '../FirebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -5, }} {...props} />;
}

export default function TabLayout() {

  const [cartItems, setCartItems] = useState([]);


  useEffect(() => {
    let counter = 0;
  
    const fetchCartData = () => {
      if (counter < 2) {
        const currentUser = FIREBASE_AUTH.currentUser;
  
        if (currentUser) {
          const { uid } = currentUser;
          const cartRef = doc(db, "carts", uid);
  
          onSnapshot(cartRef, (cartDoc) => {
            if (cartDoc.exists()) {
              const cartData = cartDoc.data();
              setCartItems(cartData.items);
              counter++; // Increment counter after fetching data
            }
          }, (error) => {
            console.error("Error getting cart document: ", error);
          });
        }
      } else {
        clearInterval(interval); // Clear interval after fetching data twice
      }
    };
  
    const interval = setInterval(fetchCartData, 1000); // Fetch data every one second
  
    return () => clearInterval(interval); // Cleanup function to clear interval
  
  }, []);

  const cartTotal = cartItems.reduce((acc, item) => {
    return acc + item.quantity;
  }, 0);

  const auth = getAuth();
  const handleSignOut = async () => {
    try {
      router.replace('/signIN')
      await auth.signOut();
      alert('signed out');
      await AsyncStorage.setItem('isLoggedIn', 'false');
    } catch (error) {
      console.error('Error signing out:', error);
      // display error message to user
      alert('Error signing out');
    }
  };
  const user = auth.currentUser;
  return (
    <Tabs
      screenOptions={{
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        tabBarInactiveBackgroundColor: '#F5F8FA',
        tabBarActiveBackgroundColor: '#F5F8FA',
        headerBackgroundContainerStyle: { backgroundColor: '#F5F8FA' }
      }}>
      <Tabs.Screen
        name="index"

        options={{
          title: ' ',
          tabBarActiveTintColor: "#1DA1F2",
          tabBarIcon: ({ color }) => <Feather name="home" style={{ marginBottom: -5, }} size={28} color={color} />,
          headerRight: () => (
          
            <Pressable style={{ marginRight: 20 }} onPress={()=>router.push('Cart')}>
            <View style={{ flexDirection: 'row' }}>
              <Feather
                name='shopping-cart'
                size={30}

              />
              {cartTotal > 0 && (
                <View style={{
                  backgroundColor: '#1DA1F2',
                  borderRadius: 15,
                  top:-5,
                  right:-10,
                  height:20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position:'absolute'
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 12,
                    paddingHorizontal:8,
                    fontWeight: 'bold',
                  }}>{cartTotal}</Text>
                </View>
                )}
              </View>
            </Pressable>

          ),
          headerLeft: () => (
            <Text style={{ fontFamily: 'SunshineRegular', left: 15, fontSize: 30 }}>
              Home
            </Text>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: ' ',
          tabBarActiveTintColor: "#1DA1F2",

          tabBarIcon: ({ color }) => <TabBarIcon name="tags" color={color} />,
          headerRight: () => (

            <Pressable style={{ marginRight: 20 }} onPress={()=>router.push('Cart')}>
              <View style={{ flexDirection: 'row' }}>
                <Feather
                  name='shopping-cart'
                  size={30}

                />
                {cartTotal > 0 && (
                  <View style={{
                    backgroundColor: '#1DA1F2',
                    borderRadius: 15,
                    top:-5,
                    right:-10,
                    height:20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    position:'absolute'
                  }}>
                    <Text style={{
                      color: 'white',
                      fontSize: 12,
                      paddingHorizontal:8,
                      fontWeight: 'bold',
                    }}>{cartTotal}</Text>
                  </View>
                )}
              </View>
            </Pressable>

          ),
          headerLeft: () => (
            <Text style={{ fontFamily: 'SunshineRegular', left: 15, fontSize: 30 }}>
              Products
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: ' ',
          tabBarActiveTintColor: "#1DA1F2",

          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: "row" }}>
              <Pressable onPress={() => router.push('Edit')}>
                {({ pressed }) => (
                  <Feather
                    name='edit'
                    size={23}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
              <Pressable onPress={() => router.push('menu')}>
                {({ pressed }) => (
                  <FontAwesome6
                    name="bars-staggered"
                    size={23}
                    style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
            </View>
          ),
          headerLeft: () => (
            <Text style={{ fontFamily: 'SunshineRegular', left: 15, fontSize: 25 }}>
              {user?.displayName}
            </Text>

          ),

        }}
      />
    </Tabs >
  );
}
