import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';

export default function DriverRegistrationBlockedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Shield Lock Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="shield-lock-sharp" size={64} color={COLORS.primary} />
        </View>

        {/* Access Restriction Notice */}
        <Text style={styles.title}>Registration Restricted</Text>
        <Text style={styles.subtitle}>Lekar Driver Network</Text>
        
        <View style={styles.card}>
          <Ionicons name="information-circle" size={24} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.description}>
            Public registration is disabled for the Lekar Driver platform. 
            All driver accounts must be manually authorized, onboarded, and verified by corporate administrators.
          </Text>
        </View>

        <Text style={styles.instruction}>
          To get started, please submit your KYC documents, commercial license, and vehicle registration directly to a Lekar operations manager. Once approved, your login credentials will be activated.
        </Text>

        {/* Back to Login Button */}
        <TouchableOpacity style={styles.btn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          <Text style={styles.btnText}>Return to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SIZES.paddingLg },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: COLORS.primary, ...SHADOWS.glow,
  },
  title: { fontSize: 26, fontWeight: '900', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4, marginBottom: 32 },
  
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
    gap: 12,
  },
  infoIcon: { alignSelf: 'flex-start', marginTop: 2 },
  description: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, fontWeight: '500' },
  
  instruction: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: 40, paddingHorizontal: 16 },
  
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: SIZES.radius,
    width: '100%',
    ...SHADOWS.glow,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
