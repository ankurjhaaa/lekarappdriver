import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/driver';
import useAuthStore from '../../src/store/authStore';

const TABS = ['Email OTP', 'Password'];

export default function DriverLoginScreen() {
  const [activeTab, setActiveTab] = useState(0);
  const [phone, setPhone] = useState('');
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
        if (res.data.otp) Alert.alert('Dev OTP', `Your OTP: ${res.data.otp}`);
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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Logo */}
          <View style={styles.logoArea}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-sport" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Lekar</Text>
            <Text style={styles.appSub}>DRIVER</Text>
            <Text style={styles.tagline}>Earn on your terms</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {TABS.map((t, i) => (
              <TouchableOpacity key={i} style={[styles.tab, activeTab === i && styles.tabActive]}
                onPress={() => setActiveTab(i)}>
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>



          {/* Email OTP */}
          {activeTab === 0 && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color={COLORS.textMuted} />
                <TextInput style={styles.emailInput} placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted} value={email}
                  onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                />
              </View>
              <Text style={styles.hint}>OTP will be sent to your email</Text>
            </View>
          )}

          {/* Password */}
          {activeTab === 1 && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail" size={20} color={COLORS.textMuted} />
                <TextInput style={styles.emailInput} placeholder="your@email.com"
                  placeholderTextColor={COLORS.textMuted} value={email}
                  onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
                />
              </View>
              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed" size={20} color={COLORS.textMuted} />
                <TextInput style={styles.emailInput} placeholder="Min 6 characters"
                  placeholderTextColor={COLORS.textMuted} value={password}
                  onChangeText={setPassword} secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Ionicons name={showPass ? 'eye-off' : 'eye'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity style={[styles.btn, !isValid() && styles.btnOff]}
            onPress={handleSubmit} disabled={loading || !isValid()} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <Text style={styles.btnText}>{activeTab === 1 ? 'Login' : 'Send OTP'}</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerText}>
              New to Lekar? <Text style={styles.registerBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SIZES.paddingLg, paddingVertical: 32 },
  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    borderWidth: 2, borderColor: COLORS.primary, ...SHADOWS.glow,
  },
  appName: { fontSize: 38, fontWeight: '900', color: COLORS.primary, letterSpacing: 3 },
  appSub: { fontSize: SIZES.sm, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 6, marginTop: -2 },
  tagline: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 8 },

  // Tabs
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: 4, marginBottom: 28, borderWidth: 1, borderColor: COLORS.border },
  tab: { flex: 1, paddingVertical: 10, borderRadius: SIZES.radius - 2, alignItems: 'center' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.white, fontWeight: '700' },

  // Inputs
  inputBlock: { marginBottom: 24 },
  label: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  phoneRow: { flexDirection: 'row', gap: 12 },
  codeBox: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 16, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
  codeText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  phoneInput: {
    flex: 1, backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingVertical: 16,
    borderRadius: SIZES.radius, fontSize: SIZES.lg, fontWeight: '600', color: COLORS.text,
    borderWidth: 1, borderColor: COLORS.border, letterSpacing: 2,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    paddingHorizontal: 16, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, gap: 10,
  },
  emailInput: { flex: 1, paddingVertical: 16, fontSize: SIZES.base, color: COLORS.text },
  hint: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 6, marginLeft: 4 },

  // Button
  btn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', ...SHADOWS.glow },
  btnOff: { backgroundColor: COLORS.surfaceLight, shadowOpacity: 0 },
  btnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  
  // Register Link
  registerLink: { alignItems: 'center', marginTop: 32 },
  registerText: { fontSize: SIZES.md, color: COLORS.textSecondary },
  registerBold: { color: COLORS.primary, fontWeight: '700' },
});
