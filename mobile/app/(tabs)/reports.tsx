import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  BarChart,
  PieChart,
  Calendar,
  Layers,
  Info,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiClient } from '../../src/api/client';
import { Colors, Spacing } from '../../src/theme/colors';
import { Header } from '../../src/components/Header';
import { Card } from '../../src/components/Card';
import { MetricCard } from '../../src/components/MetricCard';
import { formatCurrency } from '../../src/utils/format';

export default function ReportsScreen() {
  const { isOwner } = useAuth();
  const [range, setRange] = useState<'today' | '7days' | '30days'>('today');

  const { data: salesReport, isLoading: salesLoading, refetch, isRefetching } = useQuery({
    queryKey: ['sales-report', range],
    queryFn: async () => {
      let startDate: string | undefined;
      const now = new Date();
      if (range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (range === '7days') {
        startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      } else if (range === '30days') {
        startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      }

      const res = await apiClient.get(`/reports/sales?startDate=${startDate || ''}`);
      return res.data?.data;
    },
  });

  const { data: profitReport } = useQuery({
    queryKey: ['profit-report', range],
    queryFn: async () => {
      let startDate: string | undefined;
      const now = new Date();
      if (range === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      } else if (range === '7days') {
        startDate = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      } else if (range === '30days') {
        startDate = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      }

      const res = await apiClient.get(`/reports/profit?startDate=${startDate || ''}`);
      return res.data?.data;
    },
    enabled: isOwner,
  });

  const totalSales = salesReport?.totalSalesAmount || 0;
  const resellerSales = salesReport?.resellerTotal || 0;
  const retailSales = salesReport?.retailTotal || 0;
  const paymentBreakdown = salesReport?.paymentMethodBreakdown || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Business Reports" subtitle="Sales performance & estimated profitability" />

      {/* Date Range Selector */}
      <View style={styles.rangeRow}>
        {(['today', '7days', '30days'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeBtn, range === r && styles.activeRangeBtn]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.activeRangeBtnText]}>
              {r === 'today' && 'Today'}
              {r === '7days' && 'Past 7 Days'}
              {r === '30days' && 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {/* KPI Metrics */}
        <View style={styles.kpiRow}>
          <MetricCard
            label="Total Gross Sales"
            value={formatCurrency(totalSales)}
            subtitle={`${salesReport?.totalSalesCount || 0} completed orders`}
            bgVariant="mint"
            icon={<TrendingUp size={18} color={Colors.primary} />}
          />

          {isOwner && profitReport && (
            <MetricCard
              label="Est. Gross Profit"
              value={formatCurrency(profitReport.totalEstimatedGrossProfit)}
              subtitle={`Margin: ${profitReport.overallGrossMarginPercent}%`}
              bgVariant="cream"
              icon={<TrendingUp size={18} color="#A2591F" />}
            />
          )}
        </View>

        {/* Reseller vs Retail Split */}
        <Card>
          <Text style={styles.cardHeading}>Customer Sales Distribution</Text>
          <Text style={styles.cardSubtitle}>
            Comparing wholesale/reseller volume against normal retail customers
          </Text>

          <View style={styles.distributionRow}>
            <View style={styles.distBlock}>
              <View style={[styles.colorDot, { backgroundColor: Colors.darkForest }]} />
              <View>
                <Text style={styles.distLabel}>Reseller / Wholesale</Text>
                <Text style={styles.distValue}>{formatCurrency(resellerSales)}</Text>
                <Text style={styles.distPercent}>
                  {totalSales > 0 ? ((resellerSales / totalSales) * 100).toFixed(1) : 0}% of sales
                </Text>
              </View>
            </View>

            <View style={styles.distDivider} />

            <View style={styles.distBlock}>
              <View style={[styles.colorDot, { backgroundColor: '#C9892B' }]} />
              <View>
                <Text style={styles.distLabel}>Retail / Normal</Text>
                <Text style={styles.distValue}>{formatCurrency(retailSales)}</Text>
                <Text style={styles.distPercent}>
                  {totalSales > 0 ? ((retailSales / totalSales) * 100).toFixed(1) : 0}% of sales
                </Text>
              </View>
            </View>
          </View>

          {/* Visual Progress Bar */}
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFillReseller,
                {
                  flex: resellerSales > 0 ? resellerSales : 1,
                },
              ]}
            />
            <View
              style={[
                styles.progressFillRetail,
                {
                  flex: retailSales > 0 ? retailSales : 1,
                },
              ]}
            />
          </View>
        </Card>

        {/* Payment Channels Breakdown */}
        <Card>
          <Text style={styles.cardHeading}>Payment Methods Breakdown</Text>
          <View style={styles.paymentMethodsGrid}>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>💵 Cash</Text>
              <Text style={styles.payAmount}>{formatCurrency(paymentBreakdown.CASH || 0)}</Text>
            </View>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>📱 UPI</Text>
              <Text style={styles.payAmount}>{formatCurrency(paymentBreakdown.UPI || 0)}</Text>
            </View>
            <View style={styles.paymentBox}>
              <Text style={styles.payName}>💳 Card / Split</Text>
              <Text style={styles.payAmount}>
                {formatCurrency((paymentBreakdown.CARD || 0) + (paymentBreakdown.SPLIT || 0))}
              </Text>
            </View>
          </View>
        </Card>

        {/* Costing Engine Note */}
        {isOwner && (
          <View style={styles.accountingNote}>
            <Info size={16} color={Colors.darkForest} />
            <Text style={styles.accountingText}>
              Profit calculation method: <Text style={{ fontWeight: '700' }}>FIFO Batch Costing</Text>.
              {profitReport?.disclaimer}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.lightMint,
  },
  rangeRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borders,
    alignItems: 'center',
  },
  activeRangeBtn: {
    backgroundColor: Colors.darkForest,
    borderColor: Colors.darkForest,
  },
  rangeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  activeRangeBtnText: {
    color: Colors.white,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkForest,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: Spacing.md,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  distBlock: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  distLabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  distValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkForest,
    marginTop: 2,
  },
  distPercent: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  distDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.borders,
    marginHorizontal: 8,
  },
  progressBar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: Spacing.md,
    backgroundColor: Colors.borders,
  },
  progressFillReseller: {
    backgroundColor: Colors.darkForest,
  },
  progressFillRetail: {
    backgroundColor: '#C9892B',
  },
  paymentMethodsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  paymentBox: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borders,
  },
  payName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.darkForest,
  },
  payAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkForest,
    marginTop: 4,
  },
  accountingNote: {
    flexDirection: 'row',
    backgroundColor: '#E5F3E9',
    padding: 12,
    borderRadius: 12,
    marginTop: Spacing.sm,
    gap: 8,
    alignItems: 'flex-start',
  },
  accountingText: {
    flex: 1,
    fontSize: 11,
    color: Colors.darkForest,
    lineHeight: 16,
  },
});
