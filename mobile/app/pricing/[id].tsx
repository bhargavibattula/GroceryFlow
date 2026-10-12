import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

export default function PricingConfigScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-pricing-config', id],
    queryFn: async () => {
      const res = await apiClient.get(`/products/${id}`);
      return res.data?.data;
    },
    enabled: !!id,
  });

  const [method, setMethod] = useState<'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN' | 'FIXED'>(
    'COST_PLUS_MARKUP'
  );
  const [resellerMarkup, setResellerMarkup] = useState('15');
  const [retailMarkup, setRetailMarkup] = useState('28');
  const [resellerMargin, setResellerMargin] = useState('12');
  const [retailMargin, setRetailMargin] = useState('22');
  const [manualReseller, setManualReseller] = useState('');
  const [manualRetail, setManualRetail] = useState('');
  const [reason, setReason] = useState('');

  // Initialize state once product is loaded
  React.useEffect(() => {
    if (product) {
      const cfg = product.pricingConfiguration || {};
      setMethod(cfg.method || 'COST_PLUS_MARKUP');
      setResellerMarkup(String(cfg.resellerMarkupPercent ?? 15));
      setRetailMarkup(String(cfg.retailMarkupPercent ?? 28));
      setResellerMargin(String(cfg.resellerMarginPercent ?? 12));
      setRetailMargin(String(cfg.retailMarginPercent ?? 22));
      setManualReseller(String(product.resellerPrice ?? ''));
      setManualRetail(String(product.retailPrice ?? ''));
    }
  }, [product]);

  const cost = product?.currentCostBasis || 0;
  let previewReseller = 0;
  let previewRetail = 0;

  if (method === 'COST_PLUS_MARKUP') {
    previewReseller = cost * (1 + (Number(resellerMarkup) || 0) / 100);
    previewRetail = cost * (1 + (Number(retailMarkup) || 0) / 100);
  } else if (method === 'TARGET_GROSS_MARGIN') {
    const resDenom = Math.max(0.01, 1 - (Number(resellerMargin) || 0) / 100);
    const retDenom = Math.max(0.01, 1 - (Number(retailMargin) || 0) / 100);
    previewReseller = cost / resDenom;
    previewRetail = cost / retDenom;
  } else {
    previewReseller = Number(manualReseller) || product?.resellerPrice || 0;
    previewRetail = Number(manualRetail) || product?.retailPrice || 0;
  }

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/products/${id}/pricing`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-details', id] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['product-price-history', id] });
      Alert.alert('Prices Saved', 'Updated selling prices and price history entry logged.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Update Failed', err.message || 'Unable to update pricing.');
    },
  });

  const handleSave = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please enter a brief reason for changing prices (e.g. supplier price change).');
      return;
    }

    const payload = {
      method,
      resellerMarkupPercent: Number(resellerMarkup) || 0,
      retailMarkupPercent: Number(retailMarkup) || 0,
      resellerMarginPercent: Number(resellerMargin) || 0,
      retailMarginPercent: Number(retailMargin) || 0,
      manualResellerPrice: method === 'FIXED' ? Number(manualReseller) : undefined,
      manualRetailPrice: method === 'FIXED' ? Number(manualRetail) : undefined,
      reason: reason.trim(),
    };

    mutation.mutate(payload);
  };

  if (isLoading || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pricing engine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.costBasisText}>
            Landed Cost Basis: {formatCurrency(cost)}/{product.baseUnit}
          </Text>
          <Text style={styles.currentPricesText}>
            Current: Reseller {formatCurrency(product.resellerPrice)} • Retail {formatCurrency(product.retailPrice)}
          </Text>
        </Card>

        {/* Pricing Method Selector */}
        <Card>
          <Text style={styles.sectionHeading}>Pricing Calculation Method</Text>
          <View style={styles.methodSelector}>
            {(['COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN', 'FIXED'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, method === m && styles.activeMethodBtn]}
                onPress={() => setMethod(m)}
              >
                <Text style={[styles.methodBtnText, method === m && styles.activeMethodBtnText]}>
                  {m === 'COST_PLUS_MARKUP' && 'Cost-Plus Markup'}
                  {m === 'TARGET_GROSS_MARGIN' && 'Gross Margin %'}
                  {m === 'FIXED' && 'Fixed Price'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {method === 'COST_PLUS_MARKUP' && (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Reseller Markup %"
                  value={resellerMarkup}
                  onChangeText={setResellerMarkup}
                  keyboardType="numeric"
                  helper="Price = Cost × (1 + M%)"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Retail Markup %"
                  value={retailMarkup}
                  onChangeText={setRetailMarkup}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {method === 'TARGET_GROSS_MARGIN' && (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Reseller Margin %"
                  value={resellerMargin}
                  onChangeText={setResellerMargin}
                  keyboardType="numeric"
                  helper="Price = Cost / (1 - M%)"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Retail Margin %"
                  value={retailMargin}
                  onChangeText={setRetailMargin}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {method === 'FIXED' && (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Manual Reseller Price (₹)"
                  value={manualReseller}
                  onChangeText={setManualReseller}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Manual Retail Price (₹)"
                  value={manualRetail}
                  onChangeText={setManualRetail}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Live Preview */}
          <View style={styles.previewBox}>
            <View style={styles.previewTop}>
              <Calculator size={16} color={Colors.primary} />
              <Text style={styles.previewTitle}>Proposed New Selling Prices</Text>
            </View>

            <View style={styles.previewRow}>
              <View style={styles.previewCol}>
                <Text style={styles.colLabel}>New Reseller Price</Text>
                <Text style={styles.colVal}>{formatCurrency(previewReseller)}</Text>
                <Text style={styles.profitLabel}>
                  Profit: {formatCurrency(previewReseller - cost)}
                </Text>
              </View>

              <View style={styles.colDivider} />

              <View style={styles.previewCol}>
                <Text style={styles.colLabel}>New Retail Price</Text>
                <Text style={styles.colVal}>{formatCurrency(previewRetail)}</Text>
                <Text style={styles.profitLabel}>
                  Profit: {formatCurrency(previewRetail - cost)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Change Reason & Confirmation */}
        <Card>
          <Text style={styles.sectionHeading}>Audit Documentation</Text>
          <Input
            label="Reason for Price Change *"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. APMC grain wholesale rate increase"
          />
        </Card>

        <Button
          title="Apply & Save Price Change"
          onPress={handleSave}
          loading={mutation.isPending}
          size="lg"
          style={{ marginTop: Spacing.sm }}
        />
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
  productName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  costBasisText: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  currentPricesText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkForest,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.veryLightMint,
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeMethodBtn: {
    backgroundColor: Colors.darkForest,
  },
  methodBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeMethodBtnText: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
  },
  previewBox: {
    backgroundColor: '#EBF4F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CDE5D6',
  },
  previewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borders,
  },
  colLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  colVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
  profitLabel: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
});
