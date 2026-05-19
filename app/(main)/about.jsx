import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import DriverHeader from '../../src/components/DriverHeader';

export default function AboutScreen() {
  const handleLink = (title) => {
    Alert.alert(title, `Simulating routing to the Lekar Driver ${title} portal...`);
  };

  return (
    <View style={styles.container}>
      <DriverHeader title="About Lekar" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo and Brand */}
        <View style={styles.brandCard}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>Lekar</Text>
            <View style={styles.accentLine} />
          </View>
          <Text style={styles.version}>v1.0.0 (Release Build 2026)</Text>
          <Text style={styles.tagline}>Powering Freedom for Professional Drivers</Text>
        </View>

        {/* Info Blocks */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Company Info</Text>
          <View style={styles.infoCard}>
            <Text style={styles.description}>
              Lekar is the next-generation ride-sharing platform designed from the ground up to respect driver margins, optimize routing, and provide ultra-reliable transportation services.
            </Text>
          </View>
        </View>

        {/* Links */}
        <Text style={styles.sectionTitle}>Legal & Regulatory</Text>
        <View style={styles.linksCard}>
          <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleLink('Terms of Service')}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleLink('Privacy Policy')}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} activeOpacity={0.7} onPress={() => handleLink('Software Licenses')}>
            <Ionicons name="code-working-outline" size={20} color={COLORS.primary} />
            <Text style={styles.linkLabel}>Open Source Licenses</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>© 2026 Lekar Technologies Inc. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 40 },
  brandCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 30,
    borderRadius: SIZES.radiusLg,
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBox: { alignItems: 'center', marginBottom: 8 },
  logoText: { fontSize: 36, fontWeight: '900', color: COLORS.white, fontStyle: 'italic', letterSpacing: -1 },
  accentLine: { width: 44, height: 4, backgroundColor: COLORS.primary, borderRadius: 2, marginTop: -2, marginLeft: 30, transform: [{ rotate: '-4deg' }] },
  version: { fontSize: SIZES.sm, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 6 },
  tagline: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic', textAlign: 'center' },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginLeft: 2 },
  infoSection: { marginBottom: 24 },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  linksCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  linkLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.text },
  copyright: { textAlign: 'center', fontSize: 11, color: COLORS.textMuted, marginTop: 32 },
});
