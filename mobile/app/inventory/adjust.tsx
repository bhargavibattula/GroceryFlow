import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';

export default function StockAdjustScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { productId, currentStock } = useLocalSearchParams<{
    productId: string;
    currentStock: string;
  }>();

  const [newQuantity, setNewQuantity] = useState(currentStock || '0');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/inventory/adjustments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-details', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      Alert.alert('Stock Adjusted', 'Inventory balance updated and audit movement logged.');
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Adjustment Failed', err.message || 'Unable to adjust stock.');
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'A mandatory reason is required for manual stock adjustments.');
      return;
    }

    mutation.mutate({
      productId,
      newQuantity: Number(newQuantity),
      reason: reason.trim(),
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card>
          <Text style={styles.title}>Manual Stock Adjustment</Text>
          <Text style={styles.subtitle}>
            Adjust available quantity and document the adjustment in the audit log.
          </Text>

          <View style={styles.currentStockBox}>
            <Text style={styles.currentLabel}>Current Recorded Stock:</Text>
            <Text style={styles.currentVal}>{currentStock || 0} units</Text>
          </View>

          <Input
            label="Correct Physical Count Quantity *"
            value={newQuantity}
            onChangeText={setNewQuantity}
            keyboardType="numeric"
          />

          <Input
            label="Mandatory Reason for Adjustment *"
            value={reason}
            onChangeText={setReason}
            placeholder="e.g. Month-end physical count discrepancy / shelf spillage"
            helper="Required by store policy for audit tracking"
          />
        </Card>

        <Button
          title="Save Adjustment"
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
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  currentStockBox: {
    backgroundColor: Colors.veryLightMint,
    padding: 12,
    borderRadius: 10,
    marginBottom: Spacing.md,
  },
  currentLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  currentVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
});
