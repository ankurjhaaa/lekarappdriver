import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import DriverHeader from '../../src/components/DriverHeader';

export default function AddPayoutMethodScreen() {
  const [form, setForm] = useState({
    accountHolder: '',
    bankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!form.accountHolder || !form.bankName || !form.accountNumber || !form.ifscCode) {
      Alert.alert('Error', 'Please fill in all details.');
      return;
    }
    if (form.accountNumber !== form.confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match.');
      return;
    }

    setLoading(true);
    // Simulate API storage / backend integration
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Payout bank account linked successfully.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <DriverHeader title="Add Payout Method" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.primary} style={{ marginTop: 2 }} />
          <Text style={styles.infoText}>
            Lekar uses bank transfers to deposit your earnings securely. Please ensure the bank details exactly match your legal credentials.
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              placeholder="As per bank passbook"
              placeholderTextColor={COLORS.textMuted}
              value={form.accountHolder}
              onChangeText={(text) => setForm({ ...form, accountHolder: text })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. State Bank of India"
              placeholderTextColor={COLORS.textMuted}
              value={form.bankName}
              onChangeText={(text) => setForm({ ...form, bankName: text })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your bank account number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={form.accountNumber}
              onChangeText={(text) => setForm({ ...form, accountNumber: text })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your account number"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={form.confirmAccountNumber}
              onChangeText={(text) => setForm({ ...form, confirmAccountNumber: text })}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={[styles.input, { textTransform: 'uppercase' }]}
              placeholder="e.g. SBIN0001234"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              value={form.ifscCode}
              onChangeText={(text) => setForm({ ...form, ifscCode: text })}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="card-outline" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>Save & Verify Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 40 },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: SIZES.radiusLg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  form: { gap: 18 },
  fieldGroup: { gap: 8 },
  label: { fontSize: SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginLeft: 2 },
  input: {
    backgroundColor: COLORS.surface,
    height: 52,
    borderRadius: SIZES.radius,
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: SIZES.radiusLg,
    marginTop: 12,
    ...SHADOWS.glow,
  },
  submitText: { color: COLORS.white, fontSize: SIZES.md, fontWeight: '800' },
});
