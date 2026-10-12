import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  ShoppingCart,
  PlusCircle,
  Truck,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { MetricCard } from '../../src/components/MetricCard';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isOwner, isLoading: authLoading } = useAuth();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data?.data;
    },
    enabled: !!user,
  });

  if (authLoading || (!data && isLoading)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title="FreshStock" subtitle="Loading metrics..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Fetching store data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const overview = data?.overview || {};
  const recentSales = data?.recentSales || [];
  const recentPurchases = data?.recentPurchases || [];
  const lowStockProducts = data?.lowStockProducts || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={user?.store?.name || 'FreshStock Groceries'}
        subtitle={`Welcome, ${user?.name || 'User'}`}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Quick Action Shortcuts */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/sell')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E0F3EA' }]}>
              <ShoppingCart size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Quick Sell</Text>
          </TouchableOpacity>

          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/purchase/record')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#F8EEDE' }]}>
                  <Truck size={22} color="#A2591F" />
                </View>
                <Text style={styles.actionText}>Bulk Buy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/product/add')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#E5F3E9' }]}>
                  <PlusCircle size={22} color={Colors.darkForest} />
                </View>
                <Text style={styles.actionText}>Add Item</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/inventory')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#ECEFEA' }]}>
              <Package size={22} color={Colors.secondaryText} />
            </View>
            <Text style={styles.actionText}>Inventory</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock Urgent Warning Banner */}
        {overview.lowStockCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/inventory')}
            style={styles.alertBanner}
          >
            <AlertTriangle size={20} color={Colors.warning} />
            <View style={styles.alertTextWrap}>
              <Text style={styles.alertTitle}>
                {overview.lowStockCount} Products Running Low
              </Text>
              <Text style={styles.alertSubtitle}>
                Tap to view stock alerts and plan supplier orders
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}

        {/* Financial & Operational KPI Cards */}
        <Text style={styles.sectionHeading}>Today's Overview</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Today's Sales"
            value={formatCurrency(overview.todayGrossSales || 0)}
            subtitle={`Reseller: ${formatCurrency(overview.todayResellerSales || 0)}`}
            bgVariant="mint"
            icon={<TrendingUp size={18} color={Colors.primary} />}
          />

          {isOwner && (
            <MetricCard
              label="Est. Gross Profit"
              value={formatCurrency(overview.todayEstimatedGrossProfit || 0)}
              subtitle="FIFO cost deducted"
              bgVariant="cream"
              icon={<TrendingUp size={18} color="#A2591F" />}
            />
          )}
        </View>

        <View style={styles.metricsGrid}>
          {isOwner && (
            <MetricCard
              label="Inventory Value"
              value={formatCurrency(overview.inventoryValuationAtCost || 0)}
              subtitle="At batch landed cost"
              bgVariant="white"
              icon={<Package size={18} color={Colors.darkForest} />}
            />
          )}

          <MetricCard
            label="Total Products"
            value={`${overview.totalActiveProducts || 0} Items`}
            subtitle={`${overview.totalInventoryQuantity || 0} base units in shop`}
            bgVariant="white"
            icon={<Package size={18} color={Colors.secondaryText} />}
          />
        </View>

        {/* Disclaimer for Profit Estimate */}
        {isOwner && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ℹ️ {data?.disclaimer}
            </Text>
          </View>
        )}

        {/* Recent Sales Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>Recent Sales</Text>
          <TouchableOpacity onPress={() => router.push('/sales/history')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>No sales recorded today yet.</Text>
          </Card>
        ) : (
          recentSales.map((sale: any) => (
            <Card key={sale._id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>{sale.saleNumber}</Text>
                  <Text style={styles.itemSubtitle}>{formatDate(sale.createdAt)}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{formatCurrency(sale.total)}</Text>
                  <Badge
                    label={sale.customerType}
                    variant={sale.customerType === 'RESELLER' ? 'reseller' : 'retail'}
                  />
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Recent Purchases (Owner Only) */}
        {isOwner && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeading}>Recent Bulk Purchases</Text>
              <TouchableOpacity onPress={() => router.push('/purchase/history')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentPurchases.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>No bulk purchases on record.</Text>
              </Card>
            ) : (
              recentPurchases.map((pur: any) => (
                <Card key={pur._id} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    <View>
                      <Text style={styles.itemTitle}>{pur.invoiceNumber}</Text>
                      <Text style={styles.itemSubtitle}>
                        {pur.supplierNameSnapshot || 'Direct Supplier'} • {formatDate(pur.purchasedAt)}
                      </Text>
                    </View>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemAmount}>{formatCurrency(pur.grandTotal)}</Text>
                      <Badge label={pur.paymentStatus || 'PAID'} variant="success" />
                    </View>
                  </View>
                </Card>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.secondaryText,
    fontSize: 14,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    alignItems: 'center',
    flex: 1,
  },
  actionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7EA',
    borderWidth: 1,
    borderColor: '#F6D99F',
    borderRadius: 14,
    padding: 12,
    marginBottom: Spacing.lg,
  },
  alertTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A5306',
  },
  alertSubtitle: {
    fontSize: 11,
    color: '#B07521',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  disclaimerBox: {
    backgroundColor: '#EBF4F0',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.secondaryText,
    lineHeight: 16,
  },
  emptyCard: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  emptyCardText: {
    color: Colors.secondaryText,
    fontSize: 13,
  },
  itemCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  itemSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
});
