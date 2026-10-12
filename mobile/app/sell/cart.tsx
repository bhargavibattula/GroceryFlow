import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, Plus, Minus, CreditCard, Banknote, QrCode } from 'lucide-react-native';
import { useCart } from '../../src/context/CartContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';
import { formatCurrency } from '../../src/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const {
    items,
    customerType,
    updateQuantity,
    updateDiscount,
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    grandTotal,
  } = useCart();

  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [upiReference, setUpiReference] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [digitalAmount, setDigitalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Bill', 'Add at least one product before checking out.');
      return;
    }

    // Generate unique idempotency key to prevent accidental double-taps
    const idempotencyKey = `sale_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      setIsSubmitting(true);
      const payload = {
        customerType,
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim(),
        lineItems: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          sellingUnit: i.selectedUnit,
          conversionFactor: i.conversionFactor,
          discount: i.discount || 0,
        })),
        paymentDetails: {
          method: paymentMethod,
          upiReference: upiReference.trim(),
          notes: notes.trim(),
          cashAmount: paymentMethod === 'SPLIT' ? Number(cashAmount || 0) : undefined,
          digitalAmount: paymentMethod === 'SPLIT' ? Number(digitalAmount || 0) : undefined,
        },
        idempotencyKey,
      };

      const res = await apiClient.post('/sales', payload);
      if (res.data?.success) {
        const completedSale = res.data.data;
        clearCart();
        router.replace({
          pathname: '/sell/receipt',
          params: { saleId: completedSale._id },
        });
      }
    } catch (err: any) {
      Alert.alert('Checkout Failed', err.message || 'Unable to record sale.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Type Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>Customer Pricing:</Text>
          <Badge
            label={customerType === 'RESELLER' ? '🏢 Wholesale Reseller' : '🛍️ Retail Customer'}
            variant={customerType === 'RESELLER' ? 'reseller' : 'retail'}
          />
        </View>

        {/* Customer Details */}
        <Card>
          <Text style={styles.cardHeading}>Customer Information</Text>
          <Input
            label="Customer Name"
            value={customerName}
            onChangeText={setCustomerName}
            placeholder="e.g. Balaji Kirana Store"
          />
          <Input
            label="Phone (Optional)"
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="e.g. +91 98480 12345"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Line Items List */}
        <Card>
          <View style={styles.itemsHeader}>
            <Text style={styles.cardHeading}>Items in Bill ({items.length})</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {items.map((item) => {
            const lineSubtotal = item.quantity * item.unitPrice;
            const lineTotal = Math.max(0, lineSubtotal - (item.discount || 0));

            return (
              <View key={item.productId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPriceMeta}>
                    {formatCurrency(item.unitPrice)}/{item.baseUnit}
                  </Text>
                </View>

                {/* Qty Controls */}
                <View style={styles.qtyControlRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus size={14} color={Colors.darkForest} />
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus size={14} color={Colors.darkForest} />
                  </TouchableOpacity>
                </View>

                {/* Line Total */}
                <View style={styles.lineTotalCol}>
                  <Text style={styles.lineTotalAmount}>{formatCurrency(lineTotal)}</Text>
                  <TouchableOpacity
                    onPress={() => removeItem(item.productId)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Payment Method Selector */}
        <Card>
          <Text style={styles.cardHeading}>Payment Method</Text>
          <View style={styles.paymentMethodsRow}>
            {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.paymentMethodBtn,
                  paymentMethod === method && styles.activePaymentMethod,
                ]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text
                  style={[
                    styles.paymentMethodText,
                    paymentMethod === method && styles.activePaymentMethodText,
                  ]}
                >
                  {method === 'CASH' && '💵 '}
                  {method === 'UPI' && '📱 '}
                  {method === 'CARD' && '💳 '}
                  {method === 'SPLIT' && '🔄 '}
                  {method}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {paymentMethod === 'UPI' && (
            <Input
              label="UPI Transaction / UTR Reference"
              value={upiReference}
              onChangeText={setUpiReference}
              placeholder="e.g. UPI/20261012/882194"
            />
          )}

          {paymentMethod === 'SPLIT' && (
            <View style={styles.splitRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Cash Portion (₹)"
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Digital Portion (₹)"
                  value={digitalAmount}
                  onChangeText={setDigitalAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <Input
            label="Order Notes (Optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Delivered by auto rickshaw"
          />
        </Card>

        {/* Financial Summary Breakdown */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.success }]}>Total Discount</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -{formatCurrency(totalDiscount)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Grand Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </Card>

        {/* Submit Bill Button */}
        <Button
          title={isSubmitting ? 'Recording Sale...' : `Complete Sale • ${formatCurrency(grandTotal)}`}
          onPress={handleCheckout}
          loading={isSubmitting}
          size="lg"
          style={styles.checkoutBtn}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearAllText: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  itemPriceMeta: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.veryLightMint,
    borderRadius: 8,
    padding: 2,
    marginHorizontal: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 6,
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
    paddingHorizontal: 8,
  },
  lineTotalCol: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  lineTotalAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  deleteBtn: {
    marginTop: 4,
    padding: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  paymentMethodBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.veryLightMint,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activePaymentMethod: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  activePaymentMethodText: {
    color: Colors.white,
  },
  splitRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    backgroundColor: '#F3FAF5',
    borderColor: '#CDE5D6',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#CDE5D6',
    paddingTop: 8,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  checkoutBtn: {
    marginTop: Spacing.sm,
  },
});
