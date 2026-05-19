import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { driverAPI } from '../../src/api/driver';
import DriverHeader from '../../src/components/DriverHeader';

export default function MyVehicleScreen() {
  const [vehicle, setVehicle] = useState({
    name: '',
    plate: '',
    type: 'cab',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await driverAPI.getProfile();
        if (res.data.success && res.data.driver) {
          setVehicle({
            name: res.data.driver.vehicle_name || 'Suzuki Ertiga',
            plate: res.data.driver.number_plate || 'MH 12 AB 1234',
            type: res.data.driver.vehicle_type || 'cab',
          });
        }
      } catch (e) {
        // Fallback to default mock data
        setVehicle({
          name: 'Suzuki Ertiga',
          plate: 'MH 12 AB 1234',
          type: 'cab',
        });
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DriverHeader title="My Vehicle" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Vehicle Badge Illustration */}
        <View style={styles.badgeCard}>
          <View style={styles.iconWrapper}>
            <Ionicons name="car-sport" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.badgeTitle}>{vehicle.name}</Text>
          <Text style={styles.badgeSub}>{vehicle.plate}</Text>
          
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{vehicle.type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Read-Only Details */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Vehicle Registration Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vehicle Model Name</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{vehicle.name}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>License Plate Number</Text>
            <View style={styles.readOnlyBox}>
              <Text style={[styles.readOnlyText, { textTransform: 'uppercase' }]}>{vehicle.plate}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Vehicle Class / Segment</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{vehicle.type.toUpperCase()}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
            <Text style={styles.infoCardText}>
              These vehicle parameters are registered and verified by Lekar Admin. To update vehicle details, please contact system support.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 40 },
  badgeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    ...SHADOWS.small,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeTitle: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  badgeSub: { fontSize: SIZES.md, color: COLORS.textSecondary, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
  typeBadge: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusFull,
  },
  typeText: { fontSize: SIZES.xs, fontWeight: '800', color: COLORS.primary, letterSpacing: 1 },
  form: { gap: 18 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  fieldGroup: { gap: 8 },
  label: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 2 },
  readOnlyBox: {
    backgroundColor: COLORS.surface,
    height: 52,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.border,
    opacity: 0.85,
  },
  readOnlyText: { color: COLORS.textSecondary, fontSize: SIZES.md, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.success + '10',
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
    marginTop: 12,
  },
  infoCardText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
