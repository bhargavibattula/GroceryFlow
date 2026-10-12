import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Sliders,
  TrendingUp,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useCart } from '../../src/context/CartContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { formatCurrency, formatDate } from '../../src/utils/format';

function getProductEmoji(sku: string, name: string): string {
  const upper = (sku + ' ' + name).toUpperCase();
  if (upper.includes('RICE')) return '🍚';
  if (upper.includes('DAL')) return '🥣';
  if (upper.includes('SUGAR')) return '🍬';
  if (upper.includes('OIL')) return '🌻';
  if (upper.includes('ATTA') || upper.includes('FLOUR') || upper.includes('WHEAT')) return '🌾';
  if (upper.includes('BISCUIT') || upper.includes('PARLE')) return '🍪';
  if (upper.includes('SOAP')) return '🧼';
  if (upper.includes('TEA') || upper.includes('COFFEE')) return '☕';
  return '📦';
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOwner } = useAuth();
  const { language, t } = useLanguage();
  const { items, addItem, updateQuantity, customerType } = useCart();

  const [qty, setQty] = useState(1);

  const {
    data: product,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['related-products', id],
    queryFn: async () => {
      const res = await apiClient.get('/products?active=true&limit=4');
      return (res.data?.data || []).filter((p: any) => p._id !== id);
    },
    enabled: !!id,
  });

  const cartItem = items.find((i) => i.productId === id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'te' ? 'సరుకు వివరాలు లోడ్ అవుతున్నాయి...' : 'Loading product details...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const emoji = getProductEmoji(product.sku, product.name);
  const isOut = product.availableQuantity <= 0;
  const isLow = product.availableQuantity <= product.lowStockThreshold && !isOut;
  const activePrice = customerType === 'RESELLER' ? product.resellerPrice : product.retailPrice;

  const handleAddToCart = () => {
    if (isOut) {
      Alert.alert(t('outOfStock'), 'Item is out of stock.');
      return;
    }
    addItem(product, qty);
    Alert.alert(
      language === 'te' ? 'బుట్టకి చేర్చబడింది' : 'Added to Bill',
      `${qty} ${product.baseUnit} ${product.name} ${language === 'te' ? 'చేర్చబడింది.' : 'added.'}`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Floating Nav */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.circleBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => router.push('/sell/cart')}
        >
          <ShoppingBag size={20} color={Colors.darkForest} />
          {items.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{items.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* Giant Hero Visual Matching 3rd Phone in Reference Image */}
        <View style={styles.heroBackground}>
          <Text style={styles.heroEmoji}>{emoji}</Text>
          <View style={styles.paginationDots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* White Rounded Bottom Card Sheet */}
        <View style={styles.detailsSheet}>
          {/* Header Row: Title & Stepper Pill */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.productTitle}>{product.name}</Text>
              <Text style={styles.productBrand}>
                {product.brand || product.sku} • {product.baseUnit}
              </Text>
            </View>

            {/* Stepper Pill matching the reference */}
            <View style={styles.stepperPill}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQty((prev) => Math.max(1, prev - 1))}
              >
                <Minus size={15} color={Colors.darkForest} />
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => {
                  if (qty + 1 > product.availableQuantity) {
                    Alert.alert(t('availableStock'), `Only ${product.availableQuantity} available.`);
                    return;
                  }
                  setQty((prev) => prev + 1);
                }}
              >
                <Plus size={15} color={Colors.darkForest} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pricing Row */}
          <View style={styles.priceRow}>
            <Text style={styles.mainPrice}>{formatCurrency(activePrice)}</Text>
            <Text style={styles.perUnit}>/{product.baseUnit}</Text>

            <View style={styles.pricingPillBadge}>
              <Text style={styles.pricingPillText}>
                {customerType === 'RESELLER' ? t('reseller') : t('retail')}
              </Text>
            </View>
          </View>

          {/* Dual-Pricing Comparison Badges */}
          <View style={styles.dualPricingCardsRow}>
            <View
              style={[
                styles.pricingCard,
                customerType === 'RESELLER' && styles.activePricingCard,
              ]}
            >
              <Text style={styles.pricingCardLabel}>{t('resellerPrice')}</Text>
              <Text style={styles.pricingCardVal}>{formatCurrency(product.resellerPrice)}</Text>
            </View>

            <View
              style={[
                styles.pricingCard,
                customerType === 'RETAIL' && styles.activePricingCard,
              ]}
            >
              <Text style={styles.pricingCardLabel}>{t('retailPrice')}</Text>
              <Text style={styles.pricingCardVal}>{formatCurrency(product.retailPrice)}</Text>
            </View>
          </View>

          {/* Stock Availability */}
          <View style={styles.stockAvailabilityRow}>
            <View style={styles.stockStatusLeft}>
              <Package size={16} color={Colors.primary} />
              <Text style={styles.stockStatusText}>
                {t('availableStock')}:{' '}
                <Text style={{ fontWeight: '900', color: Colors.darkForest }}>
                  {product.availableQuantity} {product.baseUnit}
                </Text>
              </Text>
            </View>
            <Badge
              label={isOut ? t('outOfStock') : isLow ? t('lowStock') : t('inStock')}
              variant={isOut ? 'error' : isLow ? 'warning' : 'success'}
            />
          </View>

          {/* Product Description */}
          <Text style={styles.sectionTitle}>{language === 'te' ? 'వివరణ' : 'Description'}</Text>
          <Text style={styles.descriptionParagraph}>
            {product.description ||
              (language === 'te'
                ? `తాజా నాణ్యమైన ${product.name}, కిరాణా దుకాణ వినియోగదారుల కోసం ప్రీమియం ప్యాకింగ్‌తో సిద్ధంగా ఉంది.`
                : `Fresh, high quality ${product.name} sourced directly from verified wholesale suppliers.`)}
          </Text>

          {/* Landed Cost & Profitability (Owner View Only) */}
          {isOwner && (
            <View style={styles.ownerCostCard}>
              <View style={styles.ownerHeader}>
                <Sliders size={16} color={Colors.darkForest} />
                <Text style={styles.ownerTitle}>
                  {language === 'te' ? 'ఓనర్ కాస్ట్ & లాభాల విశ్లేషణ' : 'Cost & Margin Breakdown'}
                </Text>
              </View>

              <View style={styles.ownerDataRow}>
                <View>
                  <Text style={styles.ownerLabel}>{t('landedCost')}</Text>
                  <Text style={styles.ownerVal}>
                    {formatCurrency(product.currentLandedCost || product.initialCostBasis || 0)}
                  </Text>
                </View>
                <View>
                  <Text style={styles.ownerLabel}>{t('method')}</Text>
                  <Text style={styles.ownerVal}>
                    {product.pricingConfiguration?.method || 'COST_PLUS'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.editRulesBtn}
                  onPress={() => router.push(`/pricing/${product._id}`)}
                >
                  <Text style={styles.editRulesText}>{t('edit')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Related Items Section matching Reference Screen */}
          {relatedProducts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>
                {language === 'te' ? 'సంబంధిత సరుకులు' : 'Related Items'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedScroll}>
                {relatedProducts.map((rel: any, idx: number) => {
                  const relEmoji = getProductEmoji(rel.sku, rel.name);
                  const tint = Colors.cardTints[(idx + 2) % Colors.cardTints.length];
                  return (
                    <TouchableOpacity
                      key={rel._id}
                      style={[styles.relatedCard, { backgroundColor: tint }]}
                      activeOpacity={0.85}
                      onPress={() => router.push(`/product/${rel._id}`)}
                    >
                      <Text style={styles.relatedEmoji}>{relEmoji}</Text>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.relatedName} numberOfLines={1}>
                          {rel.name}
                        </Text>
                        <Text style={styles.relatedPrice}>
                          {formatCurrency(rel.retailPrice)}
                        </Text>
                      </View>
                      <View style={styles.relatedPlusCircle}>
                        <Plus size={12} color={Colors.darkForest} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Add to Cart Pill Button matching Reference Image */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.floatingActionPill, isOut && styles.disabledActionPill]}
          activeOpacity={0.88}
          disabled={isOut}
          onPress={handleAddToCart}
        >
          <Text style={styles.floatingActionText}>
            {isOut
              ? t('outOfStock')
              : `${t('addToBill')} • ${formatCurrency(activePrice * qty)}`}
          </Text>
          <View style={styles.floatingIconCircle}>
            <ShoppingBag size={18} color={Colors.primary} />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF9E6', // Warm butter yellow background matching 3rd phone in reference
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
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 8,
    zIndex: 10,
  },
  circleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF5757',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 9.5,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroBackground: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  heroEmoji: {
    fontSize: 100,
  },
  paginationDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DCD4BC',
  },
  activeDot: {
    width: 18,
    backgroundColor: Colors.darkForest,
  },
  detailsSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: Spacing.xl,
    paddingTop: 24,
    minHeight: 500,
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  productBrand: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stepperPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F8F5',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  qtyNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkForest,
    minWidth: 20,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
    gap: 6,
  },
  mainPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  perUnit: {
    fontSize: 14,
    color: Colors.secondaryText,
  },
  pricingPillBadge: {
    backgroundColor: '#E4F4EB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
  },
  pricingPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  dualPricingCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pricingCard: {
    flex: 1,
    backgroundColor: '#FAFDFB',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  activePricingCard: {
    borderColor: Colors.primary,
    backgroundColor: '#F1F9F5',
  },
  pricingCardLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '700',
  },
  pricingCardVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkForest,
    marginTop: 2,
  },
  stockAvailabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F4F9F5',
    borderRadius: 16,
    padding: 12,
    marginBottom: 18,
  },
  stockStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockStatusText: {
    fontSize: 13,
    color: Colors.darkForest,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: 8,
  },
  descriptionParagraph: {
    fontSize: 13,
    color: '#65776E',
    lineHeight: 20,
    marginBottom: 18,
  },
  ownerCostCard: {
    backgroundColor: '#FFF8EE',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F6E4CA',
    marginBottom: 18,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  ownerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8A5306',
  },
  ownerDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerLabel: {
    fontSize: 10.5,
    color: '#A26D28',
    fontWeight: '700',
  },
  ownerVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6A3C00',
    marginTop: 2,
  },
  editRulesBtn: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0C8A4',
  },
  editRulesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A5306',
  },
  relatedScroll: {
    marginBottom: 10,
  },
  relatedCard: {
    width: 145,
    borderRadius: 18,
    padding: 10,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  relatedEmoji: {
    fontSize: 26,
  },
  relatedName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  relatedPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
  relatedPlusCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  floatingActionPill: {
    backgroundColor: '#229E74',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  disabledActionPill: {
    backgroundColor: '#A0B2A9',
  },
  floatingActionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  floatingIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
