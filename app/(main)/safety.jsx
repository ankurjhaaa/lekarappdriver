import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import DriverHeader from '../../src/components/DriverHeader';

export default function SafetyScreen() {
  const handleSOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'Are you in danger? This will broadcast your current GPS coordinates to Lekar Support and local emergency dispatch immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'TRIGGER SOS', style: 'destructive', onPress: () => {
          Alert.alert('SOS Triggered', 'Lekar emergency support team has been notified. We are calling you immediately.');
        }}
      ]
    );
  };

  const handleCall = (label, phone) => {
    Alert.alert(`Call ${label}`, `Do you want to dial ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', onPress: () => Linking.openURL(`tel:${phone}`).catch(() => {
        Alert.alert('Not Supported', 'Calling is not supported on this device.');
      })}
    ]);
  };

  const rules = [
    { icon: 'shield-outline', text: 'Wear your seatbelt or helmet at all times during the ride.' },
    { icon: 'speedometer-outline', text: 'Adhere strictly to local speed regulations. Do not rush.' },
    { icon: 'alert-circle-outline', text: 'Never take offline payments or bookings from unverified users.' },
    { icon: 'eye-outline', text: 'Maintain full situational awareness, especially during night driving.' },
  ];

  return (
    <View style={styles.container}>
      <DriverHeader title="Safety & Support" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Urgent Emergency SOS Button */}
        <TouchableOpacity style={styles.sosCard} activeOpacity={0.9} onPress={handleSOS}>
          <View style={styles.sosRipple}>
            <Ionicons name="warning" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
          <Text style={styles.sosDesc}>Tap in case of medical crisis, accident, or threat</Text>
        </TouchableOpacity>

        {/* Emergency Helplines */}
        <Text style={styles.sectionTitle}>Emergency Contact Lines</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8} onPress={() => handleCall('Police', '100')}>
            <Ionicons name="shield" size={24} color={COLORS.primary} />
            <Text style={styles.contactText}>Local Police</Text>
            <Text style={styles.contactSub}>Dial 100</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactBtn} activeOpacity={0.8} onPress={() => handleCall('Ambulance', '102')}>
            <Ionicons name="medical" size={24} color={COLORS.success} />
            <Text style={styles.contactText}>Ambulance</Text>
            <Text style={styles.contactSub}>Dial 102</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.supportRow} activeOpacity={0.8} onPress={() => handleCall('Lekar 24/7 Helpline', '+919999999999')}>
          <View style={styles.supportIcon}>
            <Ionicons name="call" size={20} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.supportText}>Lekar Driver Hotline</Text>
            <Text style={styles.supportSubText}>24/7 Dedicated Driver Assistance</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Safety Guidelines */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Safety Guidelines</Text>
        <View style={styles.rulesList}>
          {rules.map((rule, idx) => (
            <View key={idx} style={styles.ruleCard}>
              <Ionicons name={rule.icon} size={20} color={COLORS.primary} />
              <Text style={styles.ruleText}>{rule.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 40 },
  sosCard: {
    backgroundColor: COLORS.error,
    borderRadius: SIZES.radiusLg,
    padding: 24,
    alignItems: 'center',
    marginBottom: 30,
    ...SHADOWS.glow,
  },
  sosRipple: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  sosTitle: { fontSize: SIZES.xl, fontWeight: '900', color: COLORS.white, letterSpacing: 0.5 },
  sosDesc: { fontSize: 12, color: COLORS.white, opacity: 0.9, textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  contactBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    borderRadius: SIZES.radius,
    alignItems: 'center',
    gap: 6,
  },
  contactText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  contactSub: { fontSize: SIZES.xs, color: COLORS.textMuted },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  supportIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  supportText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },
  supportSubText: { fontSize: 12, color: COLORS.textSecondary },
  rulesList: { gap: 10 },
  ruleCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ruleText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
