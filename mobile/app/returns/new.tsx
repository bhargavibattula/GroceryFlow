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
import { RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { formatCurrency } from '../../src/utils/format';

interface ReturnItemState {
  productId: string;
  name: string;
  originalQty: number;
  unitPrice: number;
  sellingUnit: string;
  returnedQty: string;
  restockedQty: string;
  damagedQty: string;
  reason: string;
}

export default function NewReturnScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const { language, t } = useLanguage();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale-details-for-return', saleId],
    queryFn: async () => {
      const res = await apiClient.get(`/sales/${saleId}`);
      return res.data?.data;
    },
    enabled: !!saleId,
  });

  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [generalNotes, setGeneralNotes] = useState('');

  React.useEffect(() => {
    if (sale?.lineItems) {
      setReturnItems(
        sale.lineItems.map((li: any) => ({
          productId: li.productId,
          name: li.productNameSnapshot,
          originalQty: li.quantity,
          unitPrice: li.unitPrice,
          sellingUnit: li.sellingUnit,
          returnedQty: '0',
          restockedQty: '0',
          damagedQty: '0',
          reason: 'Customer Return',
        }))
      );
    }
  }, [sale]);

  const updateItem = (index: number, field: keyof ReturnItemState, value: string) => {
    setReturnItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'returnedQty') {
        copy[index].restockedQty = value;
        copy[index].damagedQty = '0';
      }
      return copy;
    });
  };

  const estimatedRefund = returnItems.reduce((sum, item) => {
    return sum + (Number(item.returnedQty) || 0) * item.unitPrice;
  }, 0);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`/sales/${saleId}/returns`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-history-list'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert(
        language === 'te' ? 'రిటర్న్ విజయవంతమైంది' : 'Return Processed',
        language === 'te'
          ? `${formatCurrency(data.data.refundTotal)} రీఫండ్ నమోదు చేయబడి, సరుకు స్టాక్‌కి తిరిగి చేర్చబడింది.`
          : `Refund of ${formatCurrency(data.data.refundTotal)} recorded and stock restocked.`
      );
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to process return.');
    },
  });

  const handleSubmit = () => {
    const activeReturns = returnItems.filter((i) => Number(i.returnedQty) > 0);
    if (activeReturns.length === 0) {
      Alert.alert(
        language === 'te' ? 'సరుకును ఎంచుకోండి' : 'No Items to Return',
        language === 'te' ? 'కనీసం ఒక సరుకు రిటర్న్ పరిమాణం నమోదు చేయండి.' : 'Enter return quantity for at least one item.'
      );
      return;
    }

    const payload = {
      items: activeReturns.map((i) => ({
        productId: i.productId,
        quantity: Number(i.returnedQty),
        restockQuantity: Number(i.restockedQty) || Number(i.returnedQty),
        damagedQuantity: Number(i.damagedQty) || 0,
        reason: i.reason.trim() || 'Customer Return',
      })),
      refundMethod: paymentMethod,
      notes: generalNotes.trim(),
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
          {language === 'te' ? 'కస్టమర్ రిటర్న్ ప్రాసెస్' : 'Customer Return'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sale Header Card */}
        <Card style={styles.saleHeaderCard}>
          <View style={styles.saleHeaderTop}>
            <View>
              <Text style={styles.saleNumber}>{sale?.saleNumber}</Text>
              <Text style={styles.customerName}>
                {sale?.customerName || 'Walk-in'} • {sale?.customerPhone || ''}
              </Text>
            </View>
            <Badge
              label={sale?.customerType === 'RESELLER' ? t('reseller') : t('retail')}
              variant={sale?.customerType === 'RESELLER' ? 'reseller' : 'retail'}
            />
          </View>
        </Card>

        {/* Return Items List */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'రిటర్న్ చేసే సరుకులు' : 'Select Items to Return'}
          </Text>

          {returnItems.map((item, idx) => (
            <View key={item.productId} style={styles.returnItemBox}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  {formatCurrency(item.unitPrice)}/{item.sellingUnit}
                </Text>
              </View>
              <Text style={styles.originalSoldText}>
                {language === 'te' ? 'బిల్లులోని పరిమాణం' : 'Originally billed'}: {item.originalQty} {item.sellingUnit}
              </Text>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label={language === 'te' ? 'రిటర్న్ పరిమాణం' : 'Return Qty'}
                    value={item.returnedQty}
                    onChangeText={(val) => updateItem(idx, 'returnedQty', val)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label={language === 'te' ? 'స్టాక్‌కి చేర్చే పరిమాణం' : 'Restock Qty'}
                    value={item.restockedQty}
                    onChangeText={(val) => updateItem(idx, 'restockedQty', val)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Input
                label={language === 'te' ? 'రిటర్న్ కారణం' : 'Reason'}
                value={item.reason}
                onChangeText={(val) => updateItem(idx, 'reason', val)}
                placeholder="Wrong item, quality issue..."
              />
            </View>
          ))}
        </Card>

        {/* Refund Method & Notes */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionHeading}>
            {language === 'te' ? 'రీఫండ్ చెల్లింపు విధానం' : 'Refund Method'}
          </Text>

          <View style={styles.methodRow}>
            {(['CASH', 'UPI'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, paymentMethod === m && styles.activeMethodBtn]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.methodText, paymentMethod === m && styles.activeMethodText]}>
                  {m === 'CASH'
                    ? language === 'te'
                      ? '💵 నగదు (Cash)'
                      : '💵 Cash'
                    : language === 'te'
                    ? '📱 యూపీఐ (UPI)'
                    : '📱 UPI'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={language === 'te' ? 'గమనికలు (ఐచ్ఛికం)' : 'Return Notes'}
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder={language === 'te' ? 'ఉదా. కస్టమర్ ఎక్స్‌చేంజ్ తీసుకున్నారు' : 'e.g. Refunded to customer directly'}
          />
        </Card>

        {/* Live Refund Summary */}
        <Card style={[styles.formCard, styles.summaryCard]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              {language === 'te' ? 'మొత్తం రీఫండ్ మొత్తం' : 'Total Refund Amount'}
            </Text>
            <Text style={styles.summaryVal}>{formatCurrency(estimatedRefund)}</Text>
          </View>
        </Card>

        <Button
          title={
            mutation.isPending
              ? language === 'te'
                ? 'నమోదు అవుతోంది...'
                : 'Processing Return...'
              : `${language === 'te' ? 'రిటర్న్ పూర్తి చేయండి' : 'Process Return'} • ${formatCurrency(estimatedRefund)}`
          }
          onPress={handleSubmit}
          loading={mutation.isPending}
          size="lg"
          style={styles.confirmBtn}
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
  saleHeaderCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  saleHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleNumber: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  customerName: {
    fontSize: 12.5,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  formCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  returnItemBox: {
    backgroundColor: '#FAFDFB',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkForest,
    flex: 1,
  },
  itemMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  originalSoldText: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  methodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F3F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  activeMethodBtn: {
    backgroundColor: '#CEE8D8',
    borderColor: Colors.primary,
  },
  methodText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeMethodText: {
    color: Colors.darkForest,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#F3F9F5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  confirmBtn: {
    borderRadius: 20,
    backgroundColor: Colors.primary,
    marginTop: Spacing.xs,
  },
});
