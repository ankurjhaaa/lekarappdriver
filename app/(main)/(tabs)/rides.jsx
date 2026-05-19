import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../../src/constants/theme';
import { driverAPI } from '../../../src/api/driver';
import { formatCurrency, formatDistance } from '../../../src/utils/helpers';
import DriverHeader from '../../../src/components/DriverHeader';

export default function DriverRidesScreen() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All'); // 'All' | 'Completed' | 'Cancelled' | 'Today' | 'Week'

  const fetch = async () => {
    try {
      const res = await driverAPI.getRideHistory();
      setRides(res.data.rides?.data || []);
    } catch (e) {}
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);

  const getFilteredRides = () => {
    return rides.filter((ride) => {
      if (filter === 'Completed') return ride.status === 'ride_completed';
      if (filter === 'Cancelled') return ride.status === 'canceled' || ride.status === 'cancelled';
      if (filter === 'Today') {
        const rideDate = new Date(ride.created_at);
        const today = new Date();
        return rideDate.toDateString() === today.toDateString();
      }
      if (filter === 'Week') {
        const rideDate = new Date(ride.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - rideDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      return true; // 'All'
    });
  };

  const renderRide = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.badge, { backgroundColor: item.status === 'ride_completed' ? COLORS.success + '15' : COLORS.error + '15' }]}>
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
    <View style={styles.container}>
      <DriverHeader title="Ride History" />

      {/* Horizontal Filter Chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {['All', 'Completed', 'Cancelled', 'Today', 'Week'].map((item) => {
            const isActive = filter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(item)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {item === 'Week' ? 'This Week' : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={getFilteredRides()}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderRide}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={50} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No matching rides found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filtersWrapper: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#0F0F14',
  },
  filtersScroll: {
    paddingHorizontal: SIZES.padding,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  list: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 30 },
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

