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
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react-native';
import { useCart } from '../../src/context/CartContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Badge } from '../../src/components/Badge';
import { formatCurrency } from '../../src/utils/format';

export default function CartScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const {
    items,
    customerType,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    grandTotal,
  } = useCart();

  const [customerName, setCustomerName] = useState(
    language === 'te' ? 'కౌంటర్ కస్టమర్' : 'Walk-in Customer'
  );
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [upiReference, setUpiReference] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [digitalAmount, setDigitalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert(
        language === 'te' ? 'బిల్లు ఖాళీగా ఉంది' : 'Empty Bill',
        language === 'te' ? 'కనీసం ఒక సరుకునైనా చేర్చండి.' : 'Add at least one product before checking out.'
      );
      return;
    }

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
      Alert.alert(
        language === 'te' ? 'సేల్ విఫలమైంది' : 'Checkout Failed',
        err.message || 'Unable to record sale.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topNavRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{t('checkoutTitle')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Type Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerLabel}>{t('pricingMode')}:</Text>
          <Badge
            label={
              customerType === 'RESELLER'
                ? `🏢 ${t('reseller')}`
                : `🛍️ ${t('retail')}`
            }
            variant={customerType === 'RESELLER' ? 'reseller' : 'retail'}
          />
        </View>

        {/* Customer Details */}
        <Card style={styles.roundedCard}>
          <Text style={styles.cardHeading}>{t('customerInfo')}</Text>
          <Input
            label={t('customerName')}
            value={customerName}
            onChangeText={setCustomerName}
            placeholder={language === 'te' ? 'ఉదా. రమణ కిరాణా లేదా కస్టమర్ పేరు' : 'e.g. Balaji Stores'}
          />
          <Input
            label={t('customerPhone')}
            value={customerPhone}
            onChangeText={setCustomerPhone}
            placeholder="e.g. +91 98480 12345"
            keyboardType="phone-pad"
          />
        </Card>

        {/* Line Items List */}
        <Card style={styles.roundedCard}>
          <View style={styles.itemsHeader}>
            <Text style={styles.cardHeading}>
              {language === 'te' ? 'బిల్లులోని సరుకులు' : 'Items in Bill'} ({items.length})
            </Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearAllText}>{t('clearAll')}</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, idx) => {
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
        <Card style={styles.roundedCard}>
          <Text style={styles.cardHeading}>{t('paymentMethod')}</Text>
          <View style={styles.paymentMethodsRow}>
            {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map((method) => {
              const labelMap: Record<string, string> = {
                CASH: language === 'te' ? '💵 నగదు' : '💵 Cash',
                UPI: language === 'te' ? '📱 UPI' : '📱 UPI',
                CARD: language === 'te' ? '💳 కార్డు' : '💳 Card',
                SPLIT: language === 'te' ? '🔄 స్ప్లిట్' : '🔄 Split',
              };
              return (
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
                    {labelMap[method]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {paymentMethod === 'UPI' && (
            <Input
              label={language === 'te' ? 'UPI లావాదేవీ నంబర్ (UTR)' : 'UPI Transaction / UTR Reference'}
              value={upiReference}
              onChangeText={setUpiReference}
              placeholder="e.g. UPI/20261012/882194"
            />
          )}

          {paymentMethod === 'SPLIT' && (
            <View style={styles.splitRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label={language === 'te' ? 'నగదు భాగం (₹)' : 'Cash Portion (₹)'}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={language === 'te' ? 'డిజిటల్ భాగం (₹)' : 'Digital Portion (₹)'}
                  value={digitalAmount}
                  onChangeText={setDigitalAmount}
                  placeholder="0.00"
                  keyboardType="numeric"
                />
              </View>
            </View>
          )}

          <Input
            label={language === 'te' ? 'గమనికలు (ఐచ్ఛికం)' : 'Order Notes (Optional)'}
            value={notes}
            onChangeText={setNotes}
            placeholder={language === 'te' ? 'ఉదా. ఆటోలో పంపబడింది' : 'e.g. Delivered by auto rickshaw'}
          />
        </Card>

        {/* Financial Summary Breakdown */}
        <Card style={[styles.roundedCard, styles.summaryCard]}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>

          {totalDiscount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: Colors.success }]}>{t('discount')}</Text>
              <Text style={[styles.summaryValue, { color: Colors.success }]}>
                -{formatCurrency(totalDiscount)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>{t('grandTotal')}</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </Card>

        {/* Submit Bill Button */}
        <Button
          title={
            isSubmitting
              ? language === 'te'
                ? 'సేల్ నమోదు అవుతోంది...'
                : 'Recording Sale...'
              : `${t('completeSale')} • ${formatCurrency(grandTotal)}`
          }
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
    backgroundColor: Colors.mintBackground,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.mintBackground,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.darkForest,
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
    borderRadius: 20,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  bannerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  roundedCard: {
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
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
    fontWeight: '700',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F5F2',
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  itemPriceMeta: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F8F5',
    borderRadius: 16,
    padding: 3,
    gap: 6,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.darkForest,
    minWidth: 22,
    textAlign: 'center',
  },
  lineTotalCol: {
    alignItems: 'flex-end',
    flex: 1,
  },
  lineTotalAmount: {
    fontSize: 13.5,
    fontWeight: '800',
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
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: '#F3F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E6EFE9',
  },
  activePaymentMethod: {
    backgroundColor: '#CEE8D8',
    borderColor: Colors.primary,
  },
  paymentMethodText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activePaymentMethodText: {
    color: Colors.darkForest,
    fontWeight: '800',
  },
  splitRow: {
    flexDirection: 'row',
  },
  summaryCard: {
    backgroundColor: '#F3F9F5',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#DCE8E1',
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  checkoutBtn: {
    marginTop: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
});
