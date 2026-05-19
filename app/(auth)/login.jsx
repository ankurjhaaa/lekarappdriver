import { useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/driver';
import useAuthStore from '../../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ['Email OTP', 'Password'];

export default function DriverLoginScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  // ── Email OTP ──
  const handleEmailOtp = async () => {
    if (!email.includes('@')) { Alert.alert('Error', 'Enter valid email.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.loginEmail(email);
      if (res.data.success) {
        router.push({ pathname: '/(auth)/verify-otp', params: { email, phone: res.data.phone, via: 'email' } });
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Login failed.');
    }
    setLoading(false);
  };

  // ── Password ──
  const handlePasswordLogin = async () => {
    if (!email.includes('@')) { Alert.alert('Error', 'Enter valid email.'); return; }
    if (password.length < 6) { Alert.alert('Error', 'Password must be 6+ characters.'); return; }
    setLoading(true);
    try {
      const res = await authAPI.loginPassword({
        email, password,
        device_name: Platform.OS + '_lekar_driver',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      if (res.data.success) {
        const u = res.data.user;
        // Strict role validation: Only registered drivers/captains are allowed
        if (u && u.role !== 'driver') {
          Alert.alert('Access Denied', 'Only registered Captains are authorized to access this application.');
          setLoading(false);
          return;
        }
        await setAuth(res.data.token, res.data.user);
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Login failed.');
    }
    setLoading(false);
  };

  const isValid = () => {
    if (activeTab === 0) return email.includes('@');
    return email.includes('@') && password.length >= 6;
  };

  const handleSubmit = () => {
    if (activeTab === 0) handleEmailOtp();
    else handlePasswordLogin();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Stretched Header Banner */}
          <Image
            source={require('../../assets/images/banner1.png')}
            style={styles.banner}
          />

          <View style={styles.mainContent}>
            {/* Title Section */}
            <View style={styles.titleSection}>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
                <Text style={styles.badgeText}>OFFICIAL CAPTAIN ACCESS</Text>
              </View>
              <Text style={styles.title}>Lekar Captain</Text>
              <Text style={styles.subtitle}>Secure access for registered platform captains</Text>
            </View>

            {/* Authentication Method Tabs */}
            <View style={styles.tabRow}>
              {TABS.map((t, i) => (
                <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]}
                  onPress={() => setActiveTab(i)}>
                  <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email OTP Field */}
            {activeTab === 0 && (
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail" size={20} color={COLORS.textMuted} />
                  <TextInput style={styles.emailInput} placeholder="captain@lekar.com"
                    placeholderTextColor={COLORS.textMuted} value={email}
                    onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                <Text style={styles.hint}>OTP authentication key will be sent to this email</Text>
              </View>
            )}

            {/* Password Fields */}
            {activeTab === 1 && (
              <View style={styles.inputBlock}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail" size={20} color={COLORS.textMuted} />
                  <TextInput style={styles.emailInput} placeholder="captain@lekar.com"
                    placeholderTextColor={COLORS.textMuted} value={email}
                    onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                  />
                </View>
                
                <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
                  <TextInput style={styles.emailInput} placeholder="••••••••"
                    placeholderTextColor={COLORS.textMuted} value={password}
                    onChangeText={setPassword} secureTextEntry={!showPass}
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                    <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Action */}
            <TouchableOpacity style={[styles.btn, !isValid() && styles.btnOff]}
              onPress={handleSubmit} disabled={loading || !isValid()} activeOpacity={0.8}>
              {loading ? <ActivityIndicator color={COLORS.white} /> : (
                <Text style={styles.btnText}>{activeTab === 1 ? 'Log In Securely' : 'Request OTP'}</Text>
              )}
            </TouchableOpacity>

            {/* Footer lock note */}
            <View style={styles.footerNote}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.footerText}>
                Captain registration is managed strictly by Lekar Operations. Contact system admin to provision access.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, backgroundColor: COLORS.background },
  
  // Stretched banner styled perfectly with no gaps
  banner: {
    width: '100%',
    height: 230,
    resizeMode: 'cover',
  },

  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },

  titleSection: {
    marginBottom: 28,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '25',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 18,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: 4,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius - 2, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  // Inputs
  inputBlock: { marginBottom: 24 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  emailInput: { flex: 1, paddingVertical: 16, fontSize: SIZES.base, color: COLORS.text },
  hint: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 6, marginLeft: 4 },

  // Button
  btn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', ...SHADOWS.glow },
  btnOff: { backgroundColor: COLORS.surfaceLight, shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  
  // Footer
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 36,
    paddingHorizontal: 12,
  },
  footerText: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', flex: 1, lineHeight: 16 },
});
