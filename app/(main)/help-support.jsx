import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import DriverHeader from '../../src/components/DriverHeader';

export default function HelpSupportScreen() {
  const [faqs, setFaqs] = useState([
    { q: 'How do I withdraw my earnings?', a: 'Go to the Earnings tab, tap "Add Payout Method", link your bank details, and your cleared earnings will be deposited automatically every Monday.', open: false },
    { q: 'What is the commission rate?', a: 'Lekar charges a flat 10% commission on the total booking fare of completed rides. High-rated drivers get commission cashbacks periodically!', open: false },
    { q: 'How to report a user?', a: 'During or after a ride, you can rate the passenger and write an optional report. In case of serious safety issues, please use the SOS safety button immediately.', open: false },
    { q: 'Why is my account inactive?', a: 'Account inactivity is typically caused by pending document verifications or expired insurance/license. Please upload your valid documents in the Profile > Documents tab.', open: false },
  ]);

  const toggleFaq = (idx) => {
    setFaqs(prev => prev.map((faq, i) => {
      if (i === idx) {
        return { ...faq, open: !faq.open };
      }
      return faq;
    }));
  };

  const handleContact = (type) => {
    if (type === 'call') {
      Linking.openURL('tel:+919999999999').catch(() => Alert.alert('Error', 'Calling not supported.'));
    } else {
      Linking.openURL('mailto:support@lekar.com').catch(() => Alert.alert('Error', 'Mailing not supported.'));
    }
  };

  return (
    <View style={styles.container}>
      <DriverHeader title="Help & Support" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contact Methods */}
        <View style={styles.contactContainer}>
          <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={() => handleContact('call')}>
            <View style={styles.iconCircle}>
              <Ionicons name="call" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.contactTitle}>Call Us</Text>
            <Text style={styles.contactDesc}>Talk to our team 24/7</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={() => handleContact('email')}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="mail" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.contactTitle}>Email Us</Text>
            <Text style={styles.contactDesc}>Get replies within 1 hour</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.faqList}>
          {faqs.map((faq, idx) => (
            <View key={idx} style={[styles.faqCard, faq.open && styles.faqCardActive]}>
              <TouchableOpacity style={styles.faqHeader} activeOpacity={0.7} onPress={() => toggleFaq(idx)}>
                <Text style={styles.faqQuestion}>{faq.q}</Text>
                <Ionicons name={faq.open ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
              
              {faq.open && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqAnswer}>{faq.a}</Text>
                </View>
              )}
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
  contactContainer: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  contactDesc: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center' },
  sectionTitle: { fontSize: SIZES.md, fontWeight: '800', color: COLORS.text, marginBottom: 14 },
  faqList: { gap: 12 },
  faqCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  faqCardActive: {
    borderColor: COLORS.primary + '60',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  faqQuestion: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.text },
  faqBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  faqAnswer: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
});
