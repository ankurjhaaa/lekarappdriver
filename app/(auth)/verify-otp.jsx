import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../src/constants/theme';
import { authAPI } from '../../src/api/driver';
import useAuthStore from '../../src/store/authStore';

export default function DriverVerifyOtpScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone || '';
  const email = params.email || '';
  const via = params.via || 'phone';

  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (text, i) => {
    const n = [...otp]; n[i] = text.replace(/[^0-9]/g, ''); setOtp(n);
    if (text && i < 3) inputs.current[i + 1]?.focus();
  };

  const handleKey = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) { Alert.alert('Error', 'Enter 4-digit OTP.'); return; }
    setLoading(true);
    try {
      const payload = {
        otp: code,
        device_name: Platform.OS + '_lekar_driver',
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      };
      if (via === 'email' && email) {
        payload.email = email;
      } else {
        payload.phone = phone;
      }

      const res = await authAPI.verifyOtp(payload);
      if (res.data.success) {
        await setAuth(res.data.token, res.data.user);
        router.replace('/(main)/(tabs)/home');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Invalid OTP.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      let res;
      if (via === 'email' && email) {
        res = await authAPI.loginEmail(email);
      } else {
        res = await authAPI.login(phone);
      }
      if (res.data.otp) Alert.alert('Dev OTP', `New OTP: ${res.data.otp}`);
      setTimer(60);
    } catch (e) {
      Alert.alert('Error', 'Failed to resend OTP.');
    }
  };

  const displayText = via === 'email' ? email : `+91 ${phone}`;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.icon}>
          <Ionicons name={via === 'email' ? 'mail' : 'shield-checkmark'} size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.sub}>
          Code sent to{'\n'}
          <Text style={{ fontWeight: '700', color: COLORS.text }}>{displayText}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((d, i) => (
            <TextInput key={i} ref={(r) => (inputs.current[i] = r)}
              style={[styles.otpBox, d && styles.otpFilled]} value={d}
              onChangeText={(t) => handleChange(t, i)} onKeyPress={(e) => handleKey(e, i)}
              keyboardType="number-pad" maxLength={1} textAlign="center"
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Verify & Start</Text>}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          {timer > 0 ? (
            <Text style={styles.timerText}>Resend in {timer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { paddingHorizontal: SIZES.paddingLg, paddingTop: 60 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: SIZES.paddingLg, marginTop: -80 },
  icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text, textAlign: 'center' },
  sub: { fontSize: SIZES.md, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 32, lineHeight: 22 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 36 },
  otpBox: { width: 56, height: 56, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.border, fontSize: 24, fontWeight: '800', color: COLORS.text, backgroundColor: COLORS.surface },
  otpFilled: { borderColor: COLORS.primary },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, alignItems: 'center', ...SHADOWS.glow },
  btnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },
  timerText: { fontSize: SIZES.md, color: COLORS.textMuted },
  resendText: { fontSize: SIZES.md, color: COLORS.primary, fontWeight: '700' },
});
