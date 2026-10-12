import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Calculator, Check } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [brand, setBrand] = useState('');
  const [baseUnit, setBaseUnit] = useState('kg');
  const [lowStockThreshold, setLowStockThreshold] = useState('20');
  const [initialCostBasis, setInitialCostBasis] = useState('50');
  const [initialQuantity, setInitialQuantity] = useState('100');

  // Pricing configuration
  const [pricingMethod, setPricingMethod] = useState<'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN' | 'FIXED'>(
    'COST_PLUS_MARKUP'
  );
  const [resellerMarkup, setResellerMarkup] = useState('12');
  const [retailMarkup, setRetailMarkup] = useState('25');
  const [resellerMargin, setResellerMargin] = useState('10');
  const [retailMargin, setRetailMargin] = useState('20');
  const [manualReseller, setManualReseller] = useState('');
  const [manualRetail, setManualRetail] = useState('');

  // Live price calculation preview
  const cost = Number(initialCostBasis) || 0;
  let previewReseller = 0;
  let previewRetail = 0;

  if (pricingMethod === 'COST_PLUS_MARKUP') {
    previewReseller = cost * (1 + (Number(resellerMarkup) || 0) / 100);
    previewRetail = cost * (1 + (Number(retailMarkup) || 0) / 100);
  } else if (pricingMethod === 'TARGET_GROSS_MARGIN') {
    const resDenom = Math.max(0.01, 1 - (Number(resellerMargin) || 0) / 100);
    const retDenom = Math.max(0.01, 1 - (Number(retailMargin) || 0) / 100);
    previewReseller = cost / resDenom;
    previewRetail = cost / retDenom;
  } else {
    previewReseller = Number(manualReseller) || cost;
    previewRetail = Number(manualRetail) || cost * 1.2;
  }

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/products', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert('Success', 'New product added with dual pricing.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create product.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !sku.trim() || !baseUnit.trim()) {
      Alert.alert('Validation Error', 'Product Name, SKU, and Base Unit are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      brand: brand.trim(),
      baseUnit: baseUnit.trim().toLowerCase(),
      lowStockThreshold: Number(lowStockThreshold) || 10,
      initialCostBasis: Number(initialCostBasis) || 0,
      initialQuantity: Number(initialQuantity) || 0,
      pricingConfiguration: {
        method: pricingMethod,
        resellerMarkupPercent: Number(resellerMarkup) || 12,
        retailMarkupPercent: Number(retailMarkup) || 25,
        resellerMarginPercent: Number(resellerMargin) || 10,
        retailMarginPercent: Number(retailMargin) || 20,
      },
      manualResellerPrice: pricingMethod === 'FIXED' ? Number(manualReseller) : undefined,
      manualRetailPrice: pricingMethod === 'FIXED' ? Number(manualRetail) : undefined,
    };

    mutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <Input
            label="Product Name *"
            value={name}
            onChangeText={setName}
            placeholder="e.g. Sona Masoori Rice (Raw)"
          />
          <Input
            label="Unique SKU Code *"
            value={sku}
            onChangeText={setSku}
            placeholder="e.g. RICE-SONA-02"
            autoCapitalize="characters"
          />
          <Input
            label="Brand / Variety (Optional)"
            value={brand}
            onChangeText={setBrand}
            placeholder="e.g. Kurnool Special"
          />
          <View style={styles.unitRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Base Stock Unit *"
                value={baseUnit}
                onChangeText={setBaseUnit}
                placeholder="kg, litre, packet"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Low-Stock Alert Level"
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Initial Stock & Acquisition Cost</Text>
          <View style={styles.unitRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Initial Quantity"
                value={initialQuantity}
                onChangeText={setInitialQuantity}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Cost Basis Per Unit (₹)"
                value={initialCostBasis}
                onChangeText={setInitialCostBasis}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Pricing Strategy Engine */}
        <Card>
          <Text style={styles.sectionTitle}>Dual-Pricing Strategy</Text>
          <View style={styles.methodSelector}>
            {(['COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN', 'FIXED'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.methodBtn,
                  pricingMethod === method && styles.activeMethodBtn,
                ]}
                onPress={() => setPricingMethod(method)}
              >
                <Text
                  style={[
                    styles.methodBtnText,
                    pricingMethod === method && styles.activeMethodBtnText,
                  ]}
                >
                  {method === 'COST_PLUS_MARKUP' && 'Cost-Plus Markup'}
                  {method === 'TARGET_GROSS_MARGIN' && 'Gross Margin %'}
                  {method === 'FIXED' && 'Fixed Price'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {pricingMethod === 'COST_PLUS_MARKUP' && (
            <View style={styles.inputsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Reseller Markup %"
                  value={resellerMarkup}
                  onChangeText={setResellerMarkup}
                  keyboardType="numeric"
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

          {pricingMethod === 'TARGET_GROSS_MARGIN' && (
            <View style={styles.inputsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Reseller Margin %"
                  value={resellerMargin}
                  onChangeText={setResellerMargin}
                  keyboardType="numeric"
                  helper="Must be < 100%"
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

          {pricingMethod === 'FIXED' && (
            <View style={styles.inputsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Fixed Reseller Price (₹)"
                  value={manualReseller}
                  onChangeText={setManualReseller}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Fixed Retail Price (₹)"
                  value={manualRetail}
                  onChangeText={setManualRetail}
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Live Preview Card */}
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <Calculator size={16} color={Colors.primary} />
              <Text style={styles.previewTitle}>Calculated Selling Prices Preview</Text>
            </View>

            <View style={styles.previewValuesRow}>
              <View style={styles.previewCol}>
                <Text style={styles.previewColLabel}>Reseller Price</Text>
                <Text style={styles.previewColVal}>{formatCurrency(previewReseller)}</Text>
                <Text style={styles.previewProfit}>
                  Profit: {formatCurrency(previewReseller - cost)}
                </Text>
              </View>

              <View style={styles.previewDivider} />

              <View style={styles.previewCol}>
                <Text style={styles.previewColLabel}>Retail Price</Text>
                <Text style={styles.previewColVal}>{formatCurrency(previewRetail)}</Text>
                <Text style={styles.previewProfit}>
                  Profit: {formatCurrency(previewRetail - cost)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        <Button
          title="Save Product & Pricing"
          onPress={handleSubmit}
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  unitRow: {
    flexDirection: 'row',
  },
  inputsRow: {
    flexDirection: 'row',
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
  previewBox: {
    backgroundColor: '#EBF4F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#CDE5D6',
  },
  previewHeader: {
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
  previewValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewCol: {
    flex: 1,
    alignItems: 'center',
  },
  previewDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borders,
  },
  previewColLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  previewColVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
  previewProfit: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
});
