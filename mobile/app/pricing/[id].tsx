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
import { ArrowLeft, Sparkles, Sliders, ShieldCheck } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

export default function PricingConfigScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { language, t } = useLanguage();

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

  const cost = product?.currentCostBasis || product?.initialCostBasis || 0;
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
      Alert.alert(
        language === 'te' ? 'ధరలు నవీకరించబడ్డాయి' : 'Prices Saved',
        language === 'te'
          ? 'నూతన అమ్మకపు ధరలు మరియు ఆడిట్ లాగ్ భద్రపరచబడ్డాయి.'
          : 'Updated selling prices and audit history saved.'
      );
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Update Failed', err.message || 'Unable to update pricing.');
    },
  });

  const handleSave = () => {
    if (!reason.trim()) {
      Alert.alert(
        language === 'te' ? 'కారణం అవసరం' : 'Reason Required',
        language === 'te'
          ? 'ధర మార్పునకు కారణం నమోదు చేయండి (ఉదా. హోల్‌సేల్ మార్కెట్ ధర పెరిగింది).'
          : 'Please enter a brief reason for changing prices.'
      );
      return;
    }

    const payload = {
      method,
      resellerMarkupPercent: Number(resellerMarkup) || 15,
      retailMarkupPercent: Number(retailMarkup) || 28,
      resellerMarginPercent: Number(resellerMargin) || 12,
      retailMarginPercent: Number(retailMargin) || 22,
      manualResellerPrice: method === 'FIXED' ? Number(manualReseller) : undefined,
      manualRetailPrice: method === 'FIXED' ? Number(manualRetail) : undefined,
      reason: reason.trim(),
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
          {language === 'te' ? 'డ్యూయల్-ధరల కాలిక్యులేటర్' : 'Dual-Pricing Rules'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Header Card */}
        <Card style={styles.productBannerCard}>
          <Text style={styles.productName}>{product?.name}</Text>
          <Text style={styles.productSku}>
            SKU: {product?.sku} • {product?.baseUnit}
          </Text>

          <View style={styles.costBox}>
            <Text style={styles.costLabel}>
              {language === 'te' ? 'ప్రస్తుత ల్యాండెడ్ కాస్ట్ (FIFO బ్యాచ్ కాస్ట్):' : 'Current Batch Landed Cost:'}
            </Text>
            <Text style={styles.costAmount}>
              {formatCurrency(cost)}/{product?.baseUnit}
            </Text>
          </View>
        </Card>

        {/* Pricing Strategy Selector */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'లాభాల వ్యూహం ఎంచుకోండి' : 'Pricing Method'}
          </Text>

          <View style={styles.methodPillRow}>
            {(['COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN', 'FIXED'] as const).map((m) => {
              const labelMap: Record<string, string> = {
                COST_PLUS_MARKUP: language === 'te' ? 'మార్కప్ %' : 'Markup %',
                TARGET_GROSS_MARGIN: language === 'te' ? 'మార్జిన్ %' : 'Margin %',
                FIXED: language === 'te' ? 'ఫిక్స్‌డ్ ధర' : 'Fixed Price',
              };
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, method === m && styles.activeMethodBtn]}
                  onPress={() => setMethod(m)}
                >
                  <Text style={[styles.methodText, method === m && styles.activeMethodText]}>
                    {labelMap[m]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {method === 'COST_PLUS_MARKUP' && (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'హోల్‌సేల్ మార్కప్ (%)' : 'Wholesale Markup (%)'}
                  value={resellerMarkup}
                  onChangeText={setResellerMarkup}
                  placeholder="15"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'రిటైల్ మార్కప్ (%)' : 'Retail Markup (%)'}
                  value={retailMarkup}
                  onChangeText={setRetailMarkup}
                  placeholder="28"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {method === 'TARGET_GROSS_MARGIN' && (
            <View style={styles.twoCol}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'హోల్‌సేల్ మార్జిన్ (%)' : 'Wholesale Margin (%)'}
                  value={resellerMargin}
                  onChangeText={setResellerMargin}
                  placeholder="12"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'రిటైల్ మార్జిన్ (%)' : 'Retail Margin (%)'}
                  value={retailMargin}
                  onChangeText={setRetailMargin}
                  placeholder="22"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {method === 'FIXED' && (
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
                  placeholder="65.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          {/* Real-time Dynamic Comparison Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewTitleRow}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.previewTitle}>
                {language === 'te' ? 'సవరించిన ధరల ఫలితం' : 'Calculated Selling Prices'}
              </Text>
            </View>

            <View style={styles.previewBoxesRow}>
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxLabel}>{t('reseller')}</Text>
                <Text style={styles.previewBoxVal}>{formatCurrency(previewReseller)}</Text>
                <Text style={styles.profitNote}>
                  +{formatCurrency(Math.max(0, previewReseller - cost))} {language === 'te' ? 'లాభం' : 'profit'}
                </Text>
              </View>

              <View style={styles.previewBox}>
                <Text style={styles.previewBoxLabel}>{t('retail')}</Text>
                <Text style={styles.previewBoxVal}>{formatCurrency(previewRetail)}</Text>
                <Text style={styles.profitNote}>
                  +{formatCurrency(Math.max(0, previewRetail - cost))} {language === 'te' ? 'లాభం' : 'profit'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Reason for Change / Audit Trail */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'ధర మార్పునకు కారణం (ఆడిట్ లాగ్)' : 'Reason for Adjustment (Audit Log)'}
          </Text>
          <Input
            label={language === 'te' ? 'కారణం' : 'Audit Note'}
            value={reason}
            onChangeText={setReason}
            placeholder={
              language === 'te'
                ? 'ఉదా. రవాణా ఖర్చులు పెరిగాయి, మార్కెట్ రేటు సవరణ'
                : 'e.g. Supplier landed cost revised'
            }
          />
        </Card>

        {/* Save Button */}
        <Button
          title={
            mutation.isPending
              ? language === 'te'
                ? 'సేవ్ అవుతోంది...'
                : 'Saving Pricing...'
              : language === 'te'
              ? 'ధరలను ఖరారు చేయండి'
              : 'Apply New Dual Prices'
          }
          onPress={handleSave}
          loading={mutation.isPending}
          size="lg"
          style={styles.saveBtn}
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
  productBannerCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  productName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  productSku: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  costBox: {
    backgroundColor: '#F3F9F5',
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  costLabel: {
    fontSize: 11.5,
    color: Colors.darkForest,
    fontWeight: '600',
  },
  costAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
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
  twoCol: {
    flexDirection: 'row',
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
  previewBoxesRow: {
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
  previewBoxLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  previewBoxVal: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.darkForest,
    marginTop: 2,
  },
  profitNote: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
});
