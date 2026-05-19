import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import useAuthStore from '../../src/store/authStore';
import DriverHeader from '../../src/components/DriverHeader';

export default function ProfileInfoScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  return (
    <View style={styles.container}>
      <DriverHeader title="Profile Info" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar Display */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'D'}</Text>
          </View>
        </View>

        {/* Read-Only Information */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{user?.name || 'Driver'}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{user?.email || 'Not Provided'}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{user?.phone ? `+91 ${user.phone}` : 'Not Provided'}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{user?.gender ? user.gender.toUpperCase() : 'MALE'}</Text>
              <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={22} color={COLORS.success} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.infoCardTitle}>Profile Locked</Text>
              <Text style={styles.infoCardText}>
                Email, phone number, and name cannot be edited by the driver. To request changes, please reach out to admin support.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: 'center', marginBottom: 30, position: 'relative', alignSelf: 'center' },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.white },
  form: { gap: 18 },
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
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: COLORS.success + '10',
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
    marginTop: 12,
  },
  infoCardTitle: { fontSize: 13, fontWeight: '800', color: COLORS.success },
  infoCardText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
