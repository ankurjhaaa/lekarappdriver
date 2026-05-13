import { Redirect, Stack } from 'expo-router';
import useAuthStore from '../../src/store/authStore';

export default function MainLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="ride-active" />
    </Stack>
  );
}
