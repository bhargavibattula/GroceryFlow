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
import { ArrowLeft, Plus, Truck, Package } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useLanguage } from '../../src/context/LanguageContext';
import { Colors, Spacing } from '../../src/theme/colors';
import { Badge } from '../../src/components/Badge';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency, formatDate } from '../../src/utils/format';

export default function PurchaseHistoryScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const { data: purchases = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['purchases-history-list'],
    queryFn: async () => {
      const res = await apiClient.get('/purchases');
      return res.data?.data || [];
    },
  });

  const renderPurchaseItem = ({ item, index }: { item: any; index: number }) => {
    const tint = Colors.cardTints[index % Colors.cardTints.length];

    return (
      <View style={[styles.card, { backgroundColor: tint }]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
            <Text style={styles.supplierText}>
              {item.supplierNameSnapshot || (language === 'te' ? 'డైరెక్ట్ సప్లయర్' : 'Direct Supplier')} • {formatDate(item.purchasedAt)}
            </Text>
          </View>
          <Badge label={item.paymentStatus || 'PAID'} variant="success" />
        </View>

        {/* Line items preview */}
        <View style={styles.linesList}>
          {item.lineItems?.map((line: any, idx: number) => (
            <View key={idx} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={1}>
                📦 {line.productNameSnapshot} ({line.quantity} {line.purchaseUnit})
              </Text>
              <Text style={styles.lineCost}>
                {language === 'te' ? 'ల్యాండెడ్' : 'Landed'}: {formatCurrency(line.landedCostPerBaseUnit)}/unit
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.transportText}>
            {language === 'te' ? 'రవాణా/హమాలీ' : 'Freight/Labor'}: {formatCurrency((item.additionalCosts?.transportation || 0) + (item.additionalCosts?.loading || 0))}
          </Text>
          <Text style={styles.grandTotalText}>
            {language === 'te' ? 'మొత్తం' : 'Total'}: {formatCurrency(item.grandTotal)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.darkForest} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {language === 'te' ? 'హోల్‌సేల్ కొనుగోళ్లు' : 'Bulk Purchases'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/purchase/record')}
        >
          <Plus size={16} color={Colors.white} />
          <Text style={styles.addBtnText}>
            {language === 'te' ? 'కొత్తది' : 'New'}
          </Text>
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
              title={language === 'te' ? 'కొనుగోళ్లు లేవు' : 'No Purchases Recorded'}
              description={
                language === 'te'
                  ? 'సప్లయర్ల నుండి కొనుగోలు చేసిన సరుకుల వివరాలను నమోదు చేయండి.'
                  : 'Record bulk purchases with supplier invoices and freight expenses.'
              }
              actionTitle={language === 'te' ? 'మొదటి కొనుగోలును నమోదు చేయండి' : 'Record First Purchase'}
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
    backgroundColor: Colors.mintBackground,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontSize: 18,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 12.5,
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
  invoiceNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.darkForest,
  },
  supplierText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  linesList: {
    backgroundColor: '#FFFFFF99',
    borderRadius: 14,
    padding: 10,
    marginVertical: 6,
  },
  lineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  lineName: {
    fontSize: 12,
    color: Colors.darkForest,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  lineCost: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primary,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  transportText: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  grandTotalText: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.darkForest,
  },
});
