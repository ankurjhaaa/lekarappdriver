import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import useAuthStore from '../src/store/authStore';

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
    
    // Set the native root window background color to ensure no white leaks around SafeAreas
    SystemUI.setBackgroundColorAsync('#0F0F14');

    if (Platform.OS === 'android') {
      // Force navigation bar to dark mode
      NavigationBar.setBackgroundColorAsync('#0F0F14');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0F0F14' }}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0F0F14' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
