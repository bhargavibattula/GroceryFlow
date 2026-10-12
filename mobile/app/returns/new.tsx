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
import { RotateCcw, AlertTriangle, Check } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
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
        // By default, assume all returned quantity is restocked unless marked damaged
        copy[index].restockedQty = value;
        copy[index].damagedQty = '0';
      }
      return copy;
    });
  };

  // Calculate live refund total
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
        'Return Processed',
        `Refund of ${formatCurrency(data.data.refundTotal)} recorded and stock restocked.`
      );
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Return Failed', err.message || 'Unable to process return.');
    },
  });

  const handleSubmit = () => {
    const itemsToReturn = returnItems
      .filter((i) => (Number(i.returnedQty) || 0) > 0)
      .map((i) => ({
        productId: i.productId,
        returnedQuantity: Number(i.returnedQty),
        restockedQuantity: Number(i.restockedQty) || 0,
        damagedQuantity: Number(i.damagedQty) || 0,
        reason: i.reason,
      }));

    if (itemsToReturn.length === 0) {
      Alert.alert('No Items Selected', 'Enter a return quantity > 0 for at least one item.');
      return;
    }

    // Validate restocked + damaged = returned
    for (const item of itemsToReturn) {
      if (item.restockedQuantity + item.damagedQuantity !== item.returnedQuantity) {
        Alert.alert(
          'Quantity Mismatch',
          'Restocked quantity + damaged quantity must equal total returned quantity.'
        );
        return;
      }
    }

    mutation.mutate({
      items: itemsToReturn,
      paymentMethod,
      notes: generalNotes.trim(),
    });
  };

  if (isLoading || !sale) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sale for return...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.saleHeader}>Original Sale #{sale.saleNumber}</Text>
          <Text style={styles.customerText}>
            Customer: {sale.customerName} • Type: {sale.customerType}
          </Text>
          <Text style={styles.totalPaidText}>Total Paid: {formatCurrency(sale.total)}</Text>
        </Card>

        {/* Return line items */}
        <Card>
          <Text style={styles.sectionHeading}>Items to Return</Text>

          {returnItems.map((item, idx) => (
            <View key={item.productId} style={styles.itemBox}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                  Bought: {item.originalQty} {item.sellingUnit} @ {formatCurrency(item.unitPrice)}
                </Text>
              </View>

              <View style={styles.inputsRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Return Qty"
                    value={item.returnedQty}
                    onChangeText={(val) => updateItem(idx, 'returnedQty', val)}
                    keyboardType="numeric"
                    helper={`Max: ${item.originalQty}`}
                  />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    label="Restock Qty"
                    value={item.restockedQty}
                    onChangeText={(val) => updateItem(idx, 'restockedQty', val)}
                    keyboardType="numeric"
                    helper="Back to inventory"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Input
                    label="Damaged Qty"
                    value={item.damagedQty}
                    onChangeText={(val) => updateItem(idx, 'damagedQty', val)}
                    keyboardType="numeric"
                    helper="Discard as loss"
                  />
                </View>
              </View>
            </View>
          ))}
        </Card>

        {/* Refund & Notes Card */}
        <Card>
          <Text style={styles.sectionHeading}>Refund Method & Notes</Text>
          <View style={styles.refundMethodRow}>
            {(['CASH', 'UPI'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.refundMethodBtn,
                  paymentMethod === method && styles.activeRefundBtn,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.refundMethodText,
                    paymentMethod === method && styles.activeRefundText,
                  ]}
                >
                  {method === 'CASH' ? '💵 Cash Refund' : '📱 UPI Refund'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Return Reason / Remarks"
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder="e.g. Customer purchased excess quantity"
          />

          <View style={styles.refundTotalBox}>
            <Text style={styles.refundTotalLabel}>Total Refund Due to Customer:</Text>
            <Text style={styles.refundTotalVal}>{formatCurrency(estimatedRefund)}</Text>
          </View>
        </Card>

        <Button
          title={mutation.isPending ? 'Processing...' : `Confirm Return & Refund • ${formatCurrency(estimatedRefund)}`}
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
  saleHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  customerText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  totalPaidText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  itemBox: {
    backgroundColor: Colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  itemRow: {
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  inputsRow: {
    flexDirection: 'row',
  },
  refundMethodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  refundMethodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.veryLightMint,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeRefundBtn: {
    backgroundColor: Colors.darkForest,
  },
  refundMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  activeRefundText: {
    color: Colors.white,
  },
  refundTotalBox: {
    backgroundColor: '#FEF4E5',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  refundTotalLabel: {
    fontSize: 12,
    color: '#8A5306',
    fontWeight: '600',
  },
  refundTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A2591F',
    marginTop: 2,
  },
});
