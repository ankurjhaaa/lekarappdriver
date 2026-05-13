import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../../src/constants/theme';
import { driverAPI } from '../../../src/api/driver';
import { formatCurrency } from '../../../src/utils/helpers';

const { width } = Dimensions.get('window');

export default function EarningsScreen() {
  const [data, setData] = useState({ 
    wallet_balance: 0, 
    today: 0, 
    this_week: 0, 
    total: 0, 
    total_rides: 0, 
    recent_transactions: [] 
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try {
      const res = await driverAPI.getEarnings();
      if (res.data.success) {
        setData({
          wallet_balance: res.data.wallet_balance || 0,
          today: res.data.today || 0,
          this_week: res.data.this_week || 0,
          total: res.data.total || 0,
          total_rides: res.data.total_rides || 0,
          recent_transactions: res.data.recent_transactions || []
        });
      }
    } catch (e) {}
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);

  const renderTransaction = (item) => {
    const isCredit = item.type === 'credit';
    return (
      <View key={item.id} style={styles.txCard}>
        <View style={[styles.txIconBox, { backgroundColor: isCredit ? COLORS.successLight : COLORS.errorLight }]}>
          <Ionicons name={isCredit ? 'arrow-down' : 'arrow-up'} size={20} color={isCredit ? COLORS.success : COLORS.error} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
          <Text style={styles.txDate}>
            {new Date(item.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit', hour12: true
            })}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: isCredit ? COLORS.success : COLORS.text }]}>
          {isCredit ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Wallet & Earnings</Text>
        </View>

        {/* Main Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletTop}>
            <Text style={styles.walletLabel}>Available Balance</Text>
            <Ionicons name="wallet-outline" size={24} color={COLORS.white} style={{ opacity: 0.8 }} />
          </View>
          <Text style={styles.walletAmount}>{formatCurrency(data.wallet_balance)}</Text>
          
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.withdrawBtn} activeOpacity={0.8}>
              <Text style={styles.withdrawText}>Withdraw Funds</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance Insights</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.gridItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Ionicons name="today" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.gridValue}>{formatCurrency(data.today)}</Text>
            <Text style={styles.gridLabel}>Today</Text>
          </View>
          
          <View style={styles.gridItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.infoLight }]}>
              <Ionicons name="calendar" size={20} color={COLORS.info} />
            </View>
            <Text style={styles.gridValue}>{formatCurrency(data.this_week)}</Text>
            <Text style={styles.gridLabel}>This Week</Text>
          </View>
          
          <View style={styles.gridItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="car" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.gridValue}>{data.total_rides}</Text>
            <Text style={styles.gridLabel}>Total Rides</Text>
          </View>
          
          <View style={styles.gridItem}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="trending-up" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.gridValue}>{data.total_rides > 0 ? formatCurrency(data.total / data.total_rides) : '₹0'}</Text>
            <Text style={styles.gridLabel}>Avg/Ride</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.txList}>
          {data.recent_transactions.length > 0 ? (
            data.recent_transactions.map(renderTransaction)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No recent transactions</Text>
            </View>
          )}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SIZES.padding, paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: SIZES.xxl, fontWeight: '800', color: COLORS.text },
  
  walletCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SIZES.padding,
    borderRadius: SIZES.radiusXl,
    padding: 24,
    ...SHADOWS.glow,
  },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { fontSize: SIZES.md, color: COLORS.white, opacity: 0.9, fontWeight: '600' },
  walletAmount: { fontSize: 42, fontWeight: '900', color: COLORS.white, marginTop: 12, marginBottom: 20 },
  walletActions: { flexDirection: 'row', gap: 12 },
  withdrawBtn: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawText: { color: COLORS.primary, fontWeight: '800', fontSize: SIZES.sm },

  sectionHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: SIZES.padding, marginTop: 32, marginBottom: 16 
  },
  sectionTitle: { fontSize: SIZES.lg, fontWeight: '700', color: COLORS.text },
  seeAllText: { fontSize: SIZES.sm, fontWeight: '600', color: COLORS.primary },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIZES.padding, gap: 12 },
  gridItem: {
    width: (width - (SIZES.padding * 2) - 12) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLg,
    padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  gridValue: { fontSize: SIZES.xl, fontWeight: '800', color: COLORS.text },
  gridLabel: { fontSize: SIZES.sm, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },

  txList: { paddingHorizontal: SIZES.padding },
  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    padding: 16, borderRadius: SIZES.radius, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txDesc: { fontSize: SIZES.md, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  txDate: { fontSize: SIZES.xs, color: COLORS.textMuted },
  txAmount: { fontSize: SIZES.md, fontWeight: '800' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: SIZES.md, color: COLORS.textMuted, fontWeight: '500' },
});
