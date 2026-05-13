import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../src/constants/theme';
import { driverAPI } from '../../../src/api/driver';
import { formatCurrency, formatDistance } from '../../../src/utils/helpers';

export default function DriverRidesScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const res = await driverAPI.getRideHistory();
      setRides(res.data.rides?.data || []);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: item.status === 'ride_completed' ? COLORS.success + '20' : COLORS.error + '20' }]}>
          <View style={[styles.badgeDot, { backgroundColor: item.status === 'ride_completed' ? COLORS.success : COLORS.error }]} />
          <Text style={[styles.badgeText, { color: item.status === 'ride_completed' ? COLORS.success : COLORS.error }]}>
            {item.status === 'ride_completed' ? 'Completed' : 'Cancelled'}
          </Text>
        </View>
        <Text style={styles.cardFare}>{formatCurrency(item.fare_total)}</Text>
      </View>

      <View style={styles.locArea}>
        <View style={styles.locRow}><View style={styles.gDot} /><Text style={styles.locText} numberOfLines={1}>{item.pickup_location}</Text></View>
        <View style={styles.dLine} />
        <View style={styles.locRow}><View style={styles.rDot} /><Text style={styles.locText} numberOfLines={1}>{item.drop_location}</Text></View>
      </View>

      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
        <Text style={styles.cardDist}>{formatDistance(item.distance_km)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Ride History</Text></View>
      <FlatList
        data={rides} keyExtractor={(i) => String(i.id)} renderItem={renderRide}
        contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={50} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No rides yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  list: { paddingHorizontal: SIZES.padding, paddingBottom: 20 },
  card: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, gap: 6 },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: SIZES.xs, fontWeight: '700' },
  cardFare: { fontSize: SIZES.lg, fontWeight: '800', color: COLORS.text },
  locArea: { marginBottom: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  gDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  rDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  dLine: { width: 1, height: 14, backgroundColor: COLORS.border, marginLeft: 3.5 },
  locText: { flex: 1, fontSize: SIZES.sm, color: COLORS.text },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  cardDate: { fontSize: SIZES.xs, color: COLORS.textMuted },
  cardDist: { fontSize: SIZES.xs, fontWeight: '600', color: COLORS.textSecondary },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: SIZES.md, color: COLORS.textMuted, marginTop: 12 },
});
