import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Truck, ArrowLeft, Plus } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function PurchaseHistoryScreen() {
  const router = useRouter();

  const { data: purchases = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['purchases-history-list'],
    queryFn: async () => {
      const res = await apiClient.get('/purchases');
      return res.data?.data || [];
    },
  });

  const renderPurchaseItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
          <Text style={styles.supplierText}>
            {item.supplierNameSnapshot || 'Direct Supplier'} • {formatDate(item.purchasedAt)}
          </Text>
        </View>
        <Badge label={item.paymentStatus || 'PAID'} variant="success" />
      </View>

      {/* Line items preview */}
      <View style={styles.linesList}>
        {item.lineItems?.map((line: any, idx: number) => (
          <View key={idx} style={styles.lineRow}>
            <Text style={styles.lineName} numberOfLines={1}>
              {line.productNameSnapshot} ({line.quantity} {line.purchaseUnit})
            </Text>
            <Text style={styles.lineCost}>
              Landed: {formatCurrency(line.landedCostPerBaseUnit)}/unit
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.transportText}>
          Transport/Labor: {formatCurrency((item.additionalCosts?.transportation || 0) + (item.additionalCosts?.loading || 0))}
        </Text>
        <Text style={styles.grandTotalText}>
          Total: {formatCurrency(item.grandTotal)}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Purchase History & Batches</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/purchase/record')}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>New Purchase</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={purchases}
        keyExtractor={(item) => item._id}
        renderItem={renderPurchaseItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Purchases Recorded"
              description="Record bulk purchases with supplier invoices and freight expenses."
              actionTitle="Record First Purchase"
              onActionPress={() => router.push('/purchase/record')}
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  card: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  supplierText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  linesList: {
    backgroundColor: Colors.surfaceLight,
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  lineName: {
    fontSize: 12,
    color: Colors.mainText,
    flex: 1,
  },
  lineCost: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.borders,
  },
  transportText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  grandTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
});
