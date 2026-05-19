import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * DriverHeader — Reusable slate-dark header with curved bottom wave.
 * Designed explicitly for Lekar Driver application.
 * 
 * Props:
 *  - title: string (if provided, shows page title, otherwise shows "Lekar Driver" logo)
 *  - onBack: function (if provided, shows back arrow)
 *  - rightIcon: string (ionicon name, e.g. 'notifications-outline')
 *  - onRightPress: function
 *  - compact: boolean (smaller padding)
 */
export default function DriverHeader({
  title,
  onBack,
  rightIcon,
  onRightPress,
  compact = false,
}) {
  const insets = useSafeAreaInsets();
  
  const handleBackPress = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const dynamicPaddingTop = compact 
    ? (insets.top > 0 ? insets.top + 4 : (Platform.OS === 'android' ? 32 : 12))
    : (insets.top > 0 ? insets.top + 10 : (Platform.OS === 'android' ? 44 : 20));

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F14" translucent />
      <View style={[styles.headerBg, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.headerContent}>
          {/* Left */}
          {onBack ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}

          {/* Center — Lekar Logo or Title */}
          <View style={{ alignItems: 'center' }}>
            {title ? (
              <Text style={styles.pageTitle}>{title}</Text>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.lekarLogo}>Lekar <Text style={styles.driverSub}>Driver</Text></Text>
                <View style={styles.accentSwoosh} />
              </View>
            )}
          </View>

          {/* Right */}
          {rightIcon ? (
            <TouchableOpacity onPress={onRightPress} style={styles.iconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name={rightIcon} size={24} color={COLORS.white} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
      
      {/* Curved wave bottom — using a dark slate ellipse overflow trick to create visual depth */}
      <View style={styles.waveWrapper}>
        <View style={styles.waveCurve} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headerBg: {
    backgroundColor: '#0F0F14',
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  lekarLogo: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  driverSub: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
    fontStyle: 'normal',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  accentSwoosh: {
    width: 32,
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginTop: 0,
    marginLeft: 32,
    transform: [{ rotate: '-4deg' }],
  },
  // Wave effect — dark slate ellipse that extends slightly below header
  waveWrapper: {
    height: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  waveCurve: {
    backgroundColor: '#0F0F14',
    height: 24,
    marginTop: -16,
    borderBottomLeftRadius: 9999,
    borderBottomRightRadius: 9999,
    marginHorizontal: -20,
  },
});
