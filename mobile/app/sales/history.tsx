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
import { Search, RotateCcw, FileText, ArrowLeft } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function SalesHistoryScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
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

  const renderSale = ({ item, index }: { item: any; index: number }) => {
    const tint = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <View style={[styles.card, { backgroundColor: tint }]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.saleNumber}>{item.saleNumber}</Text>
            <Text style={styles.customerText}>
              {item.customerName || (language === 'te' ? 'కౌంటర్ కస్టమర్' : 'Walk-in')} • {formatDate(item.createdAt)}
            </Text>
          </View>
          <Badge
            label={item.customerType === 'RESELLER' ? t('reseller') : t('retail')}
            variant={item.customerType === 'RESELLER' ? 'reseller' : 'retail'}
          />
        </View>

        {/* Items count & Payment Method */}
        <View style={styles.detailsRow}>
          <Text style={styles.detailsText}>
            {item.lineItems?.length || 0} {language === 'te' ? 'సరుకులు' : 'items'} • {item.paymentDetails?.method || 'CASH'}
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
            <Text style={styles.actionBtnText}>
              {language === 'te' ? 'రసీదు చూడండి' : 'View Receipt'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.returnBtn]}
            onPress={() => router.push({ pathname: '/returns/new', params: { saleId: item._id } })}
          >
            <RotateCcw size={14} color="#A2591F" />
            <Text style={[styles.actionBtnText, { color: '#A2591F' }]}>
              {language === 'te' ? 'రిటర్న్ ప్రాసెస్' : 'Return'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.darkForest} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'te' ? 'అమ్మకాల చరిత్ర & రసీదులు' : 'Sales History & Bills'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            language === 'te'
              ? 'బిల్లు నంబర్ లేదా కస్టమర్ పేరు వెతకండి...'
              : 'Search by bill number or customer name...'
          }
          placeholderTextColor="#9EA8A1"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Customer Type Filters */}
      <View style={styles.filterRow}>
        {(['ALL', 'RESELLER', 'RETAIL'] as const).map((type) => {
          const labelMap: Record<string, string> = {
            ALL: language === 'te' ? 'అన్ని బిల్లులు' : 'All Sales',
            RESELLER: `🏢 ${t('reseller')}`,
            RETAIL: `🛍️ ${t('retail')}`,
          };
          return (
            <TouchableOpacity
              key={type}
              style={[styles.chip, typeFilter === type && styles.activeChip]}
              onPress={() => setTypeFilter(type)}
            >
              <Text style={[styles.chipText, typeFilter === type && styles.activeChipText]}>
                {labelMap[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
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
              title={language === 'te' ? 'అమ్మకాలు లేవు' : 'No Sales Found'}
              description={
                language === 'te'
                  ? 'ఈ ఫిల్టర్ కింద ఎలాంటి అమ్మకాలు నమోదు కాలేదు.'
                  : 'No sales match your current search or filter criteria.'
              }
              actionTitle={language === 'te' ? 'కొత్త సేల్ చేయండి' : 'Start a Sale'}
              onActionPress={() => router.push('/(tabs)/sell')}
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
  filterRow: {
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
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E6EFE9',
    shadowColor: '#102A20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  saleNumber: {
    fontSize: 15,
    fontWeight: '900',
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
    backgroundColor: '#FFFFFF99',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 6,
  },
  detailsText: {
    fontSize: 11.5,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  actionRow: {
    flexDirection: 'row',
    paddingTop: 6,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0EAE4',
    gap: 6,
  },
  returnBtn: {
    borderColor: '#F6E4CA',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primary,
  },
});
