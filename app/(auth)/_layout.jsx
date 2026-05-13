import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href="/(main)/(tabs)/home" />;
  return <Stack screenOptions={{ headerShown: false }}><Stack.Screen name="login" /><Stack.Screen name="register" /><Stack.Screen name="verify-otp" /></Stack>;
}
