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
import { ArrowLeft, Sparkles, PlusCircle } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

export default function AddProductScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

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
      Alert.alert(
        language === 'te' ? 'విజయవంతమైంది' : 'Success',
        language === 'te'
          ? 'కొత్త సరుకు డ్యూయల్ ధరలతో విజయవంతంగా చేర్చబడింది.'
          : 'New product added with dual pricing.'
      );
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to create product.');
    },
  });

  const handleSubmit = () => {
    if (!name.trim() || !sku.trim() || !baseUnit.trim()) {
      Alert.alert(
        'Validation Error',
        language === 'te'
          ? 'సరుకు పేరు, SKU మరియు యూనిట్ నమోదు చేయండి.'
          : 'Product Name, SKU, and Base Unit are required.'
      );
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
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'కొత్త సరుకును చేర్చండి' : 'Add New Product'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Core Product Information Card */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'సరుకు ప్రాథమిక వివరాలు' : 'Basic Product Information'}
          </Text>

          <Input
            label={language === 'te' ? 'సరుకు పేరు' : 'Product Name'}
            value={name}
            onChangeText={setName}
            placeholder={language === 'te' ? 'ఉదా. సోనా మసూరి బియ్యం' : 'e.g. Sona Masoori Rice'}
          />

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="SKU Code"
                value={sku}
                onChangeText={setSku}
                placeholder="RICE-SONA-25"
                autoCapitalize="characters"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={language === 'te' ? 'బ్రాండ్' : 'Brand (Optional)'}
                value={brand}
                onChangeText={setBrand}
                placeholder="Heritage"
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label={language === 'te' ? 'యూనిట్' : 'Base Unit'}
                value={baseUnit}
                onChangeText={setBaseUnit}
                placeholder="kg, litre, packet"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={language === 'te' ? 'అలర్ట్ స్థాయి' : 'Alert Level (Min Stock)'}
                value={lowStockThreshold}
                onChangeText={setLowStockThreshold}
                placeholder="20"
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Initial Stock & Cost Basis */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'ప్రారంభ స్టాక్ & కొనుగోలు ధర' : 'Initial Stock & Cost Basis'}
          </Text>

          <View style={styles.twoCol}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label={language === 'te' ? 'ప్రారంభ స్టాక్' : 'Opening Stock Qty'}
                value={initialQuantity}
                onChangeText={setInitialQuantity}
                placeholder="100"
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label={language === 'te' ? 'కొనుగోలు ధర (ల్యాండెడ్ కాస్ట్)' : 'Cost Price / Landed (₹)'}
                value={initialCostBasis}
                onChangeText={setInitialCostBasis}
                placeholder="50"
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Dual-Pricing Strategy Selector */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'డ్యూయల్-ధరల వ్యూహం' : 'Dual-Pricing Strategy'}
          </Text>

          <View style={styles.methodPillRow}>
            {(['COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN', 'FIXED'] as const).map((method) => {
              const labelMap: Record<string, string> = {
                COST_PLUS_MARKUP: language === 'te' ? 'కాస్ట్-ప్లస్' : 'Markup %',
                TARGET_GROSS_MARGIN: language === 'te' ? 'మార్జిన్ %' : 'Margin %',
                FIXED: language === 'te' ? 'ఫిక్స్‌డ్' : 'Fixed',
              };
              return (
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
                      styles.methodText,
                      pricingMethod === method && styles.activeMethodText,
                    ]}
                  >
                    {labelMap[method]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {pricingMethod === 'COST_PLUS_MARKUP' && (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'హోల్‌సేల్ మార్కప్ (%)' : 'Wholesale Markup (%)'}
                  value={resellerMarkup}
                  onChangeText={setResellerMarkup}
                  placeholder="12"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'రిటైల్ మార్కప్ (%)' : 'Retail Markup (%)'}
                  value={retailMarkup}
                  onChangeText={setRetailMarkup}
                  placeholder="25"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {pricingMethod === 'TARGET_GROSS_MARGIN' && (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'హోల్‌సేల్ మార్జిన్ (%)' : 'Wholesale Margin (%)'}
                  value={resellerMargin}
                  onChangeText={setResellerMargin}
                  placeholder="10"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'రిటైల్ మార్జిన్ (%)' : 'Retail Margin (%)'}
                  value={retailMargin}
                  onChangeText={setRetailMargin}
                  placeholder="20"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {pricingMethod === 'FIXED' && (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'హోల్‌సేల్ ధర (₹)' : 'Fixed Wholesale (₹)'}
                  value={manualReseller}
                  onChangeText={setManualReseller}
                  placeholder="55.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'రిటైల్ ధర (₹)' : 'Fixed Retail (₹)'}
                  value={manualRetail}
                  onChangeText={setManualRetail}
                  placeholder="62.50"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Live Preview Pill Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewTitleRow}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.previewTitle}>
                {language === 'te' ? 'లైవ్ ధరల ప్రివ్యూ' : 'Live Dual-Pricing Preview'}
              </Text>
            </View>

            <View style={styles.previewPricesRow}>
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>{t('resellerPrice')}</Text>
                <Text style={styles.previewVal}>
                  {formatCurrency(previewReseller)}
                  <Text style={styles.previewUnit}>/{baseUnit}</Text>
                </Text>
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>{t('retailPrice')}</Text>
                <Text style={styles.previewVal}>
                  {formatCurrency(previewRetail)}
                  <Text style={styles.previewUnit}>/{baseUnit}</Text>
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Submit Button */}
        <Button
          title={
            mutation.isPending
              ? language === 'te'
                ? 'సేవ్ అవుతోంది...'
                : 'Saving Product...'
              : language === 'te'
              ? 'సరుకును నమోదు చేయండి'
              : 'Save & Publish Product'
          }
          onPress={handleSubmit}
          loading={mutation.isPending}
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.mintBackground,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  formCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  twoCol: {
    flexDirection: 'row',
  },
  methodPillRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F8F5',
    borderRadius: 18,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeMethodBtn: {
    backgroundColor: Colors.primary,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeMethodText: {
    color: Colors.white,
    fontWeight: '800',
  },
  previewCard: {
    backgroundColor: '#EAF7EE',
    borderRadius: 18,
    padding: 14,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#C8E8D5',
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.primary,
  },
  previewPricesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  previewBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  previewVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkForest,
    marginTop: 2,
  },
  previewUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  submitBtn: {
    marginTop: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
});
