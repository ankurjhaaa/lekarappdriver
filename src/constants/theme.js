// Driver App Theme — Dark + Red accent
export const COLORS = {
  primary: '#E63946',
  primaryDark: '#C1121F',
  primaryLight: '#FF6B6B',

  background: '#0F0F14',
  surface: '#1A1A24',
  surfaceLight: '#252532',
  card: '#1E1E2E',

  white: '#FFFFFF',
  black: '#000000',

  text: '#F0F0F5',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  online: '#10B981',
  offline: '#6B7280',
  busy: '#F59E0B',

  border: '#2A2A3A',
  divider: '#1F1F2E',
  overlay: 'rgba(0,0,0,0.7)',
  inputBg: '#1A1A24',
};

export const SIZES = {
  xs: 10, sm: 12, md: 14, base: 16, lg: 18, xl: 20, xxl: 24, xxxl: 32,
  padding: 16, paddingLg: 24, paddingXl: 32,
  radius: 12, radiusLg: 16, radiusXl: 24, radiusFull: 999,
};

export const SHADOWS = {
  small: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  glow: { shadowColor: '#E63946', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
};
