import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="ride-active" />
      <Stack.Screen name="navigation" options={{ animation: 'slide_from_bottom' }} />
      
      {/* Payout Screens */}
      <Stack.Screen name="add-payout-method" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      
      {/* Profile Detail Screens */}
      <Stack.Screen name="my-vehicle" />
      <Stack.Screen name="documents" />
      <Stack.Screen name="safety" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="about" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}
