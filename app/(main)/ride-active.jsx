import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Dimensions,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { driverAPI } from '../../src/api/driver';
import { placesAPI } from '../../src/api/places';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../src/components/MapViewSafe';
import ChatModal from '../../src/components/ride/ChatModal';
import { COLORS, SHADOWS, SIZES } from '../../src/constants/theme';
import { initWebSocket, subscribeToBooking } from '../../src/services/socket';
import useDriverStore from '../../src/store/driverStore';
import { decodePolyline, formatCurrency, formatDistance } from '../../src/utils/helpers';

const { width } = Dimensions.get('window');

export default function RideActiveScreen() {
  const { bookingId } = useLocalSearchParams();
  const { setDriverStatus, clearBooking, currentLocation } = useDriverStore();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [myLoc, setMyLoc] = useState(currentLocation || null);
  const [myHeading, setMyHeading] = useState(0);
  const mapRef = useRef(null);
  const pollRef = useRef(null);
  const locationSub = useRef(null);
  const wsSubscribed = useRef(false);

  const startWebSocket = async (id) => {
    if (wsSubscribed.current) return;
    await initWebSocket();
    subscribeToBooking(id, (data) => {
      setBooking((prev) => ({ ...prev, ...data }));
      if (data.destination_changed) {
        const newDropLat = parseFloat(data.drop_lat);
        const newDropLng = parseFloat(data.drop_lng);
        if (newDropLat && newDropLng) {
          // Re-fetch route on this screen
          if (myLoc) {
            fetchRoute(myLoc.latitude, myLoc.longitude, newDropLat, newDropLng);
            setRouteFetchedForStatus('');
            setTimeout(() => {
              mapRef.current?.fitToCoordinates(
                [{ latitude: myLoc.latitude, longitude: myLoc.longitude }, { latitude: newDropLat, longitude: newDropLng }],
                { edgePadding: { top: 100, right: 60, bottom: 300, left: 60 }, animated: true }
              );
            }, 600);
          } else {
            setRouteFetchedForStatus('');
          }
          // Emit to navigation screen if it's open
          DeviceEventEmitter.emit('NAV_DEST_CHANGED', {
            lat: newDropLat, lng: newDropLng,
            address: data.drop_location || 'Updated Destination',
          });
        }
      }
    }, (msg) => {
      if (chatMsgRef.current) chatMsgRef.current(msg);
    });
    wsSubscribed.current = true;
  };
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeFetchedForStatus, setRouteFetchedForStatus] = useState('');
  const [liveDistanceKm, setLiveDistanceKm] = useState(null);
  const [liveETA, setLiveETA] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const chatMsgRef = useRef(null);

  const getVehicleIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'bike') return 'bicycle';
    if (t === 'auto') return 'car-sport';
    if (t === 'toto') return 'bus';
    if (t === 'car' || t === 'cab') return 'car';
    return 'car';
  };

  const headingSub = useRef(null);
  const speedRef = useRef(0);

  useEffect(() => {
    loadBooking();
    startPolling();
    startLocationTracking();
    if (bookingId) startWebSocket(bookingId);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (locationSub.current) locationSub.current.remove();
      if (headingSub.current) headingSub.current.remove();
    };
  }, []);

  // Live GPS tracking — High Frequency for Navigation
  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    // GPS Position
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 800, distanceInterval: 1 },
      (loc) => {
        setMyLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        const speed = loc.coords.speed || 0;
        speedRef.current = speed;
        // Strictly use GPS heading when moving fast enough (it's much more stable than compass)
        if (speed > 1.5 && loc.coords.heading) {
          setMyHeading(loc.coords.heading);
        }
      }
    );

    // Device Compass / Gyroscope Tracking
    headingSub.current = await Location.watchHeadingAsync((heading) => {
      // If the vehicle is moving, ignore the compass completely to prevent jitter
      if (speedRef.current > 1.5) return;

      const newH = heading.trueHeading !== -1 ? heading.trueHeading : heading.magHeading;
      setMyHeading((prev) => {
        // Dampen: Only rotate the map if the phone is turned by more than 4 degrees
        if (Math.abs(newH - prev) > 4) return newH;
        return prev;
      });
    });
  };

  // Fit map and update route geometry based on status
  useEffect(() => {
    if (!mapRef.current || !booking || !myLoc) return;

    const s = booking.status;
    if (routeFetchedForStatus === s) return; // Prevent API spam

    const points = [{ latitude: myLoc.latitude, longitude: myLoc.longitude }];

    if (['driver_assigned', 'driver_enroute', 'arrived_at_pickup'].includes(s) && booking.pickup_lat) {
      points.push({ latitude: parseFloat(booking.pickup_lat), longitude: parseFloat(booking.pickup_lng) });
      // Fetch driver → pickup route
      fetchRoute(myLoc.latitude, myLoc.longitude, parseFloat(booking.pickup_lat), parseFloat(booking.pickup_lng));
      setRouteFetchedForStatus(s);
    } else if (['ride_started', 'otp_verified'].includes(s) && booking.drop_lat) {
      points.push({ latitude: parseFloat(booking.drop_lat), longitude: parseFloat(booking.drop_lng) });
      // Fetch driver → drop route
      fetchRoute(myLoc.latitude, myLoc.longitude, parseFloat(booking.drop_lat), parseFloat(booking.drop_lng));
      setRouteFetchedForStatus(s);
    }
    if (points.length > 1) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(points, { edgePadding: { top: 100, right: 60, bottom: 300, left: 60 }, animated: true });
      }, 500);
    }
  }, [booking?.status, routeFetchedForStatus]);

  // Smooth camera follow — Camera focuses AHEAD of the driver
  useEffect(() => {
    if (!isNavigating || !mapRef.current || !myLoc) return;
    const rad = ((myHeading || 0) * Math.PI) / 180;

    // Offset camera center slightly AHEAD of the car so the car stays in the lower-middle
    // and the road geometry ahead is fully visible.
    const centerLat = myLoc.latitude + Math.cos(rad) * 0.0003;
    const centerLng = myLoc.longitude + Math.sin(rad) * 0.0003;

    mapRef.current.animateCamera({
      center: { latitude: centerLat, longitude: centerLng },
      pitch: 65, // Optimal pitch to see far ahead without distorting the map route
      heading: myHeading || 0,
      zoom: 20, // Very close zoom
    }, { duration: 1000 });
  }, [myLoc, myHeading, isNavigating]);

  // Refresh route every 20s during navigation
  const navRefreshRef = useRef(null);
  useEffect(() => {
    if (!isNavigating || !myLoc || !booking) return;
    navRefreshRef.current = setInterval(() => {
      if (!myLoc) return;
      const s = booking?.status;
      if (['driver_assigned', 'driver_enroute', 'arrived_at_pickup'].includes(s) && booking.pickup_lat) {
        fetchRoute(myLoc.latitude, myLoc.longitude, parseFloat(booking.pickup_lat), parseFloat(booking.pickup_lng));
      } else if (['ride_started', 'otp_verified'].includes(s) && booking.drop_lat) {
        fetchRoute(myLoc.latitude, myLoc.longitude, parseFloat(booking.drop_lat), parseFloat(booking.drop_lng));
      }
    }, 20000);
    return () => clearInterval(navRefreshRef.current);
  }, [isNavigating, booking?.status]);

  const stopInAppNavigation = () => {
    setIsNavigating(false);
    setRouteFetchedForStatus('');
    clearInterval(navRefreshRef.current);
  };

  const fetchRoute = async (fromLat, fromLng, toLat, toLng) => {
    try {
      const res = await placesAPI.directions(fromLat, fromLng, toLat, toLng);
      if (res.data.success) {
        if (res.data.geometry) setRouteCoords(decodePolyline(res.data.geometry));
        setLiveDistanceKm(res.data.distance_km);
        setLiveETA(res.data.duration_min);
      }
    } catch (e) { console.warn('Route fetch error:', e); }
  };

  const loadBooking = async () => {
    try {
      const res = await driverAPI.getStatus();
      if (res.data.success && res.data.booking) {
        setBooking(res.data.booking);
        startWebSocket(res.data.booking.id);
      }
    } catch (e) { }
    setLoading(false);
  };

  const startPolling = () => {
    // Polling is a safety fallback — WebSocket handles real-time
    pollRef.current = setInterval(async () => {
      try {
        const res = await driverAPI.getStatus();
        if (res.data.booking) setBooking(res.data.booking);
        if (!res.data.booking || ['ride_completed', 'canceled'].includes(res.data.booking?.status)) {
          clearInterval(pollRef.current);
        }
      } catch (e) { }
    }, 30000); // 30s fallback
  };

  // In-app navigation — just toggle camera follow mode
  const openNavigation = () => {
    setIsNavigating(true);
  };

  const handleAction = async (action, extra = {}) => {
    setActionLoading(true);
    try {
      const res = await driverAPI.rideAction(action, booking?.id || bookingId, extra);
      if (res.data.success) {
        if (action === 'mark_paid') {
          clearBooking();
          setDriverStatus('online');
          router.replace('/(main)/(tabs)/home');
          return;
        }
        if (res.data.booking) setBooking(res.data.booking);
        loadBooking();
      } else {
        Alert.alert('Error', res.data.message || 'Action failed.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Failed.');
    }
    setActionLoading(false);
  };

  const handleVerifyOtp = () => {
    if (otpInput.length !== 4) { Alert.alert('Error', 'Enter 4-digit OTP.'); return; }
    setShowOtpModal(false);
    handleAction('verify_otp', { otp: otpInput });
  };

  const handleComplete = () => {
    setShowCompleteModal(false);
    handleAction('complete');
  };

  const getActionUI = () => {
    if (!booking) return null;
    const s = booking.status;

    if (s === 'driver_assigned' || s === 'driver_enroute') {
      return (
        <View style={styles.actionArea}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="person" size={16} color={COLORS.textSecondary} />
              <Text style={styles.infoText}>{booking.user?.name || 'Passenger'}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn}>
              <Ionicons name="call" size={18} color={COLORS.success} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addrRow}><View style={styles.gDot} /><Text style={styles.addrText} numberOfLines={1}>{booking.pickup_location}</Text></View>
            <View style={styles.dLine} />
            <View style={styles.addrRow}><View style={styles.rDot} /><Text style={styles.addrText} numberOfLines={1}>{booking.drop_location}</Text></View>
          </View>

          {/* Navigate to Pickup */}
          <TouchableOpacity style={styles.navBtn} onPress={() => openNavigation(booking.pickup_lat, booking.pickup_lng, 'Pickup')}>
            <Ionicons name="navigate" size={18} color={COLORS.info} />
            <Text style={styles.navBtnText}>Navigate to Pickup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleAction('arrived')} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator color={COLORS.white} /> : (
              <><Ionicons name="flag" size={20} color={COLORS.white} /><Text style={styles.primaryBtnText}>I've Arrived</Text></>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (s === 'arrived_at_pickup') {
      return (
        <View style={styles.actionArea}>
          <View style={styles.arrivedBanner}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
            <Text style={styles.arrivedText}>You've arrived at pickup</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.waitingText}>Waiting for passenger...</Text>
            <TouchableOpacity style={styles.callBtn} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${booking.user_phone || ''}`)}>
              <Ionicons name="call" size={18} color={COLORS.success} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.info }]} onPress={() => { setOtpInput(''); setShowOtpModal(true); }} disabled={actionLoading}>
            <Ionicons name="keypad" size={20} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Enter OTP to Start</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (s === 'otp_verified' || s === 'ride_started') {
      return (
        <View style={styles.actionArea}>
          <View style={[styles.arrivedBanner, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="navigate" size={20} color={COLORS.success} />
            <Text style={[styles.arrivedText, { color: COLORS.success }]}>Ride in progress</Text>
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addrRow}>
              <View style={styles.rDot} />
              <Text style={[styles.addrText, { flex: 1 }]} numberOfLines={2}>Drop: {booking.drop_location}</Text>
              {booking.segments && booking.segments.length > 0 && (
                <TouchableOpacity onPress={() => setShowHistory(true)} style={{ paddingLeft: 8 }}>
                  <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.rideMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaV}>{formatDistance(liveDistanceKm || booking.distance_km)}</Text>
              <Text style={styles.metaL}>Left</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaV}>{liveETA || booking.duration_min || '...'} min</Text>
              <Text style={styles.metaL}>ETA</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaV, { color: COLORS.primary }]}>{formatCurrency(booking.fare_total)}</Text>
              <Text style={styles.metaL}>Fare</Text>
            </View>
          </View>

          {/* Navigate to Drop */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.navBtn, { flex: 1 }]} onPress={() => openNavigation(booking.drop_lat, booking.drop_lng, 'Drop')}>
              <Ionicons name="navigate" size={18} color={COLORS.info} />
              <Text style={styles.navBtnText}>Navigate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: COLORS.primary + '10' }]} onPress={() => setShowChat(true)}>
              <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.warning }]} onPress={() => setShowCompleteModal(true)} disabled={actionLoading}>
            <Ionicons name="checkmark-done" size={20} color={COLORS.black} />
            <Text style={[styles.primaryBtnText, { color: COLORS.black }]}>Complete Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (s === 'ride_completed') {
      return (
        <View style={styles.actionArea}>
          <View style={styles.completedCard}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.completedTitle}>Ride Completed!</Text>
            <Text style={styles.completedFare}>{formatCurrency(booking.fare_total)}</Text>
            <Text style={styles.paymentLabel}>
              {booking.payment_status === 'paid' ? '✅ Payment Collected' : '💰 Collect Cash from Passenger'}
            </Text>
          </View>

          {booking.payment_status !== 'paid' && (
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: COLORS.success }]} onPress={() => handleAction('mark_paid')} disabled={actionLoading}>
              {actionLoading ? <ActivityIndicator color={COLORS.white} /> : (
                <><Ionicons name="cash" size={20} color={COLORS.white} /><Text style={styles.primaryBtnText}>Payment Collected</Text></>
              )}
            </TouchableOpacity>
          )}

          {booking.payment_status === 'paid' && (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => { clearBooking(); setDriverStatus('online'); router.replace('/(main)/(tabs)/home'); }}>
              <Text style={styles.primaryBtnText}>Back to Home</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return <View style={styles.loadingC}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MapView
        ref={mapRef} style={styles.map} provider={PROVIDER_GOOGLE}
        customMapStyle={navMapStyle}
        initialRegion={{
          latitude: currentLocation?.latitude || booking?.pickup_lat || 25.6117,
          longitude: currentLocation?.longitude || booking?.pickup_lng || 85.1441,
          latitudeDelta: 0.02, longitudeDelta: 0.02,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsBuildings={false}
        showsTraffic={false}
        showsPointsOfInterest={false}
        showsIndoors={false}
      >
        {/* Pickup Marker — only show before ride starts */}
        {booking?.pickup_lat && !['ride_started', 'otp_verified', 'ride_completed'].includes(booking?.status) && (
          <Marker coordinate={{ latitude: parseFloat(booking.pickup_lat), longitude: parseFloat(booking.pickup_lng) }}>
            <View style={styles.pickupMarker}><Ionicons name="person" size={20} color={COLORS.white} /></View>
          </Marker>
        )}
        {/* Drop Marker — show during ride and after */}
        {booking?.drop_lat && ['ride_started', 'otp_verified', 'driver_assigned', 'driver_enroute', 'arrived_at_pickup'].includes(booking?.status) && (
          <Marker coordinate={{ latitude: parseFloat(booking.drop_lat), longitude: parseFloat(booking.drop_lng) }}>
            <View style={styles.dropMarker}><Ionicons name="flag" size={20} color={COLORS.primary} /></View>
          </Marker>
        )}
        {/* Route Polyline — thick blue like Google Maps */}
        {routeCoords.length > 0 && (
          <>
            <Polyline coordinates={routeCoords} strokeColor="rgba(66,133,244,0.25)" strokeWidth={12} />
            <Polyline coordinates={routeCoords} strokeColor="#4285F4" strokeWidth={6} />
          </>
        )}
        {/* Driver's own location marker with heading */ /* Always points forward based on device orientation */}
        {myLoc && (
          <Marker
            coordinate={{ latitude: myLoc.latitude, longitude: myLoc.longitude }}
            rotation={myHeading}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
            style={{ zIndex: 1000 }}
          >
            <View style={styles.driverPuckWrap}>
              {/* Massive 3D Navigation Chevron matching the image */}
              <Ionicons name="navigate" size={80} color="#4285F4" style={styles.pureChevron} />
            </View>
          </Marker>
        )}
      </MapView>

      {!isNavigating && (
        <SafeAreaView style={styles.topOverlay}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Floating ETA/Distance bar during navigation */}
      {isNavigating && (
        <View style={styles.navEtaBar}>
          <TouchableOpacity style={styles.navExitCircle} onPress={stopInAppNavigation}>
            <Ionicons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.navEtaCenter}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={styles.navEtaMin}>{liveETA || booking?.duration_min || '--'}</Text>
              <Text style={styles.navEtaMinLabel}> min</Text>
            </View>
            <Text style={styles.navEtaSub}>
              {liveDistanceKm ? `${parseFloat(liveDistanceKm).toFixed(1)} km` : '--'}  •  {liveETA ? new Date(Date.now() + (liveETA) * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--'}
            </Text>
          </View>
          <TouchableOpacity style={[styles.navRecenter, { marginRight: 10 }]} onPress={() => {
            const destLat = ['ride_started', 'otp_verified'].includes(booking?.status) ? booking.drop_lat : booking.pickup_lat;
            const destLng = ['ride_started', 'otp_verified'].includes(booking?.status) ? booking.drop_lng : booking.pickup_lng;
            const url = `google.navigation:q=${destLat},${destLng}`;
            Linking.openURL(url).catch(() => {
              Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}`);
            });
          }}>
            <Ionicons name="map" size={20} color="#34A853" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navRecenter} onPress={() => {
            if (mapRef.current && myLoc) {
              const rad = ((myHeading || 0) * Math.PI) / 180;
              mapRef.current.animateCamera({ center: { latitude: myLoc.latitude + Math.cos(rad) * 0.0003, longitude: myLoc.longitude + Math.sin(rad) * 0.0003 }, pitch: 65, heading: myHeading, zoom: 20 }, { duration: 400 });
            }
          }}>
            <Ionicons name="navigate" size={20} color="#4285F4" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Panel */}
      {!isNavigating && <View style={styles.bottomPanel}>{getActionUI()}</View>}

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade">
        <View style={styles.modalOv}>
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Enter Passenger OTP</Text>
            <TextInput
              style={styles.otpInput} value={otpInput} onChangeText={(t) => setOtpInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad" maxLength={4} placeholder="----" placeholderTextColor={COLORS.textMuted}
              textAlign="center" autoFocus
            />
            <View style={styles.otpBtns}>
              <TouchableOpacity style={styles.otpCancel} onPress={() => setShowOtpModal(false)}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.otpConfirm} onPress={handleVerifyOtp}>
                <Text style={styles.otpConfirmText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Complete Confirmation */}
      <Modal visible={showCompleteModal} transparent animationType="fade">
        <View style={styles.modalOv}>
          <View style={styles.otpModal}>
            <Text style={styles.otpTitle}>Complete this ride?</Text>
            <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 }}>
              Fare: {formatCurrency(booking?.fare_total)}{'\n'}Make sure you have reached the drop location.
            </Text>
            <View style={styles.otpBtns}>
              <TouchableOpacity style={styles.otpCancel} onPress={() => setShowCompleteModal(false)}>
                <Text style={styles.otpCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.otpConfirm, { backgroundColor: COLORS.warning }]} onPress={handleComplete}>
                <Text style={[styles.otpConfirmText, { color: COLORS.black }]}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Destination History Modal */}
      <Modal visible={showHistory} animationType="fade" transparent>
        <View style={styles.modalOv}>
          <View style={[styles.otpModal, { maxHeight: '80%' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text }}>Destination History</Text>
              <TouchableOpacity onPress={() => setShowHistory(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400, marginTop: 10 }}>
              {booking?.segments?.map((seg, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <View style={{ alignItems: 'center', marginRight: 12 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === booking.segments.length - 1 ? COLORS.primary : COLORS.textSecondary }} />
                    {i < booking.segments.length - 1 && <View style={{ width: 2, height: 40, backgroundColor: COLORS.border, marginTop: 4 }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: SIZES.sm, color: COLORS.textSecondary }}>{i === 0 ? 'Original Destination' : `Changed Destination ${i}`}</Text>
                    <Text style={{ fontSize: SIZES.md, color: COLORS.text, fontWeight: '600', marginTop: 2 }}>{seg.to_address}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Chat Modal */}
      <ChatModal
        visible={showChat}
        onClose={() => setShowChat(false)}
        bookingId={booking?.id}
        userName={booking?.user_name || 'Rider'}
        onNewMessage={chatMsgRef}
      />
    </SafeAreaView>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
    justifyContent: 'center', alignItems: 'center', marginLeft: 16, marginTop: 8, ...SHADOWS.medium,
    borderWidth: 1, borderColor: COLORS.border,
  },

  navEtaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: Platform.OS === 'android' ? 14 : 34, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.12, shadowRadius: 6 },
  navExitCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#DADCE0', justifyContent: 'center', alignItems: 'center' },
  navEtaCenter: { flex: 1, alignItems: 'center' },
  navEtaMin: { fontSize: 30, fontWeight: '800', color: '#1B873B' },
  navEtaMinLabel: { fontSize: 16, fontWeight: '700', color: '#1B873B' },
  navEtaSub: { fontSize: 13, fontWeight: '500', color: '#70757A', marginTop: 2 },
  navRecenter: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#DADCE0', justifyContent: 'center', alignItems: 'center' },

  pickupMarker: { alignItems: 'center' },
  dropMarker: { alignItems: 'center' },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface, borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl, ...SHADOWS.medium,
  },

  actionArea: { paddingHorizontal: SIZES.paddingLg, paddingTop: 20, paddingBottom: 36 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: SIZES.base, fontWeight: '600', color: COLORS.text },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.success + '15',
    justifyContent: 'center', alignItems: 'center',
  },

  addressCard: { backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radius, padding: 14, marginBottom: 16 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  gDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  rDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  dLine: { width: 1, height: 14, backgroundColor: COLORS.border, marginLeft: 4.5 },
  addrText: { flex: 1, fontSize: SIZES.sm, color: COLORS.text },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: SIZES.radius, ...SHADOWS.glow,
  },
  primaryBtnText: { color: COLORS.white, fontSize: SIZES.lg, fontWeight: '700' },

  arrivedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.info + '15',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: SIZES.radius, marginBottom: 12,
  },
  arrivedText: { color: COLORS.info, fontSize: SIZES.md, fontWeight: '600' },
  waitingText: { fontSize: SIZES.md, color: COLORS.textSecondary },

  rideMeta: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  metaItem: { alignItems: 'center' },
  metaV: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  metaL: { fontSize: SIZES.xs, color: COLORS.textMuted, marginTop: 2 },

  completedCard: { alignItems: 'center', paddingVertical: 20 },
  completedTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, marginTop: 12 },
  completedFare: { fontSize: 36, fontWeight: '900', color: COLORS.success, marginTop: 4 },
  paymentLabel: { fontSize: SIZES.md, color: COLORS.textSecondary, marginTop: 8 },

  // Modals
  modalOv: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center' },
  otpModal: { backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLg, padding: 24, width: width - 48 },
  otpTitle: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 20 },
  otpInput: {
    backgroundColor: COLORS.surfaceLight, borderRadius: SIZES.radius, paddingVertical: 16,
    fontSize: 28, fontWeight: '800', color: COLORS.text, letterSpacing: 12, borderWidth: 2,
    borderColor: COLORS.border, marginBottom: 20,
  },
  otpBtns: { flexDirection: 'row', gap: 12 },
  otpCancel: { flex: 1, paddingVertical: 14, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  otpCancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  otpConfirm: { flex: 1, paddingVertical: 14, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, alignItems: 'center' },
  otpConfirmText: { color: COLORS.white, fontWeight: '700' },

  // Navigate button
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: SIZES.radius, borderWidth: 1.5,
    borderColor: COLORS.info, marginBottom: 10,
  },
  navBtnText: { color: COLORS.info, fontSize: SIZES.md, fontWeight: '700' },

  // Driver marker on map
  driverPuckWrap: {
    width: 100, height: 100, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent'
  },
  pureChevron: {
    transform: [{ rotate: '45deg' }], // Align strictly UP
    textShadowColor: 'transparent', // Ensure no shadow acts as a circle on android
  },
});

const navMapStyle = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e0e0e0' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] }
];
