import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Tag,
  Sliders,
  History,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { PriceTag } from '../../src/components/PriceTag';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isOwner } = useAuth();

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

  const { data: priceHistory = [] } = useQuery({
    queryKey: ['product-price-history', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}/price-history`);
      return res.data?.data || [];
    },
    enabled: !!id,
  });

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isLow = product.availableQuantity <= product.lowStockThreshold;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* Basic Information Card */}
        <Card>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.skuText}>
                SKU: {product.sku} {product.brand ? `• ${product.brand}` : ''}
              </Text>
            </View>
            <Badge
              label={product.availableQuantity <= 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
              variant={product.availableQuantity <= 0 ? 'error' : isLow ? 'warning' : 'success'}
            />
          </View>

          {product.description ? (
            <Text style={styles.descriptionText}>{product.description}</Text>
          ) : null}

          <View style={styles.stockSummaryRow}>
            <View style={styles.stockBlock}>
              <Text style={styles.stockLabel}>Available Stock</Text>
              <Text style={styles.stockNumber}>
                {product.availableQuantity} {product.baseUnit}
              </Text>
            </View>
            <View style={styles.stockBlock}>
              <Text style={styles.stockLabel}>Low-Stock Threshold</Text>
              <Text style={styles.thresholdNumber}>
                {product.lowStockThreshold} {product.baseUnit}
              </Text>
            </View>
          </View>
        </Card>

        {/* Dual Selling Prices Card */}
        <Card style={styles.pricingCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeading}>Current Selling Prices</Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => router.push(`/pricing/${product._id}`)}
              >
                <Sliders size={16} color={Colors.primary} />
                <Text style={styles.configBtnText}>Edit Strategy</Text>
              </TouchableOpacity>
            )}
          </View>

          <PriceTag
            resellerPrice={product.resellerPrice}
            retailPrice={product.retailPrice}
            unit={product.baseUnit}
          />

          {isOwner && (
            <View style={styles.pricingPolicyBox}>
              <Text style={styles.policyHeading}>Active Pricing Rule:</Text>
              <Text style={styles.policyText}>
                Method: {product.pricingConfiguration?.method || 'COST_PLUS_MARKUP'}
              </Text>
              {product.pricingConfiguration?.method === 'COST_PLUS_MARKUP' && (
                <Text style={styles.policySubtext}>
                  Reseller Markup: +{product.pricingConfiguration?.resellerMarkupPercent}% • Retail Markup: +{product.pricingConfiguration?.retailMarkupPercent}%
                </Text>
              )}
              {product.pricingConfiguration?.method === 'TARGET_GROSS_MARGIN' && (
                <Text style={styles.policySubtext}>
                  Reseller Margin: {product.pricingConfiguration?.resellerMarginPercent}% • Retail Margin: {product.pricingConfiguration?.retailMarginPercent}%
                </Text>
              )}
            </View>
          )}
        </Card>

        {/* Cost Basis & Landed Cost Breakdown (Owner Only) */}
        {isOwner && (
          <Card>
            <Text style={styles.cardHeading}>Cost Basis & Acquisition (Private)</Text>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Current Unit Cost Basis (Landed):</Text>
              <Text style={styles.costValue}>
                {formatCurrency(product.currentCostBasis)}/{product.baseUnit}
              </Text>
            </View>

            <View style={styles.profitPreviewRow}>
              <View style={styles.profitItem}>
                <Text style={styles.profitLabel}>Reseller Unit Profit</Text>
                <Text style={styles.profitValue}>
                  {formatCurrency(product.resellerPrice - product.currentCostBasis)}
                </Text>
              </View>
              <View style={styles.profitItem}>
                <Text style={styles.profitLabel}>Retail Unit Profit</Text>
                <Text style={styles.profitValue}>
                  {formatCurrency(product.retailPrice - product.currentCostBasis)}
                </Text>
              </View>
            </View>

            <Button
              title="Manual Stock Adjustment"
              variant="outline"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: '/inventory/adjust',
                  params: { productId: product._id, currentStock: product.availableQuantity },
                })
              }
              style={{ marginTop: 12 }}
            />
          </Card>
        )}

        {/* Price History Timeline */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeading}>Price Change History</Text>
            <History size={16} color={Colors.secondaryText} />
          </View>

          {priceHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>No price changes on record.</Text>
          ) : (
            priceHistory.map((h: any) => (
              <View key={h._id} style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <Text style={styles.historyDate}>{formatDate(h.createdAt)}</Text>
                  <Text style={styles.historyUser}>
                    by {h.changedBy?.name || 'Owner'}
                  </Text>
                </View>
                <Text style={styles.historyPrices}>
                  Reseller: ₹{h.oldResellerPrice} ➔ ₹{h.newResellerPrice} | Retail: ₹{h.oldRetailPrice} ➔ ₹{h.newRetailPrice}
                </Text>
                {h.reason ? (
                  <Text style={styles.historyReason}>Reason: "{h.reason}"</Text>
                ) : null}
              </View>
            ))
          )}
        </Card>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.secondaryText,
    fontSize: 14,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  skuText: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 13,
    color: Colors.mainText,
    lineHeight: 18,
    marginVertical: 8,
  },
  stockSummaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.veryLightMint,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  stockBlock: {
    flex: 1,
  },
  stockLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  stockNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
  thresholdNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.secondaryText,
    marginTop: 2,
  },
  pricingCard: {
    backgroundColor: Colors.white,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  pricingPolicyBox: {
    backgroundColor: '#F3FAF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  policyHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  policyText: {
    fontSize: 12,
    color: Colors.mainText,
    marginTop: 2,
  },
  policySubtext: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
  },
  costLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  costValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  profitPreviewRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  profitItem: {
    flex: 1,
    backgroundColor: Colors.veryLightMint,
    padding: 10,
    borderRadius: 10,
  },
  profitLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },
  noHistoryText: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontStyle: 'italic',
  },
  historyItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  historyUser: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  historyPrices: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
    marginTop: 2,
  },
  historyReason: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
