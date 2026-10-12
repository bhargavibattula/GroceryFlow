import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Share2, Printer, PlusCircle, ArrowLeft } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function ReceiptScreen() {
  const router = useRouter();
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const { language, t } = useLanguage();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale-receipt', saleId],
    queryFn: async () => {
      const res = await apiClient.get(`/sales/${saleId}`);
      return res.data?.data;
    },
    enabled: !!saleId,
  });

  const handleShare = async () => {
    if (!sale) return;
    try {
      const text = `${t('appName')} Bill #${sale.saleNumber}\nCustomer: ${sale.customerName}\nTotal: ₹${sale.total.toFixed(2)}\nItems: ${sale.lineItems.length}\nPayment: ${sale.paymentDetails?.method || 'CASH'}`;
      await Share.share({ message: text });
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  const handlePrint = () => {
    Alert.alert(
      t('printReceipt'),
      language === 'te'
        ? `బ్లూటూత్ థర్మల్ ప్రింటర్‌కి కనెక్ట్ అవుతోంది #${sale?.saleNumber}...`
        : `Connecting to Bluetooth POS thermal printer for #${sale?.saleNumber}...`
    );
  };

  if (isLoading || !sale) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {language === 'te' ? 'రసీదు తయారవుతోంది...' : 'Generating receipt...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success Icon */}
        <View style={styles.successHeader}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={36} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>{t('saleConfirmed')}</Text>
          <Text style={styles.saleNumberText}>{sale.saleNumber}</Text>
        </View>

        {/* Receipt Paper Card */}
        <Card style={styles.receiptCard}>
          <View style={styles.storeHeader}>
            <View style={styles.receiptLogoCircle}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.receiptLogoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.storeName}>
              {language === 'te' ? 'భార్గవి కిరాణా & జనరల్ స్టోర్స్' : 'Bhargavi Kirana & General Stores'}
            </Text>
            <Text style={styles.storeSubtitle}>Main Bazaar Road • Phone: +91 98765 43210</Text>
            <Text style={styles.dateTimeText}>{formatDate(sale.createdAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>{t('customerName')}</Text>
              <Text style={styles.metaVal}>{sale.customerName || 'Walk-in'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>{t('pricingMode')}</Text>
              <Badge
                label={sale.customerType === 'RESELLER' ? t('reseller') : t('retail')}
                variant={sale.customerType === 'RESELLER' ? 'reseller' : 'retail'}
              />
            </View>
          </View>

          <View style={styles.dottedDivider} />

          {/* Line Items */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { flex: 2 }]}>
              {language === 'te' ? 'సరుకు' : 'Item'}
            </Text>
            <Text style={[styles.colHeader, { textAlign: 'center', flex: 1 }]}>
              {language === 'te' ? 'పరిమాణం' : 'Qty'}
            </Text>
            <Text style={[styles.colHeader, { textAlign: 'right', flex: 1 }]}>
              {language === 'te' ? 'ధర' : 'Price'}
            </Text>
            <Text style={[styles.colHeader, { textAlign: 'right', flex: 1 }]}>
              {language === 'te' ? 'మొత్తం' : 'Total'}
            </Text>
          </View>

          {sale.lineItems?.map((item: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.itemName, { flex: 2 }]} numberOfLines={2}>
                {item.productNameSnapshot}
              </Text>
              <Text style={[styles.itemText, { textAlign: 'center', flex: 1 }]}>
                {item.quantity} {item.sellingUnit}
              </Text>
              <Text style={[styles.itemText, { textAlign: 'right', flex: 1 }]}>
                ₹{item.unitPrice}
              </Text>
              <Text style={[styles.itemTotal, { textAlign: 'right', flex: 1 }]}>
                {formatCurrency(item.lineTotal)}
              </Text>
            </View>
          ))}

          <View style={styles.dottedDivider} />

          {/* Totals Breakdown */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('subtotal')}</Text>
            <Text style={styles.totalVal}>{formatCurrency(sale.subtotal)}</Text>
          </View>

          {sale.discountTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: Colors.success }]}>{t('discount')}</Text>
              <Text style={[styles.totalVal, { color: Colors.success }]}>
                -{formatCurrency(sale.discountTotal)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>{t('grandTotal')}</Text>
            <Text style={styles.grandVal}>{formatCurrency(sale.total)}</Text>
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethodText}>
              {t('paymentMethod')}: {sale.paymentDetails?.method || 'CASH'} • {sale.paymentStatus}
            </Text>
            {sale.paymentDetails?.upiReference ? (
              <Text style={styles.upiRefText}>
                Ref: {sale.paymentDetails.upiReference}
              </Text>
            ) : null}
          </View>

          <Text style={styles.thankYouText}>{t('thankYou')}</Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <Button
            title={t('shareReceipt')}
            onPress={handleShare}
            variant="outline"
            icon={<Share2 size={16} color={Colors.primary} />}
            style={styles.actionBtn}
          />
          <Button
            title={t('printReceipt')}
            onPress={handlePrint}
            variant="outline"
            icon={<Printer size={16} color={Colors.primary} />}
            style={styles.actionBtn}
          />
        </View>

        <Button
          title={t('newSale')}
          onPress={() => router.replace('/(tabs)/sell')}
          size="lg"
          icon={<PlusCircle size={18} color={Colors.white} />}
          style={styles.newSaleBtn}
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
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  saleNumberText: {
    fontSize: 13,
    color: Colors.secondaryText,
    marginTop: 2,
    fontWeight: '600',
  },
  receiptCard: {
    borderRadius: 24,
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    shadowColor: '#103828',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    marginBottom: Spacing.lg,
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  receiptLogoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: '#D4E8DC',
    marginBottom: 8,
  },
  receiptLogoImage: {
    width: '100%',
    height: '100%',
  },
  storeName: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  storeSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  dateTimeText: {
    fontSize: 11,
    color: '#9EAEA5',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  metaVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
    marginTop: 2,
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0ECE4',
    marginVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  itemText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  itemTotal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 12.5,
    color: Colors.secondaryText,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  grandTotalRow: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EFE9',
  },
  grandLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  grandVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  paymentInfo: {
    backgroundColor: '#F3F9F5',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  upiRefText: {
    fontSize: 10.5,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  thankYouText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 18,
  },
  newSaleBtn: {
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
});
