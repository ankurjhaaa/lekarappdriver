import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import useAuthStore from '../src/store/authStore';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <View style={s.c}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  return <Redirect href={isAuthenticated ? '/(main)/(tabs)/home' : '/(auth)/login'} />;
}
const s = StyleSheet.create({ c: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background } });
