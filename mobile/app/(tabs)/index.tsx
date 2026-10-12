import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
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
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { useCart } from '../../src/context/CartContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { MetricCard } from '../../src/components/MetricCard';
import { Badge } from '../../src/components/Badge';
import { ProductGridCard } from '../../src/components/ProductGridCard';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, isOwner, isLoading: authLoading } = useAuth();
  const { language, t } = useLanguage();
  const { items, addItem, updateQuantity } = useCart();

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading]);

  // Dashboard summary query
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/summary');
      return res.data?.data;
    },
    enabled: !!user,
  });

  // Top products query for homepage showcase
  const { data: topProducts = [] } = useQuery({
    queryKey: ['home-top-products'],
    queryFn: async () => {
      const res = await apiClient.get('/products?active=true&limit=8');
      return res.data?.data || [];
    },
    enabled: !!user,
  });

  if (authLoading || (!data && isLoading)) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t('appName')} subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'te' ? 'సరుకుల సమాచారం లోడ్ అవుతోంది...' : 'Fetching store data...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const overview = data?.overview || {};
  const recentSales = data?.recentSales || [];
  const recentPurchases = data?.recentPurchases || [];

  const getCartQuantity = (productId: string) => {
    const item = items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const categories = [
    {
      id: 'bakery',
      nameEn: 'Bakery',
      nameTe: 'బేకరీ',
      emoji: '🍞',
      bg: '#FDF1E6',
      search: 'biscuit',
    },
    {
      id: 'grains',
      nameEn: 'Grains',
      nameTe: 'ధాన్యాలు',
      emoji: '🍚',
      bg: '#EAF7EE',
      search: 'rice',
    },
    {
      id: 'pulses',
      nameEn: 'Dals',
      nameTe: 'పప్పులు',
      emoji: '🍲',
      bg: '#FEFCE8',
      search: 'dal',
    },
    {
      id: 'drinks',
      nameEn: 'Drinks',
      nameTe: 'పానీయాలు',
      emoji: '🧃',
      bg: '#EBF5FB',
      search: 'tea',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={user?.store?.name || t('storeName')}
        subtitle={`${t('welcome')}, ${user?.name || (isOwner ? 'Owner' : 'Staff')}`}
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
        {/* Promotional Cashback Hero Banner matching Reference Image */}
        <View style={styles.promoBanner}>
          <View style={styles.promoLeft}>
            <View style={styles.promoTag}>
              <Sparkles size={12} color="#D97706" />
              <Text style={styles.promoTagText}>
                {language === 'te' ? 'ప్రత్యేక ఆఫర్' : 'GET FLAT 50% CASHBACK'}
              </Text>
            </View>
            <Text style={styles.promoHeadline}>
              {language === 'te'
                ? 'కిరాణా సరుకులపై 50% క్యాష్‌బ్యాక్'
                : '50% CASHBACK ON GROCERIES'}
            </Text>
            <TouchableOpacity
              style={styles.promoBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/sell')}
            >
              <Text style={styles.promoBtnText}>
                {language === 'te' ? 'ఇప్పుడే అమ్మండి' : 'SELL NOW'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoGraphic}>
            <Text style={styles.promoGraphicEmoji}>🛍️🍉</Text>
            <View style={styles.promoCashbackBadge}>
              <Text style={styles.promoCashbackText}>CASH</Text>
              <Text style={styles.promoCashbackTextBold}>BACK</Text>
            </View>
          </View>
        </View>

        {/* Quick Operational Shortcuts */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/sell')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: '#E0F3EA' }]}>
              <ShoppingCart size={22} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>{t('quickSell')}</Text>
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
                <Text style={styles.actionText}>{t('bulkPurchase')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/product/add')}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: '#E5F3E9' }]}>
                  <PlusCircle size={22} color={Colors.darkForest} />
                </View>
                <Text style={styles.actionText}>{t('addItem')}</Text>
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
            <Text style={styles.actionText}>{t('tabInventory')}</Text>
          </TouchableOpacity>
        </View>

        {/* Categories Section with 4 Pastel Squircles matching Reference Image */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>{t('categories')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/inventory')}>
            <Text style={styles.viewAllText}>{t('exploreAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryCard, { backgroundColor: cat.bg }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(tabs)/inventory')}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={styles.categoryTitle}>
                {language === 'te' ? cat.nameTe : cat.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
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
                {overview.lowStockCount} {t('lowStockAlert')}
              </Text>
              <Text style={styles.alertSubtitle}>
                {t('lowStockAlertSub')}
              </Text>
            </View>
            <ArrowRight size={18} color={Colors.warning} />
          </TouchableOpacity>
        )}

        {/* Top Popular Products Grid matching Reference Screen */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>{t('topProducts')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/sell')}>
            <Text style={styles.viewAllText}>{t('exploreAll')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {topProducts.slice(0, 4).map((product: any, idx: number) => {
            const currentQty = getCartQuantity(product._id);
            return (
              <View key={product._id} style={styles.gridCardWrapper}>
                <ProductGridCard
                  product={product}
                  cardIndex={idx}
                  cartQuantity={currentQty}
                  onIncrement={() => addItem(product, 1)}
                  onDecrement={() => updateQuantity(product._id, currentQty - 1)}
                  onPressCard={() => router.push(`/product/${product._id}`)}
                />
              </View>
            );
          })}
        </View>

        {/* Today's Financial Overview */}
        <Text style={[styles.sectionHeading, { marginTop: Spacing.md }]}>
          {language === 'te' ? 'ఈరోజు వ్యాపార సమాచారం' : "Today's Store Overview"}
        </Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            label={t('todaysSales')}
            value={formatCurrency(overview.todayGrossSales || 0)}
            subtitle={`${t('reseller')}: ${formatCurrency(overview.todayResellerSales || 0)}`}
            bgVariant="mint"
            icon={<TrendingUp size={18} color={Colors.primary} />}
          />

          {isOwner && (
            <MetricCard
              label={t('todaysProfit')}
              value={formatCurrency(overview.todayEstimatedGrossProfit || 0)}
              subtitle="FIFO cost basis"
              bgVariant="cream"
              icon={<TrendingUp size={18} color="#A2591F" />}
            />
          )}
        </View>

        <View style={styles.metricsGrid}>
          {isOwner && (
            <MetricCard
              label={t('inventoryValue')}
              value={formatCurrency(overview.inventoryValuationAtCost || 0)}
              subtitle="Batch Landed Cost"
              bgVariant="white"
              icon={<Package size={18} color={Colors.darkForest} />}
            />
          )}

          <MetricCard
            label={t('totalItems')}
            value={`${overview.totalActiveProducts || 0} Items`}
            subtitle={`${overview.totalInventoryQuantity || 0} in stock`}
            bgVariant="white"
            icon={<Package size={18} color={Colors.secondaryText} />}
          />
        </View>

        {/* Disclaimer for Profit Estimate */}
        {isOwner && (
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ℹ️ {t('disclaimer')}
            </Text>
          </View>
        )}

        {/* Recent Sales Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeading}>{t('recentSales')}</Text>
          <TouchableOpacity onPress={() => router.push('/sales/history')}>
            <Text style={styles.viewAllText}>{t('viewAll')}</Text>
          </TouchableOpacity>
        </View>

        {recentSales.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>
              {language === 'te' ? 'ఈరోజు అమ్మకాలు ఇంకా నమోదు కాలేదు.' : 'No sales recorded today yet.'}
            </Text>
          </Card>
        ) : (
          recentSales.slice(0, 3).map((sale: any) => (
            <Card key={sale._id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View>
                  <Text style={styles.itemTitle}>{sale.saleNumber}</Text>
                  <Text style={styles.itemSubtitle}>{formatDate(sale.createdAt)}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{formatCurrency(sale.total)}</Text>
                  <Badge
                    label={sale.customerType === 'RESELLER' ? t('reseller') : t('retail')}
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
              <Text style={styles.sectionHeading}>{t('recentPurchases')}</Text>
              <TouchableOpacity onPress={() => router.push('/purchase/history')}>
                <Text style={styles.viewAllText}>{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>

            {recentPurchases.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>
                  {language === 'te' ? 'హోల్‌సేల్ కొనుగోళ్లు లేవు.' : 'No bulk purchases on record.'}
                </Text>
              </Card>
            ) : (
              recentPurchases.slice(0, 3).map((pur: any) => (
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
    backgroundColor: Colors.mintBackground,
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
    paddingBottom: 90, // Leave room for floating dock
  },
  promoBanner: {
    backgroundColor: '#D7EBE4',
    borderRadius: 24,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#CCE4DA',
  },
  promoLeft: {
    flex: 1,
    paddingRight: 12,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  promoTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A5306',
    letterSpacing: 0.5,
  },
  promoHeadline: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkForest,
    lineHeight: 22,
    marginBottom: 12,
  },
  promoBtn: {
    backgroundColor: '#FF5E5E',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    shadowColor: '#FF5E5E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  promoBtnText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  promoGraphic: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoGraphicEmoji: {
    fontSize: 46,
  },
  promoCashbackBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    marginTop: -8,
    borderWidth: 1,
    borderColor: '#D4E2DC',
  },
  promoCashbackText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#FF5E5E',
  },
  promoCashbackTextBold: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 8,
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
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  actionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.darkForest,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  viewAllText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: 10,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkForest,
    textAlign: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF7EA',
    borderWidth: 1,
    borderColor: '#F6D99F',
    borderRadius: 16,
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
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  gridCardWrapper: {
    width: '48%',
    marginBottom: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  disclaimerBox: {
    backgroundColor: '#EBF4F0',
    padding: 10,
    borderRadius: 12,
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
    borderRadius: 18,
  },
  emptyCardText: {
    color: Colors.secondaryText,
    fontSize: 13,
  },
  itemCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: 18,
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
