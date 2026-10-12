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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Truck, Check } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { formatCurrency } from '../../src/utils/format';

interface PurchaseLine {
  productId: string;
  productName: string;
  quantity: string;
  purchaseUnit: string;
  conversionFactor: string;
  unitPurchaseCost: string;
  lineDiscount: string;
}

export default function RecordPurchaseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [supplierId, setSupplierId] = useState('');
  const [transportation, setTransportation] = useState('500');
  const [loadingCost, setLoadingCost] = useState('150');
  const [notes, setNotes] = useState('');
  const [updatePrices, setUpdatePrices] = useState(false);

  // Fetch available products and suppliers
  const { data: products = [] } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await apiClient.get('/products?active=true');
      return res.data?.data || [];
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await apiClient.get('/suppliers');
      return res.data?.data || [];
    },
  });

  const [lines, setLines] = useState<PurchaseLine[]>([]);

  // Add line item when product list is loaded
  React.useEffect(() => {
    if (products.length > 0 && lines.length === 0) {
      setLines([
        {
          productId: products[0]._id,
          productName: products[0].name,
          quantity: '10',
          purchaseUnit: '50kg Bag',
          conversionFactor: '50',
          unitPurchaseCost: '2200',
          lineDiscount: '0',
        },
      ]);
    }
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0]._id);
    }
  }, [products, suppliers]);

  const addLine = () => {
    if (products.length === 0) return;
    setLines((prev) => [
      ...prev,
      {
        productId: products[0]._id,
        productName: products[0].name,
        quantity: '5',
        purchaseUnit: 'Bag',
        conversionFactor: '25',
        unitPurchaseCost: '1000',
        lineDiscount: '0',
      },
    ]);
  };

  const updateLine = (index: number, field: keyof PurchaseLine, value: string) => {
    setLines((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      if (field === 'productId') {
        const prod = products.find((p: any) => p._id === value);
        if (prod) copy[index].productName = prod.name;
      }
      return copy;
    });
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) {
      Alert.alert('Required', 'A purchase must have at least one line item.');
      return;
    }
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Live expense allocation calculation
  const subtotal = lines.reduce((sum, l) => {
    return sum + (Number(l.quantity) || 0) * (Number(l.unitPurchaseCost) || 0);
  }, 0);

  const totalDiscount = lines.reduce((sum, l) => sum + (Number(l.lineDiscount) || 0), 0);
  const additionalExpenses = (Number(transportation) || 0) + (Number(loadingCost) || 0);
  const grandTotal = Math.max(0, subtotal - totalDiscount + additionalExpenses);

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/purchases', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['purchases-list'] });
      Alert.alert('Purchase Recorded', 'Stock increased and landed batch costs recorded.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Failed to record purchase.');
    },
  });

  const handleSubmit = () => {
    if (!invoiceNumber.trim() || lines.length === 0) {
      Alert.alert('Validation Error', 'Invoice number and product lines are required.');
      return;
    }

    const payload = {
      supplierId: supplierId || undefined,
      invoiceNumber: invoiceNumber.trim(),
      lineItems: lines.map((l) => ({
        productId: l.productId,
        quantity: Number(l.quantity) || 1,
        purchaseUnit: l.purchaseUnit.trim() || 'Unit',
        conversionFactor: Number(l.conversionFactor) || 1,
        unitPurchaseCost: Number(l.unitPurchaseCost) || 0,
        lineDiscount: Number(l.lineDiscount) || 0,
      })),
      additionalCosts: {
        transportation: Number(transportation) || 0,
        loading: Number(loadingCost) || 0,
        notes: 'Recorded via FreshStock Mobile',
      },
      updateProductPrices: updatePrices,
      notes: notes.trim(),
    };

    mutation.mutate(payload);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Invoice & Supplier Header */}
        <Card>
          <Text style={styles.sectionHeading}>Purchase & Supplier Details</Text>
          <Input
            label="Invoice / Bill Reference Number *"
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder="e.g. INV-2026-0042"
          />

          <Text style={styles.inputLabel}>Select Supplier</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.supplierScroll}>
            {suppliers.map((s: any) => (
              <TouchableOpacity
                key={s._id}
                style={[
                  styles.supplierChip,
                  supplierId === s._id && styles.activeSupplierChip,
                ]}
                onPress={() => setSupplierId(s._id)}
              >
                <Text
                  style={[
                    styles.supplierChipText,
                    supplierId === s._id && styles.activeSupplierChipText,
                  ]}
                >
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        {/* Line Items */}
        <Card>
          <View style={styles.linesHeader}>
            <Text style={styles.sectionHeading}>Purchased Products ({lines.length})</Text>
            <TouchableOpacity onPress={addLine} style={styles.addLineBtn}>
              <Plus size={16} color={Colors.primary} />
              <Text style={styles.addLineText}>Add Line</Text>
            </TouchableOpacity>
          </View>

          {lines.map((line, idx) => {
            const lineSub = (Number(line.quantity) || 0) * (Number(line.unitPurchaseCost) || 0);
            const totalBaseQty = (Number(line.quantity) || 0) * (Number(line.conversionFactor) || 1);
            // Proportional expense preview
            const lineProp = subtotal > 0 ? lineSub / subtotal : 0;
            const allocatedExp = additionalExpenses * lineProp;
            const landedCostPerBase =
              totalBaseQty > 0 ? (lineSub + allocatedExp) / totalBaseQty : 0;

            return (
              <View key={idx} style={styles.lineCard}>
                <View style={styles.lineTop}>
                  <Text style={styles.lineIndex}>Line #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeLine(idx)}>
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>

                {/* Product Selector */}
                <Text style={styles.inputLabel}>Product</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productSelectScroll}>
                  {products.map((p: any) => (
                    <TouchableOpacity
                      key={p._id}
                      style={[
                        styles.productChip,
                        line.productId === p._id && styles.activeProductChip,
                      ]}
                      onPress={() => updateLine(idx, 'productId', p._id)}
                    >
                      <Text
                        style={[
                          styles.productChipText,
                          line.productId === p._id && styles.activeProductChipText,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Input
                      label="Qty Purchased"
                      value={line.quantity}
                      onChangeText={(val) => updateLine(idx, 'quantity', val)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Purchase Unit"
                      value={line.purchaseUnit}
                      onChangeText={(val) => updateLine(idx, 'purchaseUnit', val)}
                      placeholder="e.g. 50kg Bag"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Input
                      label="Units per Pack (Conv.)"
                      value={line.conversionFactor}
                      onChangeText={(val) => updateLine(idx, 'conversionFactor', val)}
                      keyboardType="numeric"
                      helper={`Total: ${totalBaseQty} base units`}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Price Per Unit (₹)"
                      value={line.unitPurchaseCost}
                      onChangeText={(val) => updateLine(idx, 'unitPurchaseCost', val)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Landed cost preview badge */}
                <View style={styles.landedPreviewBox}>
                  <Text style={styles.landedPreviewText}>
                    Est. Landed Cost: {formatCurrency(landedCostPerBase)}/base unit (includes allocated transport)
                  </Text>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Transportation & Shared Expenses */}
        <Card>
          <View style={styles.cardHeader}>
            <Truck size={18} color={Colors.primary} />
            <Text style={[styles.sectionHeading, { marginBottom: 0, marginLeft: 8 }]}>
              Additional Transport & Loading
            </Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Allocated proportionally across line items to compute true landed cost
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Transportation / Freight (₹)"
                value={transportation}
                onChangeText={setTransportation}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Loading / Labor (₹)"
                value={loadingCost}
                onChangeText={setLoadingCost}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        {/* Cost Summary Breakdown */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Line Items Subtotal</Text>
            <Text style={styles.summaryVal}>{formatCurrency(subtotal)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Freight & Expenses</Text>
            <Text style={styles.summaryVal}>+{formatCurrency(additionalExpenses)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.grandTotalRow]}>
            <Text style={styles.grandLabel}>Net Acquisition Cost</Text>
            <Text style={styles.grandVal}>{formatCurrency(grandTotal)}</Text>
          </View>
        </Card>

        <Button
          title={mutation.isPending ? 'Recording Purchase...' : 'Confirm Bulk Purchase'}
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
    marginBottom: 6,
  },
  supplierScroll: {
    marginBottom: Spacing.md,
  },
  supplierChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.veryLightMint,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeSupplierChip: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  supplierChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  activeSupplierChipText: {
    color: Colors.white,
  },
  linesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  addLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addLineText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  lineCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  lineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineIndex: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  productSelectScroll: {
    marginBottom: 10,
  },
  productChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.white,
    marginRight: 6,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeProductChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  productChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  activeProductChipText: {
    color: Colors.white,
  },
  row: {
    flexDirection: 'row',
  },
  landedPreviewBox: {
    backgroundColor: '#EAF5EE',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  landedPreviewText: {
    fontSize: 11,
    color: Colors.darkForest,
    fontWeight: '600',
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
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#CDE5D6',
    paddingTop: 8,
    marginTop: 4,
  },
  grandLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  grandVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
});
