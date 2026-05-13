import { Redirect, Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../../src/store/authStore';
import { COLORS } from '../../../src/constants/theme';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
      tabBarStyle: styles.tabBar,
      tabBarLabelStyle: styles.tabLabel,
    }}>
      <Tabs.Screen name="home" options={{
        title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="navigate" size={size} color={color} />,
      }} />
      <Tabs.Screen name="earnings" options={{
        title: 'Earnings', tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
      }} />
      <Tabs.Screen name="rides" options={{
        title: 'Rides', tabBarIcon: ({ color, size }) => <Ionicons name="time" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, height: 60, paddingBottom: 8, paddingTop: 4 },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});
