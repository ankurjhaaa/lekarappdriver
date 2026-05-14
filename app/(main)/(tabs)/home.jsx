import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Animated,
  Vibration,
  Platform,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../src/components/MapViewSafe';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import { driverAPI } from '../../../src/api/driver';
import { CONFIG } from '../../../src/constants/config';
import useAuthStore from '../../../src/store/authStore';
import useDriverStore from '../../../src/store/driverStore';
import { initWebSocket, subscribeToDriver } from '../../../src/services/socket';
import { formatCurrency, formatDistance } from '../../../src/utils/helpers';

const { width, height } = Dimensions.get('window');

export default function DriverHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const {
    driverStatus, setDriverStatus, walletBalance, setWalletBalance,
    currentBooking, setCurrentBooking, rideRequest, setRideRequest,
    requestTimeout, setRequestTimeout, currentLocation, setCurrentLocation,
  } = useDriverStore();

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const mapRef = useRef(null);
  const locationSub = useRef(null);
  const countdownRef = useRef(null);
  const currentRequestRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  // Initial load
  useEffect(() => {
    acceptedRef.current = false; // Reset so new ride requests can show
    initializeDriver();
    return () => {
      if (locationSub.current) locationSub.current.remove();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Pulse animation for online button
  useEffect(() => {
    if (driverStatus === 'online') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [driverStatus]);

  const initializeDriver = async () => {
    // Get location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { 
      Alert.alert('Permission Denied', 'Location is required to receive ride requests. Please enable it in settings.');
      setLoading(false); 
      return; 
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

    // Get driver status from server
    try {
      const res = await driverAPI.getStatus();
      if (res.data.success) {
        setDriverStatus(res.data.driver_status || 'offline');
        setWalletBalance(res.data.wallet_balance || 0);
        setRequestTimeout(res.data.request_timeout || 20);
        if (res.data.booking) {
          setCurrentBooking(res.data.booking);
          router.push({ pathname: '/(main)/ride-active', params: { bookingId: res.data.booking.id } });
        }
      }
    } catch (e) {
      if (e.response?.status === 403) {
        Alert.alert('Awaiting Verification', 'Your account is pending admin approval. You cannot go online yet.');
      } else {
        Alert.alert('Connection Error', 'Could not connect to the server.');
      }
    }

    // Start WebSocket
    try {
      await initWebSocket();
      if (user?.id) {
        subscribeToDriver(user.id, handleNewRideRequest);
      }
    } catch (e) {
      console.warn('WebSocket init failed:', e);
    }

    setLoading(false);
  };

  // Start background location updates when online
  useEffect(() => {
    if (driverStatus === 'online' || driverStatus === 'busy') {
      startLocationUpdates();
    } else {
      if (locationSub.current) { locationSub.current.remove(); locationSub.current = null; }
    }
  }, [driverStatus]);

  const lastLocationPost = useRef(0);

  const startLocationUpdates = async () => {
    if (locationSub.current) locationSub.current.remove();
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: CONFIG.LOCATION_UPDATE_INTERVAL, distanceInterval: 10 },
      (loc) => {
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentLocation(coords);
        
        // Explicitly throttle API post
        const now = Date.now();
        if (now - lastLocationPost.current >= CONFIG.LOCATION_UPDATE_INTERVAL) {
          lastLocationPost.current = now;
          driverAPI.updateLocation(coords.latitude, coords.longitude, loc.coords.heading || 0).catch(() => {});
        }
      }
    );
  };

  // Handle incoming ride request from WebSocket
  const acceptedRef = useRef(false);
  const handleNewRideRequest = useCallback((data) => {
    // Don't show popup if driver already accepted a ride
    if (acceptedRef.current) return;
    
    // Ignore duplicate broadcasts for the same booking to prevent timer reset
    if (currentRequestRef.current === data.booking_id) return;
    currentRequestRef.current = data.booking_id;

    Vibration.vibrate([0, 500, 200, 500, 200, 500]);
    setRideRequest(data);
    setShowRequest(true);
    setCountdown(requestTimeout);

    // Animate
    Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();

    // Countdown
    if (countdownRef.current) clearInterval(countdownRef.current);
    let t = requestTimeout;
    countdownRef.current = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t <= 0) {
        clearInterval(countdownRef.current);
        currentRequestRef.current = null;
        handleRejectRide();
      }
    }, 1000);
  }, [requestTimeout]);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const res = await driverAPI.toggleOnline();
      if (res.data.success) {
        setDriverStatus(res.data.status);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to toggle status.');
    }
    setToggling(false);
  };

  const handleAcceptRide = async () => {
    if (!rideRequest?.booking_id) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    setActionLoading(true);
    try {
      const res = await driverAPI.rideAction('accept', rideRequest.booking_id);
      if (res.data.success) {
        acceptedRef.current = true;
        currentRequestRef.current = null;
        setShowRequest(false);
        setCurrentBooking(res.data.booking);
        setDriverStatus('busy');
        router.push({ pathname: '/(main)/ride-active', params: { bookingId: rideRequest.booking_id } });
      } else {
        Alert.alert('Error', res.data.message || 'Could not accept.');
        setShowRequest(false);
        setRideRequest(null);
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to accept.');
      setShowRequest(false);
      setRideRequest(null);
    }
    setActionLoading(false);
  };

  const handleRejectRide = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowRequest(false);
    currentRequestRef.current = null;
    slideAnim.setValue(300);
    if (rideRequest?.booking_id) {
      try { await driverAPI.rideAction('reject', rideRequest.booking_id); } catch (e) {}
    }
    setRideRequest(null);
  };

  const getStatusColor = () => {
    if (driverStatus === 'online') return COLORS.online;
    if (driverStatus === 'busy') return COLORS.busy;
    return COLORS.offline;
  };

  if (loading) {
    return (
      <View style={styles.loadingC}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={currentLocation ? {
          ...currentLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 * (width / height),
        } : {
          latitude: 25.6117, longitude: 85.1441, latitudeDelta: 0.015, longitudeDelta: 0.015,
        }}
        showsUserLocation showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
      />

      {/* Top Header */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetHi}>Hi, {user?.name?.split(' ')[0] || 'Driver'} 👋</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
                {driverStatus.charAt(0).toUpperCase() + driverStatus.slice(1)}
              </Text>
            </View>
          </View>
          <View style={styles.walletTag}>
            <Ionicons name="wallet" size={16} color={COLORS.primary} />
            <Text style={styles.walletText}>{formatCurrency(walletBalance)}</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Center — My Location */}
      <TouchableOpacity style={styles.locBtn} onPress={() => {
        if (currentLocation && mapRef.current) {
          mapRef.current.animateToRegion({ ...currentLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
        }
      }}>
        <Ionicons name="locate" size={22} color={COLORS.primary} />
      </TouchableOpacity>

      {/* Bottom — Online Toggle */}
      <View style={styles.bottomArea}>
        {currentBooking && (
          <TouchableOpacity style={styles.activeBanner} onPress={() => router.push({ pathname: '/(main)/ride-active', params: { bookingId: currentBooking.id } })}>
            <Ionicons name="navigate" size={18} color={COLORS.white} />
            <Text style={styles.activeText}>Active ride • Tap to view</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.toggleBtn, driverStatus === 'online' && styles.toggleBtnOnline]}
            onPress={handleToggleOnline} disabled={toggling || driverStatus === 'busy'}
            activeOpacity={0.8}
          >
            {toggling ? (
              <ActivityIndicator color={COLORS.white} size="large" />
            ) : (
              <>
                <Ionicons name={driverStatus === 'online' ? 'power' : 'power-outline'} size={32} color={COLORS.white} />
                <Text style={styles.toggleText}>
                  {driverStatus === 'online' ? 'GO OFFLINE' : driverStatus === 'busy' ? 'ON TRIP' : 'GO ONLINE'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Ride Request Modal */}
      <Modal visible={showRequest} transparent animationType="none">
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.requestCard, { transform: [{ translateY: slideAnim }] }]}>
            {/* Countdown ring */}
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNum}>{countdown}</Text>
              <Text style={styles.countdownLabel}>sec</Text>
            </View>

            <Text style={styles.requestTitle}>New Ride Request!</Text>

            {/* Customer Name */}
            {rideRequest?.customer_name && (
              <Text style={{ fontSize: SIZES.md, color: COLORS.textSecondary, marginBottom: 12 }}>
                {rideRequest.customer_name}
              </Text>
            )}

            {/* Ride Info */}
            <View style={styles.requestInfo}>
              <View style={styles.requestRow}>
                <View style={styles.greenDot} />
                <Text style={styles.requestAddr} numberOfLines={1}>{rideRequest?.pickup_location || rideRequest?.pickup || 'Pickup'}</Text>
              </View>
              <View style={styles.dottedLine} />
              <View style={styles.requestRow}>
                <View style={styles.redDot} />
                <Text style={styles.requestAddr} numberOfLines={1}>{rideRequest?.drop_location || rideRequest?.drop || 'Drop'}</Text>
              </View>
            </View>

            <View style={styles.requestMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{formatDistance(rideRequest?.distance_km || rideRequest?.distance)}</Text>
                <Text style={styles.metaLabel}>Distance</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={[styles.metaValue, { color: COLORS.primary }]}>{formatCurrency(rideRequest?.fare_total || rideRequest?.fare)}</Text>
                <Text style={styles.metaLabel}>Fare</Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaValue}>{rideRequest?.vehicle_type || '--'}</Text>
                <Text style={styles.metaLabel}>Type</Text>
              </View>
              {(rideRequest?.duration_min || rideRequest?.duration) ? (
                <>
                  <View style={styles.metaDivider} />
                  <View style={styles.metaItem}>
                    <Text style={styles.metaValue}>{rideRequest?.duration_min || rideRequest?.duration} min</Text>
                    <Text style={styles.metaLabel}>ETA</Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Actions */}
            <View style={styles.requestActions}>
              <TouchableOpacity style={styles.rejectBtn} onPress={handleRejectRide} disabled={actionLoading}>
                <Ionicons name="close" size={24} color={COLORS.error} />
                <Text style={styles.rejectText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptRide} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="checkmark" size={24} color={COLORS.white} />
                    <Text style={styles.acceptText}>Accept</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontSize: SIZES.md },

  topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingTop: Platform.OS === 'android' ? 44 : 8, paddingBottom: 8,
  },
  greetHi: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.white },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: SIZES.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  walletTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull,
    borderWidth: 1, borderColor: COLORS.border,
  },
  walletText: { fontSize: SIZES.md, fontWeight: '700', color: COLORS.text },

  locBtn: {
    position: 'absolute', right: 16, bottom: 200,
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium, borderWidth: 1, borderColor: COLORS.border,
  },

  bottomArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', paddingBottom: 40,
  },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: SIZES.radiusFull, gap: 8,
    marginBottom: 16, ...SHADOWS.glow,
  },
  activeText: { color: COLORS.white, fontSize: SIZES.sm, fontWeight: '600' },

  toggleBtn: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.medium,
    borderWidth: 3, borderColor: COLORS.border,
  },
  toggleBtnOnline: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight, ...SHADOWS.glow },
  toggleText: { color: COLORS.white, fontSize: SIZES.xs, fontWeight: '800', marginTop: 6, letterSpacing: 1 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  requestCard: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl, borderTopRightRadius: SIZES.radiusXl,
    paddingHorizontal: SIZES.paddingLg, paddingTop: 24, paddingBottom: 40, alignItems: 'center',
  },
  countdownCircle: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  countdownNum: { fontSize: 24, fontWeight: '900', color: COLORS.primary },
  countdownLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: -4 },
  requestTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, marginBottom: 16 },

  requestInfo: { width: '100%', backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radius, padding: 16, marginBottom: 16 },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  dottedLine: { width: 1, height: 14, backgroundColor: COLORS.border, marginLeft: 4.5 },
  requestAddr: { flex: 1, fontSize: SIZES.md, color: COLORS.text },

  requestMeta: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginBottom: 24,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  metaLabel: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },
  metaDivider: { width: 1, height: 30, backgroundColor: COLORS.border },

  requestActions: { flexDirection: 'row', width: '100%', gap: 12 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: SIZES.radius, borderWidth: 2, borderColor: COLORS.error,
  },
  rejectText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.error },
  acceptBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: SIZES.radius, backgroundColor: COLORS.success,
  },
  acceptText: { fontSize: SIZES.base, fontWeight: '700', color: COLORS.white },
});
