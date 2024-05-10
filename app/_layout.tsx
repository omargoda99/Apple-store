import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import ProductPage from './Details'
import { useEffect } from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SunshineRegular: require('../assets/fonts/YsabeauInfant-Light.ttf'),
    lonsfont: require('../assets/fonts/test.ttf')

  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }



  return <RootLayoutNav />;
}

export function RootLayoutNav() {

  return (
    <Stack>
      <Stack.Screen name="signIN" options={{ headerShown: false }} />
      <Stack.Screen name="signUP" options={{ headerShown: false }} />
      <Stack.Screen name="todos" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="forgot" options={{ headerShown: false }} />
      <Stack.Screen name="change" options={{ headerShown: false }} />
      <Stack.Screen name="chatScreen" options={{ headerShown: false }} />
      <Stack.Screen name="Details" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="image" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="Cart" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="Cheakout" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="Edit" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="menu" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="orders" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="contact" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="balance" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
      <Stack.Screen name="Favorite" options={{ headerTitleStyle: { fontFamily: 'SunshineRegular', fontSize: 30 } }} />
    </Stack>
  );
}
