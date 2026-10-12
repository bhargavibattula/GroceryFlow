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
import { Search, Plus, Filter, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { PriceTag } from '../../src/components/PriceTag';
import { EmptyState } from '../../src/components/EmptyState';

export default function InventoryScreen() {
  const router = useRouter();
  const { isOwner } = useAuth();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products-list', search, filterType],
    queryFn: async () => {
      let url = `/products?search=${encodeURIComponent(search)}`;
      if (filterType === 'LOW') url += '&lowStock=true';
      if (filterType === 'OUT') url += '&outOfStock=true';
      const res = await apiClient.get(url);
      return res.data?.data || [];
    },
  });

  const renderProductItem = ({ item }: { item: any }) => {
    const isOut = item.availableQuantity <= 0;
    const isLow = item.availableQuantity <= item.lowStockThreshold && !isOut;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/product/${item._id}`)}
      >
        <Card style={styles.productCard}>
          <View style={styles.cardHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productSku}>
                SKU: {item.sku} {item.brand ? `• ${item.brand}` : ''}
              </Text>
            </View>
            <Badge
              label={isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
              variant={isOut ? 'error' : isLow ? 'warning' : 'success'}
            />
          </View>

          {/* Available Stock & Units */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>Available Stock:</Text>
            <Text
              style={[
                styles.stockValue,
                isOut ? { color: Colors.error } : isLow ? { color: Colors.warning } : null,
              ]}
            >
              {item.availableQuantity} {item.baseUnit}
            </Text>
          </View>

          {/* Dual-Pricing Display */}
          <PriceTag
            resellerPrice={item.resellerPrice}
            retailPrice={item.retailPrice}
            unit={item.baseUnit}
          />
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title="Store Inventory"
        subtitle="Manage products, batches & dual pricing"
        rightAction={
          isOwner ? (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => router.push('/product/add')}
            >
              <Plus size={18} color={Colors.white} />
              <Text style={styles.headerAddText}>Add</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, SKU, or barcode..."
          placeholderTextColor="#9EA8A1"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        <TouchableOpacity
          style={[styles.chip, filterType === 'ALL' && styles.activeChip]}
          onPress={() => setFilterType('ALL')}
        >
          <Text style={[styles.chipText, filterType === 'ALL' && styles.activeChipText]}>
            All Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterType === 'LOW' && styles.activeChip]}
          onPress={() => setFilterType('LOW')}
        >
          <Text style={[styles.chipText, filterType === 'LOW' && styles.activeChipText]}>
            ⚠️ Low Stock
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterType === 'OUT' && styles.activeChip]}
          onPress={() => setFilterType('OUT')}
        >
          <Text style={[styles.chipText, filterType === 'OUT' && styles.activeChipText]}>
            ❌ Out of Stock
          </Text>
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Products Found"
              description={
                search
                  ? `No matches for "${search}". Try searching another name or SKU.`
                  : 'Your inventory catalog is currently empty.'
              }
              actionTitle={isOwner ? 'Add First Product' : undefined}
              onActionPress={() => router.push('/product/add')}
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
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  headerAddText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
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
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
  productCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
  },
  productSku: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  stockLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
  },
});
