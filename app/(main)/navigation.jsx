import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, DeviceEventEmitter, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { placesAPI } from '../../src/api/places';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../src/components/MapViewSafe';
import { decodePolyline } from '../../src/utils/helpers';

const { width: SW } = Dimensions.get('window');
const GMAP_GREEN = '#3E8E41';
const GMAP_ROUTE = '#4A66F0';
const GMAP_ROUTE_ALT = '#9AA0A6';
const GMAP_ETA_GREEN = '#1B873B';
const GMAP_GRAY = '#70757A';
const GMAP_DARK = '#202124';

const getManeuverIcon = (m) => {
  m = (m || '').toLowerCase();
  if (m.includes('turn-left') || m.includes('fork-left')) return 'arrow-back';
  if (m.includes('turn-right') || m.includes('fork-right')) return 'arrow-forward';
  if (m.includes('uturn')) return 'return-up-back';
  if (m.includes('roundabout')) return 'sync-circle';
  return 'arrow-up';
};

const haversineM = (a, b) => {
  if (!a || !b) return 99999;
  const R = 6371000, dLat = ((b.latitude - a.latitude) * Math.PI) / 180, dLng = ((b.longitude - a.longitude) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

// Offset camera center BEHIND driver based on heading
const offsetBehind = (loc, heading, dist = 0.0006) => {
  const rad = ((heading || 0) * Math.PI) / 180;
  return {
    latitude: loc.latitude - Math.cos(rad) * dist,
    longitude: loc.longitude - Math.sin(rad) * dist,
  };
};

// Min distance from point to polyline
const distToRoute = (pt, coords) => {
  if (!coords || coords.length === 0) return 99999;
  let min = 99999;
  for (let i = 0; i < coords.length; i += 3) {
    const d = haversineM(pt, coords[i]);
    if (d < min) min = d;
  }
  return min;
};

export default function NavigationScreen() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [destLat, setDestLat] = useState(parseFloat(params.destLat));
  const [destLng, setDestLng] = useState(parseFloat(params.destLng));
  const [destLabel, setDestLabel] = useState(params.destLabel || 'Destination');

  const [myLoc, setMyLoc] = useState(null);
  const [myHeading, setMyHeading] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [routeCoords, setRouteCoords] = useState([]);
  const [altRoutes, setAltRoutes] = useState([]); // [{coords, dist, dur}]
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [totalDistKm, setTotalDistKm] = useState(null);
  const [totalDurMin, setTotalDurMin] = useState(null);
  const [endAddr, setEndAddr] = useState(destLabel);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [camLocked, setCamLocked] = useState(true);
  const [arrived, setArrived] = useState(false);
  const [destChanged, setDestChanged] = useState(null); // {lat, lng, address}
  const [offRoute, setOffRoute] = useState(false);

  const mapRef = useRef(null);
  const locSub = useRef(null);
  const refreshT = useRef(null);
  const offRouteT = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // GPS tracking
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { router.back(); return; }
      locSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 800, distanceInterval: 1 },
        (loc) => {
          setMyLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          setMyHeading(loc.coords.heading ?? 0);
          setSpeed(Math.max(0, loc.coords.speed ?? 0));
        }
      );
    })();
    return () => { locSub.current?.remove(); clearInterval(refreshT.current); clearTimeout(offRouteT.current); };
  }, []);

  // Listen for destination changes from ride-active via DeviceEventEmitter
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('NAV_DEST_CHANGED', (data) => {
      if (data?.lat && data?.lng) {
        setDestChanged({ lat: data.lat, lng: data.lng, address: data.address || 'New Destination' });
      }
    });
    return () => sub.remove();
  }, []);

  // Fetch route
  const fetchRoute = useCallback(async (lat, lng, dLat, dLng) => {
    try {
      const res = await placesAPI.directions(lat, lng, dLat || destLat, dLng || destLng);
      if (res.data.success) {
        if (res.data.geometry) setRouteCoords(decodePolyline(res.data.geometry));
        setTotalDistKm(res.data.distance_km);
        setTotalDurMin(res.data.duration_min);
        if (res.data.steps?.length) setSteps(res.data.steps);
        if (res.data.end_address) setEndAddr(res.data.end_address);
        // Alternative routes
        if (res.data.alternatives?.length) {
          setAltRoutes(res.data.alternatives.map(a => ({
            coords: decodePolyline(a.geometry), dist: a.distance_km, dur: a.duration_min,
          })));
        } else { setAltRoutes([]); }
        setReady(true);
        setStepIdx(0);
        setOffRoute(false);
      }
    } catch (e) { console.warn('Nav err:', e); }
    setLoading(false);
  }, [destLat, destLng]);

  // Initial + periodic refresh
  useEffect(() => { if (myLoc && !ready) fetchRoute(myLoc.latitude, myLoc.longitude); }, [myLoc, ready]);
  useEffect(() => {
    if (!ready) return;
    refreshT.current = setInterval(() => { if (myLoc) fetchRoute(myLoc.latitude, myLoc.longitude); }, 30000);
    return () => clearInterval(refreshT.current);
  }, [ready]);

  useEffect(() => { if (ready) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, [ready]);

  // Camera follow — FROM BEHIND
  useEffect(() => {
    if (!camLocked || !mapRef.current || !myLoc) return;
    const behind = offsetBehind(myLoc, myHeading);
    mapRef.current.animateCamera({ center: behind, pitch: 65, heading: myHeading || 0, zoom: 18 }, { duration: 600 });
  }, [myLoc, myHeading, camLocked]);

  // Track current step + arrival + off-route detection
  useEffect(() => {
    if (!myLoc || !ready) return;
    // Arrived?
    if (haversineM(myLoc, { latitude: destLat, longitude: destLng }) < 40) { setArrived(true); return; }
    // Off-route detection
    const d = distToRoute(myLoc, routeCoords);
    if (d > 80 && !offRoute) {
      setOffRoute(true);
      // Auto re-route after 3 seconds if still off route
      offRouteT.current = setTimeout(() => {
        if (myLoc) { fetchRoute(myLoc.latitude, myLoc.longitude); }
      }, 3000);
    } else if (d < 40) { setOffRoute(false); clearTimeout(offRouteT.current); }
    // Step tracking
    if (steps.length === 0) return;
    for (let i = stepIdx; i < steps.length; i++) {
      const st = steps[i];
      if (!st.end_lat) continue;
      if (haversineM(myLoc, { latitude: st.end_lat, longitude: st.end_lng }) < 25 && i + 1 < steps.length) {
        setStepIdx(i + 1);
        break;
      }
    }
  }, [myLoc, ready, routeCoords, stepIdx]);

  // Accept new destination
  const acceptNewDest = () => {
    if (!destChanged) return;
    setDestLat(destChanged.lat);
    setDestLng(destChanged.lng);
    setDestLabel(destChanged.address);
    setEndAddr(destChanged.address);
    setReady(false);
    setDestChanged(null);
    if (myLoc) fetchRoute(myLoc.latitude, myLoc.longitude, destChanged.lat, destChanged.lng);
  };

  const curStep = steps[stepIdx] || null;
  const speedKmh = Math.round(speed * 3.6);
  const arrivalTime = totalDurMin ? new Date(Date.now() + totalDurMin * 60000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '--';

  if (loading || !myLoc) {
    return (
      <View style={s.loadWrap}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color={GMAP_ROUTE} />
        <Text style={s.loadText}>Finding best route...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={GMAP_GREEN} translucent={false} />
      <MapView
        ref={mapRef} style={StyleSheet.absoluteFillObject} provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: myLoc.latitude, longitude: myLoc.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        showsUserLocation={false} showsMyLocationButton={false} showsCompass={false}
        showsTraffic={false} pitchEnabled rotateEnabled
        onPanDrag={() => setCamLocked(false)}
      >
        {/* Alternative routes (gray, behind main) */}
        {altRoutes.map((alt, i) => alt.coords.length > 0 && (
          <Polyline key={`alt-${i}`} coordinates={alt.coords} strokeColor={GMAP_ROUTE_ALT} strokeWidth={5} lineDashPattern={[0]} />
        ))}
        {/* Main route shadow */}
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor="rgba(74,102,240,0.3)" strokeWidth={14} />}
        {/* Main route */}
        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeColor={GMAP_ROUTE} strokeWidth={7} />}
        {/* Destination pin */}
        <Marker coordinate={{ latitude: destLat, longitude: destLng }} anchor={{ x: 0.5, y: 1 }}>
          <View style={s.destPin}><View style={s.destPinHead}><View style={s.destDot} /></View><View style={s.destStick} /></View>
        </Marker>
        {/* Driver marker */}
        <Marker coordinate={myLoc} rotation={myHeading} flat anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={s.driverWrap}><View style={s.driverBubble}><Ionicons name="car" size={18} color="#fff" /></View></View>
        </Marker>
      </MapView>

      {/* TOP: Green instruction bar */}
      {ready && !arrived && (
        <Animated.View style={[s.instrBar, { opacity: fadeAnim, paddingTop: insets.top || 10 }]}>
          <View style={s.instrRow}>
            <View style={s.instrIcon}>
              <Ionicons name={curStep ? getManeuverIcon(curStep.maneuver) : 'arrow-up'} size={30} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.instrMain} numberOfLines={1}>{curStep?.instruction || `Head towards ${endAddr}`}</Text>
              {curStep?.distance_text && <Text style={s.instrDist}>{curStep.distance_text}</Text>}
            </View>
          </View>
          {offRoute && (
            <View style={s.rerouteBanner}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={s.rerouteText}>Rerouting...</Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* DESTINATION CHANGED NOTIFICATION */}
      {destChanged && (
        <View style={[s.destChangeCard, { top: insets.top + 100 }]}>
          <View style={s.destChangeInner}>
            <Ionicons name="location" size={24} color={GMAP_ROUTE} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.destChangeTitle}>Destination Changed</Text>
              <Text style={s.destChangeAddr} numberOfLines={1}>{destChanged.address}</Text>
            </View>
          </View>
          <View style={s.destChangeBtns}>
            <TouchableOpacity style={s.destChangeDismiss} onPress={() => setDestChanged(null)}>
              <Text style={s.destChangeDismissText}>Dismiss</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.destChangeAccept} onPress={acceptNewDest}>
              <Ionicons name="navigate" size={18} color="#fff" style={{ marginRight: 6 }} />
              <Text style={s.destChangeAcceptText}>Navigate to New</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ARRIVED */}
      {arrived && (
        <View style={[s.arrivedOv, { paddingTop: insets.top + 20 }]}>
          <View style={s.arrivedCard}>
            <Ionicons name="checkmark-circle" size={52} color={GMAP_ETA_GREEN} />
            <Text style={s.arrivedTitle}>You have arrived</Text>
            <Text style={s.arrivedAddr}>{endAddr}</Text>
            <TouchableOpacity style={s.arrivedBtn} onPress={() => router.back()}>
              <Text style={s.arrivedBtnText}>Exit Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RIGHT CONTROLS */}
      {ready && !arrived && (
        <Animated.View style={[s.rightBar, { opacity: fadeAnim }]}>
          <TouchableOpacity style={s.sideBtn}><Ionicons name="search" size={20} color={GMAP_DARK} /></TouchableOpacity>
          <TouchableOpacity style={s.sideBtn}><Ionicons name="volume-high" size={20} color={GMAP_DARK} /></TouchableOpacity>
          <TouchableOpacity style={s.sideBtn}><Ionicons name="warning" size={20} color="#F9AB00" /></TouchableOpacity>
        </Animated.View>
      )}

      {/* SPEED (bottom left) */}
      {ready && !arrived && (
        <Animated.View style={[s.speedBox, { opacity: fadeAnim, bottom: 85 + (insets.bottom || 0) }]}>
          <Text style={s.speedVal}>{speedKmh || '--'}</Text>
          <Text style={s.speedUnit}>km/h</Text>
        </Animated.View>
      )}

      {/* BOTTOM ETA BAR */}
      {ready && !arrived && (
        <Animated.View style={[s.etaBar, { opacity: fadeAnim, paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity style={s.etaClose} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={GMAP_DARK} />
          </TouchableOpacity>
          <View style={s.etaCenter}>
            <View style={s.etaRow}>
              <Text style={s.etaMin}>{totalDurMin || '--'}</Text>
              <Text style={s.etaMinU}> min</Text>
            </View>
            <Text style={s.etaSub}>{totalDistKm ? `${totalDistKm} km` : '--'}  •  {arrivalTime}</Text>
          </View>
          <TouchableOpacity style={s.etaRecenter} onPress={() => { setCamLocked(true); }}>
            <Ionicons name="navigate" size={20} color={camLocked ? GMAP_ROUTE : GMAP_GRAY} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E8E8E8' },
  loadWrap: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  loadText: { marginTop: 16, fontSize: 16, color: GMAP_GRAY, fontWeight: '500' },

  instrBar: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: GMAP_GREEN, paddingHorizontal: 12, paddingBottom: 12, elevation: 8, zIndex: 100 },
  instrRow: { flexDirection: 'row', alignItems: 'center', minHeight: 50 },
  instrIcon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  instrMain: { fontSize: 17, fontWeight: '700', color: '#fff', lineHeight: 21 },
  instrDist: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  rerouteBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, alignSelf: 'flex-start' },
  rerouteText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  destChangeCard: { position: 'absolute', left: 16, right: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 12, zIndex: 200 },
  destChangeInner: { flexDirection: 'row', alignItems: 'center' },
  destChangeTitle: { fontSize: 16, fontWeight: '800', color: GMAP_DARK },
  destChangeAddr: { fontSize: 13, color: GMAP_GRAY, marginTop: 2 },
  destChangeBtns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  destChangeDismiss: { flex: 1, paddingVertical: 12, borderRadius: 24, borderWidth: 1.5, borderColor: '#DADCE0', alignItems: 'center' },
  destChangeDismissText: { fontSize: 14, fontWeight: '700', color: GMAP_GRAY },
  destChangeAccept: { flex: 1.5, paddingVertical: 12, borderRadius: 24, backgroundColor: GMAP_ROUTE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  destChangeAcceptText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  arrivedOv: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-start', alignItems: 'center', zIndex: 200 },
  arrivedCard: { backgroundColor: '#fff', borderRadius: 24, marginHorizontal: 24, padding: 30, alignItems: 'center', elevation: 12 },
  arrivedTitle: { fontSize: 22, fontWeight: '800', color: GMAP_DARK, marginTop: 10 },
  arrivedAddr: { fontSize: 14, color: GMAP_GRAY, marginTop: 4, textAlign: 'center' },
  arrivedBtn: { marginTop: 18, backgroundColor: GMAP_ROUTE, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 26 },
  arrivedBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  rightBar: { position: 'absolute', right: 12, top: '45%', gap: 10, zIndex: 50 },
  sideBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4 },

  speedBox: { position: 'absolute', left: 14, backgroundColor: '#fff', borderRadius: 22, width: 52, height: 52, justifyContent: 'center', alignItems: 'center', elevation: 4, zIndex: 50 },
  speedVal: { fontSize: 17, fontWeight: '800', color: GMAP_DARK, lineHeight: 19 },
  speedUnit: { fontSize: 9, fontWeight: '600', color: GMAP_GRAY },

  etaBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 14, elevation: 16, zIndex: 100 },
  etaClose: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#DADCE0', justifyContent: 'center', alignItems: 'center' },
  etaCenter: { flex: 1, alignItems: 'center' },
  etaRow: { flexDirection: 'row', alignItems: 'baseline' },
  etaMin: { fontSize: 30, fontWeight: '800', color: GMAP_ETA_GREEN },
  etaMinU: { fontSize: 16, fontWeight: '700', color: GMAP_ETA_GREEN },
  etaSub: { fontSize: 13, fontWeight: '500', color: GMAP_GRAY, marginTop: 2 },
  etaRecenter: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, borderColor: '#DADCE0', justifyContent: 'center', alignItems: 'center' },

  driverWrap: { alignItems: 'center' },
  driverBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: GMAP_GREEN, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 6 },

  destPin: { alignItems: 'center' },
  destPinHead: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EA4335', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#B31412' },
  destDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  destStick: { width: 3, height: 9, backgroundColor: '#B31412' },
});
