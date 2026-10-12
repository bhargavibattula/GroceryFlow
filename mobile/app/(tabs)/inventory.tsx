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
import { Search, Plus, Package, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useLanguage } from '../../src/context/LanguageContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { PriceTag } from '../../src/components/PriceTag';
import { EmptyState } from '../../src/components/EmptyState';

function getProductEmoji(sku: string, name: string): string {
  const upper = (sku + ' ' + name).toUpperCase();
  if (upper.includes('RICE')) return '🍚';
  if (upper.includes('DAL')) return '🥣';
  if (upper.includes('SUGAR')) return '🧂';
  if (upper.includes('OIL')) return '🌻';
  if (upper.includes('ATTA') || upper.includes('FLOUR') || upper.includes('WHEAT')) return '🌾';
  if (upper.includes('BISCUIT') || upper.includes('PARLE')) return '🍪';
  if (upper.includes('SOAP')) return '🧼';
  if (upper.includes('TEA') || upper.includes('COFFEE')) return '☕';
  return '📦';
}

export default function InventoryScreen() {
  const router = useRouter();
  const { isOwner } = useAuth();
  const { language, t } = useLanguage();

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

  const renderProductItem = ({ item, index }: { item: any; index: number }) => {
    const isOut = item.availableQuantity <= 0;
    const isLow = item.availableQuantity <= item.lowStockThreshold && !isOut;
    const emoji = getProductEmoji(item.sku, item.name);
    const tintBg = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/product/${item._id}`)}
      >
        <View style={[styles.productCard, { backgroundColor: tintBg }]}>
          <View style={styles.cardHeader}>
            <View style={styles.productLeft}>
              <View style={styles.emojiCircle}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productSku}>
                  SKU: {item.sku} {item.brand ? `• ${item.brand}` : ''}
                </Text>
              </View>
            </View>

            <Badge
              label={
                isOut
                  ? t('outOfStock')
                  : isLow
                  ? t('lowStock')
                  : t('inStock')
              }
              variant={isOut ? 'error' : isLow ? 'warning' : 'success'}
            />
          </View>

          {/* Stock Level Bar */}
          <View style={styles.stockRow}>
            <Text style={styles.stockLabel}>{t('availableStock')}:</Text>
            <View style={styles.stockValueBadge}>
              <Text
                style={[
                  styles.stockValue,
                  isOut ? { color: Colors.error } : isLow ? { color: Colors.warning } : null,
                ]}
              >
                {item.availableQuantity} {item.baseUnit}
              </Text>
            </View>
          </View>

          {/* Dual-Pricing Display */}
          <PriceTag
            resellerPrice={item.resellerPrice}
            retailPrice={item.retailPrice}
            unit={item.baseUnit}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={language === 'te' ? 'స్టోర్ ఇన్వెంటరీ' : 'Store Inventory'}
        subtitle={
          language === 'te'
            ? 'సరుకులు, బ్యాచ్‌లు & డ్యూయల్-ధరల నిర్వహణ'
            : 'Manage products, batches & dual pricing'
        }
        rightAction={
          isOwner ? (
            <TouchableOpacity
              style={styles.headerAddBtn}
              onPress={() => router.push('/product/add')}
            >
              <Plus size={16} color={Colors.white} />
              <Text style={styles.headerAddText}>{t('addItem')}</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            language === 'te'
              ? 'సరుకు పేరు, SKU లేదా బార్‌కోడ్ వెతకండి...'
              : 'Search by name, SKU, or barcode...'
          }
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
            {language === 'te' ? 'అన్ని సరుకులు' : 'All Products'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterType === 'LOW' && styles.activeChip]}
          onPress={() => setFilterType('LOW')}
        >
          <Text style={[styles.chipText, filterType === 'LOW' && styles.activeChipText]}>
            ⚠️ {t('lowStock')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, filterType === 'OUT' && styles.activeChip]}
          onPress={() => setFilterType('OUT')}
        >
          <Text style={[styles.chipText, filterType === 'OUT' && styles.activeChipText]}>
            ❌ {t('outOfStock')}
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
              title={language === 'te' ? 'సరుకులు కనుగొనబడలేదు' : 'No Products Found'}
              description={
                search
                  ? language === 'te'
                    ? `"${search}" పేరుతో ఎలాంటి సరుకులు లేవు.`
                    : `No matches for "${search}". Try searching another name or SKU.`
                  : language === 'te'
                  ? 'షాపులో ఇంకా సరుకులు నమోదు కాలేదు.'
                  : 'Your inventory catalog is currently empty.'
              }
              actionTitle={isOwner ? t('addItem') : undefined}
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
    backgroundColor: Colors.mintBackground,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  headerAddText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borders,
    marginBottom: Spacing.xs,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13.5,
    color: Colors.mainText,
  },
  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  activeChip: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeChipText: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 90, // Leave room for floating dock
  },
  productCard: {
    borderRadius: 22,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  emojiText: {
    fontSize: 22,
  },
  nameContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: Colors.darkForest,
  },
  productSku: {
    fontSize: 11,
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
    fontWeight: '600',
  },
  stockValueBadge: {
    backgroundColor: '#FFFFFFCC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: Colors.darkForest,
  },
});
