import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Search, RotateCcw, FileText, ArrowRight } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function SalesHistoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RESELLER' | 'RETAIL'>('ALL');

  const { data: sales = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales-history-list', search, typeFilter],
    queryFn: async () => {
      let url = `/sales?search=${encodeURIComponent(search)}`;
      if (typeFilter !== 'ALL') url += `&customerType=${typeFilter}`;
      const res = await apiClient.get(url);
      return res.data?.data || [];
    },
  });

  const renderSale = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View>
          <Text style={styles.saleNumber}>{item.saleNumber}</Text>
          <Text style={styles.customerText}>
            {item.customerName || 'Walk-in'} • {formatDate(item.createdAt)}
          </Text>
        </View>
        <Badge
          label={item.customerType}
          variant={item.customerType === 'RESELLER' ? 'reseller' : 'retail'}
        />
      </View>

      {/* Items count & Payment Method */}
      <View style={styles.detailsRow}>
        <Text style={styles.detailsText}>
          {item.lineItems?.length || 0} product(s) • Paid via {item.paymentDetails?.method || 'CASH'}
        </Text>
        <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
      </View>

      {/* Action shortcuts */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/sell/receipt', params: { saleId: item._id } })}
        >
          <FileText size={14} color={Colors.primary} />
          <Text style={styles.actionBtnText}>View Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { marginLeft: 12 }]}
          onPress={() => router.push({ pathname: '/returns/new', params: { saleId: item._id } })}
        >
          <RotateCcw size={14} color="#A2591F" />
          <Text style={[styles.actionBtnText, { color: '#A2591F' }]}>Process Return</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by sale number or customer name..."
          placeholderTextColor="#9EA8A1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Customer Type Filters */}
      <View style={styles.filterRow}>
        {(['ALL', 'RESELLER', 'RETAIL'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, typeFilter === type && styles.activeChip]}
            onPress={() => setTypeFilter(type)}
          >
            <Text style={[styles.chipText, typeFilter === type && styles.activeChipText]}>
              {type === 'ALL' && 'All Sales'}
              {type === 'RESELLER' && '🏢 Reseller Sales'}
              {type === 'RETAIL' && '🛍️ Retail Sales'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item._id}
        renderItem={renderSale}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Sales Found"
              description="No sales match your search and filter criteria."
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.mainText,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeChip: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  activeChipText: {
    color: Colors.white,
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
  saleNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  customerText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailsText: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  totalText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borders,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
