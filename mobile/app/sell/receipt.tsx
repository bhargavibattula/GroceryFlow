import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Share,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Share2, Printer, PlusCircle, ArrowLeft } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function ReceiptScreen() {
  const router = useRouter();
  const { saleId } = useLocalSearchParams<{ saleId: string }>();

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
      const text = `FreshStock Receipt #${sale.saleNumber}\nCustomer: ${sale.customerName}\nTotal: ₹${sale.total.toFixed(2)}\nItems: ${sale.lineItems.length}\nPayment: ${sale.paymentDetails?.method || 'CASH'}`;
      await Share.share({ message: text });
    } catch (e: any) {
      Alert.alert('Share Failed', e.message);
    }
  };

  const handlePrint = () => {
    Alert.alert('Print Receipt', `Connecting to Bluetooth POS thermal printer for #${sale?.saleNumber}...`);
  };

  if (isLoading || !sale) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Generating receipt...</Text>
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
            <CheckCircle2 size={40} color={Colors.white} />
          </View>
          <Text style={styles.successTitle}>Sale Confirmed!</Text>
          <Text style={styles.saleNumberText}>{sale.saleNumber}</Text>
        </View>

        {/* Receipt Paper Card */}
        <Card style={styles.receiptCard}>
          <View style={styles.storeHeader}>
            <Text style={styles.storeName}>FreshStock Family Groceries</Text>
            <Text style={styles.storeSubtitle}>Main Bazaar Road • Phone: +91 98765 43210</Text>
            <Text style={styles.dateTimeText}>{formatDate(sale.createdAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <View>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.metaVal}>{sale.customerName || 'Walk-in'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Type</Text>
              <Badge
                label={sale.customerType}
                variant={sale.customerType === 'RESELLER' ? 'reseller' : 'retail'}
              />
            </View>
          </View>

          <View style={styles.dottedDivider} />

          {/* Line Items */}
          <View style={styles.tableHeader}>
            <Text style={[styles.colHeader, { flex: 2 }]}>Item</Text>
            <Text style={[styles.colHeader, { textAlign: 'center', flex: 1 }]}>Qty</Text>
            <Text style={[styles.colHeader, { textAlign: 'right', flex: 1 }]}>Price</Text>
            <Text style={[styles.colHeader, { textAlign: 'right', flex: 1 }]}>Total</Text>
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
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalVal}>{formatCurrency(sale.subtotal)}</Text>
          </View>

          {sale.discountTotal > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: Colors.success }]}>Discounts</Text>
              <Text style={[styles.totalVal, { color: Colors.success }]}>
                -{formatCurrency(sale.discountTotal)}
              </Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>Total Paid</Text>
            <Text style={styles.grandVal}>{formatCurrency(sale.total)}</Text>
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.paymentMethodText}>
              Payment: {sale.paymentDetails?.method || 'CASH'} • Status: {sale.paymentStatus}
            </Text>
            {sale.paymentDetails?.upiReference ? (
              <Text style={styles.upiRefText}>
                Ref: {sale.paymentDetails.upiReference}
              </Text>
            ) : null}
          </View>

          <Text style={styles.thankYouText}>Thank you for shopping with us! 🙏</Text>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <Button
            title="Share Bill"
            onPress={handleShare}
            variant="outline"
            icon={<Share2 size={16} color={Colors.primary} />}
            style={styles.actionBtn}
          />
          <Button
            title="Print"
            onPress={handlePrint}
            variant="outline"
            icon={<Printer size={16} color={Colors.primary} />}
            style={styles.actionBtn}
          />
        </View>

        <Button
          title="Start New Sale"
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
  successHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  saleNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginTop: 2,
  },
  receiptCard: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#D8E4DC',
  },
  storeHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
    textAlign: 'center',
  },
  storeSubtitle: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
    textAlign: 'center',
  },
  dateTimeText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F4F1',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  itemText: {
    fontSize: 12,
    color: Colors.mainText,
  },
  itemTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  totalVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borders,
    paddingTop: 8,
    marginTop: 6,
  },
  grandLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  grandVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  paymentInfo: {
    backgroundColor: Colors.veryLightMint,
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  upiRefText: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  thankYouText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  newSaleBtn: {
    marginTop: Spacing.md,
  },
});
