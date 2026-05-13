import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import useAuthStore from '../../../src/store/authStore';
import { driverAPI } from '../../../src/api/driver';

export default function DriverProfileScreen() {
  const { user, logout } = useAuthStore();
  const [driver, setDriver] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await driverAPI.getProfile();
        if (res.data.success) setDriver(res.data.driver);
      } catch (e) {}
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const menuItems = [
    { icon: 'car-sport-outline', label: 'My Vehicle', color: COLORS.info },
    { icon: 'document-text-outline', label: 'Documents', color: COLORS.warning },
    { icon: 'shield-checkmark-outline', label: 'Safety', color: COLORS.success },
    { icon: 'help-circle-outline', label: 'Help & Support', color: '#00BCD4' },
    { icon: 'information-circle-outline', label: 'About', color: COLORS.textMuted },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.title}>Profile</Text></View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'D'}</Text></View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name || 'Driver'}</Text>
            <Text style={styles.userPhone}>{user?.phone ? `+91 ${user.phone}` : ''}</Text>
            {driver && <Text style={styles.vehicleInfo}>{driver.vehicle_name || ''} • {driver.number_plate || ''}</Text>}
          </View>
          <View style={styles.ratingTag}>
            <Ionicons name="star" size={14} color={COLORS.warning} />
            <Text style={styles.ratingText}>{driver?.average_rating?.toFixed(1) || '5.0'}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} activeOpacity={0.7}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Lekar Driver v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    marginHorizontal: SIZES.padding, borderRadius: SIZES.radiusLg, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.white },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  userPhone: { fontSize: SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },
  vehicleInfo: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 4 },
  ratingTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.surfaceLight, paddingHorizontal: 10, paddingVertical: 6, borderRadius: SIZES.radiusFull },
  ratingText: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.text },
  menu: {
    backgroundColor: COLORS.surface, marginHorizontal: SIZES.padding, marginTop: 20,
    borderRadius: SIZES.radiusLg, borderWidth: 1, borderColor: COLORS.border,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: SIZES.md, fontWeight: '500', color: COLORS.text },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: SIZES.padding, marginTop: 24, paddingVertical: 16,
    backgroundColor: COLORS.error + '15', borderRadius: SIZES.radius,
  },
  logoutText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.error },
  version: { textAlign: 'center', fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 20, marginBottom: 40 },
});
